<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;

class MidtransController extends Controller
{
    public function __construct(private MidtransService $midtransService) {}

    /**
     * Create a Snap token for a pending booking.
     */
    public function createSnapToken(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'pending') {
            return response()->json([
                'message' => 'Booking ini tidak dalam status pending.',
            ], 422);
        }

        $payment = $booking->payment;

        // If there's already a valid snap token, return it
        if ($payment && $payment->snap_token && $payment->expired_at?->isFuture()) {
            return response()->json([
                'snap_token' => $payment->snap_token,
                'order_id' => $payment->midtrans_order_id,
            ]);
        }

        $result = $this->midtransService->createSnapToken($booking);

        // Update payment with Midtrans data
        if ($payment) {
            $payment->update([
                'method' => 'midtrans',
                'snap_token' => $result['snap_token'],
                'midtrans_order_id' => $result['order_id'],
                'expired_at' => now()->addMinutes(30),
            ]);
        } else {
            $booking->payment()->create([
                'method' => 'midtrans',
                'amount' => $booking->total_price,
                'status' => 'pending',
                'snap_token' => $result['snap_token'],
                'midtrans_order_id' => $result['order_id'],
                'expired_at' => now()->addMinutes(30),
            ]);
        }

        return response()->json([
            'snap_token' => $result['snap_token'],
            'order_id' => $result['order_id'],
        ]);
    }
}
