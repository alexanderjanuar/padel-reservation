<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    private string $token;

    private string $apiUrl = 'https://api.fonnte.com/send';

    public function __construct()
    {
        $this->token = config('services.fonnte.token');
    }

    /**
     * Normalise a phone number to international format (Indonesian default).
     * e.g. "08221234567" → "628221234567"
     */
    private function normalisePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            $phone = '62'.substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Send a WhatsApp booking notification to the customer.
     */
    public function sendBookingNotification(Booking $booking): void
    {
        $user = $booking->user;
        $court = $booking->court;
        $venue = $court->venue;

        if (empty($user->phone)) {
            Log::warning('FonnteService: User has no phone number.', ['user_id' => $user->id]);

            return;
        }

        $phone = $this->normalisePhone($user->phone);
        $date = $booking->date->format('d-m-Y');
        $price = 'Rp '.number_format($booking->total_price, 0, ',', '.');
        $status = ucfirst($booking->status);

        $message = "Halo {$user->name}! Booking Anda telah berhasil dibuat. ✅\n\n"
            ."📅 Tanggal  : {$date}\n"
            ."⏰ Waktu    : {$booking->start_time} - {$booking->end_time}\n"
            ."🏟️ Lapangan : {$court->name} - {$venue->name}\n"
            ."💰 Total    : {$price}\n"
            ."📌 Status   : {$status}\n\n"
            .'Terima kasih telah memesan di Padel Reservation! 🎾';

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->asMultipart()->post($this->apiUrl, [
                ['name' => 'target', 'contents' => $phone],
                ['name' => 'message', 'contents' => $message],
                ['name' => 'countryCode', 'contents' => '62'],
                ['name' => 'delay', 'contents' => '2'],
                ['name' => 'schedule', 'contents' => '0'],
            ]);

            if (! $response->successful()) {
                Log::error('FonnteService: Failed to send WA message.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('FonnteService: Exception when sending WA message.', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
