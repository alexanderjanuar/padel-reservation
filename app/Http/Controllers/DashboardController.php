<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the user dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get upcoming bookings
        $upcomingBookings = $user->bookings()
            ->with(['court.venue', 'court.sport'])
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['confirmed', 'pending'])
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get();

        // Get total bookings count
        $totalBookings = $user->bookings()->count();

        // Get recent activity (past bookings)
        $pastBookings = $user->bookings()
            ->with(['court.venue', 'court.sport'])
            ->where('date', '<', now()->toDateString())
            ->whereIn('status', ['completed', 'confirmed', 'cancelled'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->take(5)
            ->get();

        // Determine user's favorite venue based on past bookings, if any
        $favoriteVenue = null;
        if ($user->bookings()->count() > 0) {
            $mostBookedCourtId = $user->bookings()
                ->selectRaw('court_id, count(*) as count')
                ->groupBy('court_id')
                ->orderByDesc('count')
                ->first()
                ?->court_id;

            if ($mostBookedCourtId) {
                // Eager load the venue
                $court = \App\Models\Court::with('venue')->find($mostBookedCourtId);
                $favoriteVenue = $court?->venue?->name;
            }
        }

        if ($user->hasRole('admin')) {
            // Admin receives different stats, these can be updated later with real metrics.
            return Inertia::render('Admin/Dashboard', [
                'stats' => [
                    'totalUsers' => \App\Models\User::count(),
                    'totalBookings' => \App\Models\Booking::count(),
                    'totalVenues' => \App\Models\Venue::count(),
                    'totalRevenue' => \App\Models\Booking::whereIn('status', ['confirmed', 'completed'])->sum('total_price'),
                ],
                'recentBookings' => \App\Models\Booking::with(['user', 'court.venue'])
                    ->latest('created_at')
                    ->take(5)
                    ->get(),
            ]);
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'totalBookings' => $totalBookings,
                'upcomingBookingsCount' => $upcomingBookings->count(),
                'favoriteVenue' => $favoriteVenue ?? '-',
            ],
            'upcomingBookings' => $upcomingBookings,
            'pastBookings' => $pastBookings,
        ]);
    }
}
