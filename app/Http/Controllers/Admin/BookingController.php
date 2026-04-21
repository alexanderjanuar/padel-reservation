<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use App\Services\FonnteService;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function __construct(
        private FonnteService $fonnteService,
        private MidtransService $midtransService,
    ) {}

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Resolve user: existing or create a guest user
        if (! empty($validated['user_id'])) {
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

        $conflict = $this->hasBookingConflict(
            $validated['court_id'],
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
        );

        if ($conflict) {
            return response()->json([
                'message' => 'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.',
            ], 422);
        }

        $court = Court::findOrFail($validated['court_id']);
        $calculatedPrice = $this->calculateBookingPrice(
            $court,
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
        );

        // The calculated price is still computed above, but we no longer enforce it
        // strictly matches the incoming total_price to allow for admin manual overrides.
        $finalPrice = isset($validated['total_price']) ? (int) $validated['total_price'] : $calculatedPrice;

        $paymentStatus = $validated['payment_status'];
        $isPaid = $paymentStatus === 'paid';
        $isMidtrans = $paymentStatus === 'midtrans';

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

        if ($isMidtrans) {
            $snapResult = $this->midtransService->createSnapToken($booking);

            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'midtrans',
                'amount' => $booking->total_price,
                'status' => 'pending',
                'snap_token' => $snapResult['snap_token'],
                'midtrans_order_id' => $snapResult['order_id'],
                'expired_at' => now()->addMinutes(30),
            ]);

            $booking->load(['user', 'court.venue']);

            return response()->json([
                'message' => 'Booking berhasil dibuat. Silakan lanjutkan pembayaran.',
                'booking' => $booking,
                'snap_token' => $snapResult['snap_token'],
            ], 201);
        }

        Payment::create([
            'booking_id' => $booking->id,
            'method' => $isPaid ? 'cash' : 'manual',
            'amount' => $booking->total_price,
            'status' => $isPaid ? 'paid' : 'pending',
            'paid_at' => $isPaid ? now() : null,
        ]);

        $booking->load(['user', 'court.venue', 'court.sport']);
        $this->fonnteService->sendBookingNotification($booking);

        return response()->json([
            'message' => $isPaid
                ? 'Booking berhasil dibuat.'
                : 'Permintaan booking berhasil dibuat. Admin akan follow up melalui WhatsApp.',
            'booking' => $booking,
        ], 201);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'court_id' => ['required', 'exists:courts,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'total_price' => ['nullable', 'integer', 'min:0'],
            'payment_status' => ['required', 'in:paid,unpaid'],
            'notes' => ['nullable', 'string'],
        ]);

        if (in_array($booking->status, ['cancelled', 'completed'], true)) {
            return response()->json(['message' => 'Booking ini tidak dapat diedit.'], 422);
        }

        $conflict = $this->hasBookingConflict(
            (int) $validated['court_id'],
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
            $booking->id,
            ['confirmed', 'completed'],
        );

        if ($conflict) {
            return response()->json([
                'message' => 'Slot waktu tersebut sudah dibooking. Silakan pilih waktu lain.',
            ], 422);
        }

        $court = Court::findOrFail($validated['court_id']);
        $calculatedPrice = $this->calculateBookingPrice(
            $court,
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
        );
        $finalPrice = isset($validated['total_price']) ? (int) $validated['total_price'] : $calculatedPrice;
        $isPaid = $validated['payment_status'] === 'paid';

        $booking->update([
            'user_id' => $validated['user_id'],
            'court_id' => $validated['court_id'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_price' => $finalPrice,
            'status' => $isPaid ? 'confirmed' : 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($booking->payment) {
            $booking->payment->update([
                'method' => $isPaid ? 'cash' : 'manual',
                'amount' => $finalPrice,
                'status' => $isPaid ? 'paid' : 'pending',
                'paid_at' => $isPaid ? now() : null,
            ]);
        } else {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => $isPaid ? 'cash' : 'manual',
                'amount' => $finalPrice,
                'status' => $isPaid ? 'paid' : 'pending',
                'paid_at' => $isPaid ? now() : null,
            ]);
        }

        $booking->load(['user', 'court.venue', 'court.sport', 'payment']);

        return response()->json([
            'message' => 'Booking berhasil diperbarui.',
            'booking' => $booking,
        ]);
    }

    public function uploadProof(Booking $booking, Request $request): JsonResponse
    {
        $request->validate([
            'proof' => ['required', 'file', 'image', 'max:10240'],
        ]);

        $path = $request->file('proof')->store('payment-proofs', 'public');

        $payment = $booking->payment;

        if ($payment) {
            // Delete old file if exists
            if ($payment->proof_of_payment) {
                Storage::disk('public')->delete($payment->proof_of_payment);
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

    public function confirm(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'price_mode' => ['required', 'in:system,manual'],
            'total_price' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validated['price_mode'] === 'manual' && ! array_key_exists('total_price', $validated)) {
            return response()->json(['message' => 'Harga manual wajib diisi sebelum booking dikonfirmasi.'], 422);
        }

        if (! in_array($booking->status, ['pending'])) {
            return response()->json(['message' => 'Booking tidak dapat dikonfirmasi.'], 422);
        }

        $conflict = Booking::where('court_id', $booking->court_id)
            ->whereDate('date', $booking->date)
            ->whereIn('status', ['confirmed', 'completed'])
            ->where('id', '!=', $booking->id)
            ->where('start_time', '<', $booking->end_time)
            ->where('end_time', '>', $booking->start_time)
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'Slot ini sudah dikonfirmasi untuk booking lain. Tidak bisa dikonfirmasi ganda.'], 422);
        }

        $booking->loadMissing('court');

        $systemPrice = $this->calculateBookingPrice(
            $booking->court,
            $booking->date,
            $booking->start_time,
            $booking->end_time,
        );

        $finalPrice = $validated['price_mode'] === 'manual'
            ? (int) $validated['total_price']
            : $systemPrice;

        $booking->update([
            'status' => 'confirmed',
            'total_price' => $finalPrice,
        ]);

        if ($booking->payment) {
            $booking->payment->update([
                'amount' => $finalPrice,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        } else {
            Payment::create([
                'booking_id' => $booking->id,
                'method' => 'cash',
                'amount' => $booking->total_price,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        $booking->load(['user', 'court.venue', 'court.sport', 'payment']);
        $this->fonnteService->sendConfirmationNotification($booking);

        return response()->json([
            'message' => 'Booking berhasil dikonfirmasi.',
            'booking' => $booking,
        ]);
    }

    public function cancel(Booking $booking): JsonResponse
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return response()->json(['message' => 'Booking tidak dapat dibatalkan.'], 422);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Booking berhasil dibatalkan.']);
    }

    private function calculateBookingPrice(Court $court, string $date, string $startTime, string $endTime): int
    {
        $dayOfWeek = (int) date('w', strtotime($date));
        $startHour = (int) explode(':', $startTime)[0];
        $endHour = (int) explode(':', $endTime)[0];
        $calculatedPrice = 0;

        $findRule = function (int $hour) use ($court, $dayOfWeek): ?array {
            $slotHour = sprintf('%02d:00', $hour);

            if (! is_array($court->pricing_rules)) {
                return null;
            }

            foreach ($court->pricing_rules as $rule) {
                if (in_array($dayOfWeek, $rule['days'] ?? []) &&
                    $slotHour >= $rule['start_time'] &&
                    $slotHour < $rule['end_time']) {
                    return $rule;
                }
            }

            return null;
        };

        $hour = $startHour;

        while ($hour < $endHour) {
            $rule = $findRule($hour);
            $slotPrice = $rule ? (int) $rule['price'] : $court->price_per_hour;

            if ($hour + 1 < $endHour && $rule !== null && ! empty($rule['price_2_hours'])) {
                $nextSlotHour = sprintf('%02d:00', $hour + 1);
                $nextInSameRule = $nextSlotHour >= $rule['start_time'] && $nextSlotHour < $rule['end_time'];

                if ($nextInSameRule) {
                    $calculatedPrice += (int) $rule['price_2_hours'];
                    $hour += 2;

                    continue;
                }
            }

            $calculatedPrice += $slotPrice;
            $hour++;
        }

        return $calculatedPrice;
    }

    private function hasBookingConflict(
        int $courtId,
        string $date,
        string $startTime,
        string $endTime,
        ?int $ignoreBookingId = null,
        array $statuses = ['pending', 'confirmed', 'completed'],
    ): bool {
        return Booking::query()
            ->where('court_id', $courtId)
            ->whereDate('date', $date)
            ->whereIn('status', $statuses)
            ->when($ignoreBookingId, fn ($query) => $query->where('id', '!=', $ignoreBookingId))
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();
    }
}
