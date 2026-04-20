<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
            'stats' => [
                'total' => Booking::count(),
                'pending' => Booking::where('status', 'pending')->count(),
                'confirmed' => Booking::where('status', 'confirmed')->count(),
                'today' => Booking::whereDate('date', now()->toDateString())->count(),
            ],
        ]);
    }
}
