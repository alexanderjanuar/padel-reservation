<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\FonnteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function __construct(private FonnteService $fonnteService)
    {
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Resolve user: existing or create a guest user
        if (!empty($validated['user_id'])) {
            $userId = $validated['user_id'];
        } else {
            $guestUser = User::firstOrCreate(
                ['email' => $validated['guest_email']],
                [
                    'name' => $validated['guest_name'],
                    'phone' => $validated['guest_phone'] ?? null,
                    'password' => Hash::make(Str::random(16)),
                ]
            );
            $userId = $guestUser->id;
        }

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

        // The calculated price is still computed above, but we no longer enforce it
        // strictly matches the incoming total_price to allow for admin manual overrides.
        $finalPrice = isset($validated['total_price']) ? (int) $validated['total_price'] : $calculatedPrice;

        $isPaid = $validated['payment_status'] === 'paid';

        $booking = Booking::create([
            'user_id' => $userId,
            'court_id' => $validated['court_id'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_price' => $finalPrice,
            'status' => $isPaid ? 'confirmed' : 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'method' => $isPaid ? 'cash' : 'qris',
            'amount' => $booking->total_price,
            'status' => $isPaid ? 'paid' : 'pending',
            'paid_at' => $isPaid ? now() : null,
        ]);

        $booking->load(['user', 'court.venue']);

        if ($isPaid) {
            $this->fonnteService->sendBookingNotification($booking);
        }

        return response()->json([
            'message' => 'Booking berhasil dibuat.',
            'booking' => $booking,
        ], 201);
    }

    public function uploadProof(Booking $booking, \Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'proof' => ['required', 'file', 'image', 'max:10240'],
        ]);

        $path = $request->file('proof')->store('payment-proofs', 'public');

        $payment = $booking->payment;

        if ($payment) {
            // Delete old file if exists
            if ($payment->proof_of_payment) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($payment->proof_of_payment);
            }
            $payment->update(['proof_of_payment' => $path]);
        } else {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'qris',
                'amount' => $booking->total_price,
                'status' => 'pending',
                'proof_of_payment' => $path,
            ]);
        }

        return response()->json(['message' => 'Bukti pembayaran berhasil diupload.']);
    }

    public function confirm(Booking $booking): JsonResponse
    {
        if (!in_array($booking->status, ['pending'])) {
            return response()->json(['message' => 'Booking tidak dapat dikonfirmasi.'], 422);
        }

        $booking->update(['status' => 'confirmed']);

        if ($booking->payment) {
            $booking->payment->update(['status' => 'paid', 'paid_at' => now()]);
        } else {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'cash',
                'amount' => $booking->total_price,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        $booking->load(['user', 'court.venue']);
        $this->fonnteService->sendConfirmationNotification($booking);

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
