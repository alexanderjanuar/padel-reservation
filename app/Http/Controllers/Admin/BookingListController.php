<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Inertia\Inertia;
use Inertia\Response;

class BookingListController extends Controller
{
    public function index(): Response
    {
        $bookings = Booking::with([
            'user:id,name,email,phone',
            'court:id,name,sport_id,venue_id',
            'court.sport:id,name',
            'court.venue:id,name,city',
            'payment:id,booking_id,method,status',
        ])
            ->latest()
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'date' => $booking->date->format('Y-m-d'),
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'status' => $booking->status,
                'total_price' => $booking->total_price,
                'notes' => $booking->notes,
                'created_at' => $booking->created_at?->toISOString(),
                'user' => [
                    'id' => $booking->user?->id,
                    'name' => $booking->user?->name ?? 'Guest',
                    'email' => $booking->user?->email,
                    'phone' => $booking->user?->phone,
                ],
                'court' => [
                    'id' => $booking->court?->id,
                    'name' => $booking->court?->name,
                    'sport' => [
                        'id' => $booking->court?->sport?->id,
                        'name' => $booking->court?->sport?->name,
                    ],
                    'venue' => [
                        'id' => $booking->court?->venue?->id,
                        'name' => $booking->court?->venue?->name,
                        'city' => $booking->court?->venue?->city,
                    ],
                ],
                'payment' => [
                    'method' => $booking->payment?->method,
                    'status' => $booking->payment?->status,
                ],
            ])
            ->values();

        return Inertia::render('Admin/Bookings', [
            'bookings' => $bookings,
            'courts' => $this->getCourtsForDate(now()->toDateString()),
        ]);
    }

    private function getCourtsForDate(string $date)
    {
        return Court::with([
            'venue:id,name',
            'sport:id,name',
            'bookings' => function ($query) use ($date) {
                $query->where('date', $date)
                    ->whereIn('status', ['pending', 'confirmed', 'completed'])
                    ->with('user:id,name,phone')
                    ->select('id', 'court_id', 'user_id', 'start_time', 'end_time', 'status', 'total_price', 'notes');
            },
        ])
            ->orderBy('name')
            ->get()
            ->map(function (Court $court) {
                $bookedSlots = [];
                $slotMeta = [];

                foreach ($court->bookings as $booking) {
                    $startHour = (int) substr($booking->start_time, 0, 2);
                    $endHour = (int) substr($booking->end_time, 0, 2);

                    for ($h = $startHour; $h < $endHour; $h++) {
                        $slot = sprintf('%02d:00', $h);
                        $bookedSlots[] = $slot;
                        $slotMeta[$slot] = [
                            'booking_id' => $booking->id,
                            'customer' => $booking->user?->name ?? 'Guest',
                            'phone' => $booking->user?->phone ?? '—',
                            'start_time' => substr($booking->start_time, 0, 5),
                            'end_time' => substr($booking->end_time, 0, 5),
                            'status' => $booking->status,
                            'total_price' => $booking->total_price,
                            'notes' => $booking->notes,
                        ];
                    }
                }

                return [
                    'id' => $court->id,
                    'name' => $court->name,
                    'type' => $court->type,
                    'price_per_hour' => $court->price_per_hour,
                    'pricing_rules' => $court->pricing_rules,
                    'venue' => [
                        'id' => $court->venue?->id,
                        'name' => $court->venue?->name,
                    ],
                    'sport' => [
                        'id' => $court->sport?->id,
                        'name' => $court->sport?->name,
                    ],
                    'booked_slots' => array_values(array_unique($bookedSlots)),
                    'slot_meta' => $slotMeta,
                ];
            })
            ->values();
    }
}
