<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Notification;
use Midtrans\Snap;
use Midtrans\Transaction;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    /**
     * Generate a unique Midtrans order ID for a booking.
     */
    public function generateOrderId(Booking $booking): string
    {
        return 'PADEL-'.$booking->id.'-'.time();
    }

    /**
     * Create a Snap token for a booking.
     *
     * @return array{snap_token: string, order_id: string}
     */
    public function createSnapToken(Booking $booking): array
    {
        $booking->loadMissing(['user', 'court.venue']);

        $orderId = $this->generateOrderId($booking);

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => 'court-'.$booking->court_id,
                    'price' => $booking->total_price,
                    'quantity' => 1,
                    'name' => substr($booking->court->name.' - '.$booking->court->venue->name, 0, 50),
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->user->name,
                'email' => $booking->user->email,
                'phone' => $booking->user->phone ?? '',
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return [
            'snap_token' => $snapToken,
            'order_id' => $orderId,
        ];
    }

    /**
     * Parse and return a Midtrans notification instance.
     */
    public function parseNotification(): object
    {
        return new Notification;
    }

    /**
     * Verify the signature key from a Midtrans notification.
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        $serverKey = config('midtrans.server_key');
        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        return $expectedSignature === $signatureKey;
    }

    /**
     * Get the transaction status from Midtrans API.
     */
    public function getTransactionStatus(string $orderId): object
    {
        return Transaction::status($orderId);
    }

    /**
     * Process a Midtrans notification and update the payment/booking accordingly.
     */
    public function handleNotification(object $notification): void
    {
        $orderId = $notification->order_id;
        $transactionStatus = $notification->transaction_status;
        $fraudStatus = $notification->fraud_status ?? null;
        $paymentType = $notification->payment_type;
        $transactionId = $notification->transaction_id;

        $payment = Payment::where('midtrans_order_id', $orderId)->first();

        if (! $payment) {
            Log::warning('MidtransService: Payment not found for order.', ['order_id' => $orderId]);

            return;
        }

        $booking = $payment->booking;
        $payment->midtrans_transaction_id = $transactionId;

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $this->markAsPaid($payment, $booking);
            } elseif ($fraudStatus === 'challenge') {
                Log::info('MidtransService: Transaction challenged.', ['order_id' => $orderId]);
            } else {
                $this->markAsFailed($payment, $booking);
            }
        } elseif ($transactionStatus === 'settlement') {
            $this->markAsPaid($payment, $booking);
        } elseif ($transactionStatus === 'pending') {
            $payment->status = 'pending';
            $payment->save();
        } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
            $this->markAsFailed($payment, $booking);
        }
    }

    /**
     * Mark payment as paid and booking as confirmed.
     */
    private function markAsPaid(Payment $payment, Booking $booking): void
    {
        $payment->status = 'paid';
        $payment->paid_at = now();
        $payment->save();

        $booking->status = 'confirmed';
        $booking->save();

        try {
            app(FonnteService::class)->sendConfirmationNotification($booking);
        } catch (\Throwable $e) {
            Log::error('MidtransService: Failed to send WA notification.', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mark payment as failed and booking as cancelled.
     */
    private function markAsFailed(Payment $payment, Booking $booking): void
    {
        $payment->status = 'failed';
        $payment->save();

        $booking->status = 'cancelled';
        $booking->save();
    }
}
