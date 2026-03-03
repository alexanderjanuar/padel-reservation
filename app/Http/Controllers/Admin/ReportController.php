<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Sport;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function recap(Request $request)
    {
        $period = $request->query('period', 'month');

        $query = Booking::with('court.sport')
            ->whereHas('payment', function ($q) {
                $q->where('status', 'paid');
            })
            ->where('status', 'confirmed');

        $now = Carbon::now();
        $startDate = $now->copy()->startOfMonth();
        $endDate = $now->copy()->endOfMonth();
        $titlePeriod = 'BULAN ' . strtoupper($now->translatedFormat('F Y'));

        switch ($period) {
            case 'today':
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                $titlePeriod = strtoupper($now->translatedFormat('d F Y'));
                break;
            case 'week':
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                $weekStart = strtoupper($startDate->translatedFormat('d M'));
                $weekEnd = strtoupper($endDate->translatedFormat('d M Y'));
                $titlePeriod = "MINGGU KE-{$now->weekOfMonth} ($weekStart - $weekEnd)";
                break;
            case 'month':
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                $titlePeriod = 'BULAN ' . strtoupper($now->translatedFormat('F Y'));
                break;
            case 'year':
                $startDate = $now->copy()->startOfYear();
                $endDate = $now->copy()->endOfYear();
                $titlePeriod = 'TAHUN ' . $now->year;
                break;
            case 'custom':
                $startParam = $request->query('start_date');
                $endParam = $request->query('end_date');
                if ($startParam && $endParam) {
                    $startDate = Carbon::parse($startParam)->startOfDay();
                    $endDate = Carbon::parse($endParam)->endOfDay();

                    if ($startDate->isSameDay($endDate)) {
                        $titlePeriod = strtoupper($startDate->translatedFormat('d F Y'));
                    } else if ($startDate->isSameMonth($endDate)) {
                        $titlePeriod = strtoupper($startDate->translatedFormat('d')) . ' - ' . strtoupper($endDate->translatedFormat('d F Y'));
                    } else {
                        $titlePeriod = strtoupper($startDate->translatedFormat('d M Y')) . ' - ' . strtoupper($endDate->translatedFormat('d M Y'));
                    }
                }
                break;
            default:
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                $titlePeriod = 'BULAN ' . strtoupper($now->translatedFormat('F Y'));
                break;
        }

        // Fetch all relevant sports to create dynamic columns, ordered by name (or specific ID if needed)
        // Ensure "FUTSAL", "BADMINTON", "MINISOCCER" or whatever is in the DB shows up.
        $sports = Sport::orderBy('name')->get();

        $query->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
        $bookings = $query->orderBy('date', 'asc')->get();

        // Structure: $data[dateData] = [ 'Futsal' => 300000, 'Badminton' => ... ]
        $reportData = [];
        $sportTotals = [];

        foreach ($sports as $sport) {
            $sportTotals[$sport->name] = 0;
        }

        foreach ($bookings as $booking) {
            $dateFormatted = Carbon::parse($booking->date)->format('d/m/Y');
            $sportName = $booking->court->sport->name ?? 'Lainnya';

            if (!isset($reportData[$dateFormatted])) {
                $reportData[$dateFormatted] = [];
                foreach ($sports as $sport) {
                    $reportData[$dateFormatted][$sport->name] = 0;
                }
            }

            // Exclude PPN (if total_price already includes PPN technically we would deduct, but assuming total_price is the base price here based on the image's "TOTAL PENDAPATAN + 10% PPN").
            // Let's assume total_price in DB is the raw price.
            $price = $booking->total_price;

            $reportData[$dateFormatted][$sportName] += $price;
            $sportTotals[$sportName] += $price;
        }

        $grandTotal = array_sum($sportTotals);
        $ppn = $grandTotal * 0.10;
        $totalWithPpn = $grandTotal + $ppn;

        $pdf = Pdf::loadView('pdf.recap', [
            'reportData' => $reportData,
            'sports' => $sports,
            'sportTotals' => $sportTotals,
            'grandTotal' => $grandTotal,
            'ppn' => $ppn,
            'titlePeriod' => $titlePeriod,
            'totalWithPpn' => $totalWithPpn
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('Rekapan_Pendapatan_' . str_replace(' ', '_', $titlePeriod) . '.pdf');
    }
}
