<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\FonnteService;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function __construct(private FonnteService $fonnteService) {}

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Prevent double-booking: check if the slot is already taken
        $conflict = Booking::where('court_id', $validated['court_id'])
            ->whereDate('date', $validated['date'])
            ->where('start_time', $validated['start_time'])
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.',
            ], 422);
        }

        $court = \App\Models\Court::findOrFail($validated['court_id']);

        // Calculate expected price
        $dateStr = $validated['date'];
        $dayOfWeek = (int) date('w', strtotime($dateStr)); // 0 (Sun) to 6 (Sat)
        $startHour = (int) explode(':', $validated['start_time'])[0];
        $endHour = (int) explode(':', $validated['end_time'])[0];

        $calculatedPrice = 0;

        for ($h = $startHour; $h < $endHour; $h++) {
            $currentSlotHour = sprintf('%02d:00', $h);
            $slotPrice = $court->price_per_hour;

            if (is_array($court->pricing_rules)) {
                foreach ($court->pricing_rules as $rule) {
                    if (in_array($dayOfWeek, $rule['days'] ?? [])) {
                        if ($currentSlotHour >= $rule['start_time'] && $currentSlotHour < $rule['end_time']) {
                            $slotPrice = $rule['price'];
                            break; // use the first matching rule
                        }
                    }
                }
            }

            $calculatedPrice += $slotPrice;
        }

        if ($calculatedPrice !== (int) $validated['total_price']) {
            return response()->json([
                'message' => 'Total harga yang dikirimkan tidak sesuai dengan perhitungan sistem. Silakan refresh halaman.',
                'expected' => $calculatedPrice,
                'received' => $validated['total_price'],
            ], 422);
        }

        $booking = Booking::create([
            'user_id' => $validated['user_id'],
            'court_id' => $validated['court_id'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_price' => $calculatedPrice, // Use backend calculation just to be sure
            'status' => $validated['payment_status'] === 'paid' ? 'confirmed' : 'pending',
        ]);

        if ($validated['payment_status'] === 'paid') {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'cash',
                'amount' => $booking->total_price,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        $booking->load(['user', 'court.venue']);
        $this->fonnteService->sendBookingNotification($booking);

        return response()->json([
            'message' => 'Booking berhasil dibuat.',
            'booking' => $booking,
        ], 201);
    }

    public function confirm(Booking $booking): JsonResponse
    {
        if (! in_array($booking->status, ['pending'])) {
            return response()->json(['message' => 'Booking tidak dapat dikonfirmasi.'], 422);
        }

        $booking->update(['status' => 'confirmed']);

        if (! $booking->payment) {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'cash',
                'amount' => $booking->total_price,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Booking berhasil dikonfirmasi.']);
    }

    public function cancel(Booking $booking): JsonResponse
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return response()->json(['message' => 'Booking tidak dapat dibatalkan.'], 422);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Booking berhasil dibatalkan.']);
    }
}
