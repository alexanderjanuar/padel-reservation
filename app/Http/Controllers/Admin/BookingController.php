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

        $booking = Booking::create([
            'user_id' => $validated['user_id'],
            'court_id' => $validated['court_id'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_price' => $validated['total_price'],
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
}
