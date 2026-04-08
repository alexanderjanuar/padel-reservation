<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Sport;
use Inertia\Inertia;
use Inertia\Response;

class BookingPageController extends Controller
{
    public function __invoke(\Illuminate\Http\Request $request): Response
    {
        $date = $request->input('date', now()->toDateString());

        $courts = Court::with(['venue:id,name,images', 'sport:id,name'])
            ->withExists([
                'bookings as is_booked_now' => function ($query) use ($date) {
                    $query->where('date', $date)
                        ->where('start_time', '<=', now()->toTimeString())
                        ->where('end_time', '>', now()->toTimeString())
                        ->whereIn('status', ['pending', 'confirmed', 'completed']);
                },
            ])
            ->where('is_active', true)
            ->with([
                'bookings' => function ($query) use ($date) {
                    $query->where('date', $date)
                        ->whereIn('status', ['pending', 'confirmed', 'completed'])
                        ->select('id', 'court_id', 'start_time', 'end_time');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($court) {
                $bookedSlots = [];
                foreach ($court->bookings as $booking) {
                    $startHour = (int) substr($booking->start_time, 0, 2);
                    $endHour = (int) substr($booking->end_time, 0, 2);
                    for ($h = $startHour; $h < $endHour; $h++) {
                        $bookedSlots[] = sprintf('%02d:00', $h);
                    }
                }
                $court->booked_slots = array_values(array_unique($bookedSlots));
                unset($court->bookings);

                return $court;
            });

        $sports = Sport::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('booking', [
            'courts' => $courts,
            'sports' => $sports,
            'filters' => [
                'date' => $date,
                'sport' => $request->input('sport'),
            ],
        ]);
    }
}
