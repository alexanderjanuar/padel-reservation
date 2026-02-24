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
            $now = now();
            $last7DaysStart = $now->copy()->subDays(6)->startOfDay();
            $previous7DaysStart = $now->copy()->subDays(13)->startOfDay();
            $previous7DaysEnd = $now->copy()->subDays(7)->endOfDay();

            // Trend Helper Function
            $calculateTrend = function ($current, $previous) {
                if ($previous > 0) {
                    return round((($current - $previous) / $previous) * 100, 1);
                }

                return $current > 0 ? 100 : 0;
            };

            // Calculate metric totals & trends
            $totalUsers = \App\Models\User::count();
            $newUsersLast7Days = \App\Models\User::where('created_at', '>=', $last7DaysStart)->count();
            $newUsersPrev7Days = \App\Models\User::whereBetween('created_at', [$previous7DaysStart, $previous7DaysEnd])->count();
            $userTrend = $calculateTrend($newUsersLast7Days, $newUsersPrev7Days);

            $totalBookings = \App\Models\Booking::count();
            $newBookingsLast7Days = \App\Models\Booking::where('created_at', '>=', $last7DaysStart)->count();
            $newBookingsPrev7Days = \App\Models\Booking::whereBetween('created_at', [$previous7DaysStart, $previous7DaysEnd])->count();
            $bookingTrend = $calculateTrend($newBookingsLast7Days, $newBookingsPrev7Days);

            $totalVenues = \App\Models\Venue::count();
            $newVenuesLast7Days = \App\Models\Venue::where('created_at', '>=', $last7DaysStart)->count();
            $newVenuesPrev7Days = \App\Models\Venue::whereBetween('created_at', [$previous7DaysStart, $previous7DaysEnd])->count();
            $venueTrend = $calculateTrend($newVenuesLast7Days, $newVenuesPrev7Days);

            $totalRevenue = \App\Models\Booking::whereIn('status', ['confirmed', 'completed'])->sum('total_price');
            $revenueLast7Days = \App\Models\Booking::whereIn('status', ['confirmed', 'completed'])->where('created_at', '>=', $last7DaysStart)->sum('total_price');
            $revenuePrev7Days = \App\Models\Booking::whereIn('status', ['confirmed', 'completed'])->whereBetween('created_at', [$previous7DaysStart, $previous7DaysEnd])->sum('total_price');
            $revenueTrend = $calculateTrend($revenueLast7Days, $revenuePrev7Days);

            // Fetch daily raw data for last 7 days
            $fetchDailyCounts = function ($query) use ($last7DaysStart) {
                return $query->where('created_at', '>=', $last7DaysStart)
                    ->selectRaw('DATE(created_at) as date, count(*) as value')
                    ->groupBy('date')
                    ->get()
                    ->mapWithKeys(function ($item) {
                        return [\Carbon\Carbon::parse($item->date)->format('M d') => (int) $item->value];
                    });
            };

            $userDaily = $fetchDailyCounts(\App\Models\User::query());
            $venueDaily = $fetchDailyCounts(\App\Models\Venue::query());

            $bookingDaily = \App\Models\Booking::where('date', '>=', $last7DaysStart->toDateString())
                ->selectRaw('date, count(*) as value')
                ->groupBy('date')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [\Carbon\Carbon::parse($item->date)->format('M d') => (int) $item->value];
                });

            $revenueDaily = \App\Models\Booking::whereIn('status', ['confirmed', 'completed'])
                ->where('date', '>=', $last7DaysStart->toDateString())
                ->selectRaw('date, sum(total_price) as value')
                ->groupBy('date')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [\Carbon\Carbon::parse($item->date)->format('M d') => (int) $item->value];
                });

            // Ensure 7 days array
            $dates = collect(range(6, 0))->map(function ($days) {
                return now()->subDays($days)->format('M d');
            });

            $chartData = [
                'users' => $dates->map(fn ($d) => ['date' => $d, 'count' => $userDaily->get($d, 0)]),
                'venues' => $dates->map(fn ($d) => ['date' => $d, 'count' => $venueDaily->get($d, 0)]),
                'bookings' => $dates->map(fn ($d) => ['date' => $d, 'count' => $bookingDaily->get($d, 0)]),
                'revenue' => $dates->map(fn ($d) => ['date' => $d, 'revenue' => $revenueDaily->get($d, 0)]),
            ];

            return Inertia::render('Admin/Dashboard', [
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'userTrend' => $userTrend,
                    'totalBookings' => $totalBookings,
                    'bookingTrend' => $bookingTrend,
                    'totalVenues' => $totalVenues,
                    'venueTrend' => $venueTrend,
                    'totalRevenue' => $totalRevenue,
                    'revenueTrend' => $revenueTrend,
                ],
                'chartData' => $chartData,
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
