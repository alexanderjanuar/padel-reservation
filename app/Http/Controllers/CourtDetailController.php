<?php

namespace App\Http\Controllers;

use App\Models\Court;
use Inertia\Inertia;
use Inertia\Response;

class CourtDetailController extends Controller
{
    public function __invoke(Court $court): Response
    {
        $court->load([
            'sport:id,name',
            'venue:id,name,address,city,phone,description,images',
            'venue.facilities:id,name,icon',
            'bookings' => function ($query) {
                $query->whereIn('status', ['pending', 'confirmed', 'completed'])
                    ->whereDate('date', '>=', now()->toDateString())
                    ->select('id', 'court_id', 'date', 'start_time', 'end_time');
            },
        ]);

        $bookedSlotsByDate = [];
        foreach ($court->bookings as $booking) {
            $dateKey = $booking->date->format('Y-m-d');

            if (! isset($bookedSlotsByDate[$dateKey])) {
                $bookedSlotsByDate[$dateKey] = [];
            }

            $startHour = (int) substr($booking->start_time, 0, 2);
            $endHour = (int) substr($booking->end_time, 0, 2);

            for ($hour = $startHour; $hour < $endHour; $hour++) {
                $bookedSlotsByDate[$dateKey][] = sprintf('%02d:00', $hour);
            }
        }

        $court->booked_slots_by_date = collect($bookedSlotsByDate)
            ->map(fn (array $slots) => array_values(array_unique($slots)))
            ->all();

        $relatedCourts = Court::with(['venue:id,name', 'sport:id,name'])
            ->where('sport_id', $court->sport_id)
            ->where('id', '!=', $court->id)
            ->where('is_active', true)
            ->select('id', 'name', 'type', 'price_per_hour', 'sport_id', 'venue_id', 'images')
            ->limit(3)
            ->get();

        return Inertia::render('court-detail', [
            'court' => $court,
            'relatedCourts' => $relatedCourts,
        ]);
    }
}
