<?php

namespace App\Http\Controllers;

use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(private MidtransService $midtransService) {}

    /**
     * Handle incoming Midtrans payment notification.
     */
    public function __invoke(Request $request): Response
    {
        Log::info('MidtransWebhook: Received notification.', $request->all());

        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $signatureKey = $request->input('signature_key');

        if (! $this->midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('MidtransWebhook: Invalid signature.', ['order_id' => $orderId]);

            return response('Invalid signature', 403);
        }

        $notification = $this->midtransService->parseNotification();
        $this->midtransService->handleNotification($notification);

        return response('OK', 200);
    }
}
