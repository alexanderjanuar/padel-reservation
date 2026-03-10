<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Services\FonnteService;
use App\Services\MidtransService;

use function Pest\Laravel\mock;

beforeEach(function () {
    mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')->andReturnNull()
        ->shouldReceive('sendConfirmationNotification')->andReturnNull();

    $this->booking = Booking::factory()->create(['status' => 'pending']);
    $this->payment = Payment::factory()->create([
        'booking_id' => $this->booking->id,
        'method' => 'midtrans',
        'status' => 'pending',
        'midtrans_order_id' => 'PADEL-1-99999',
    ]);
});

/**
 * Build a valid Midtrans notification payload with a proper signature.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function midtransPayload(array $overrides = []): array
{
    $orderId = $overrides['order_id'] ?? 'PADEL-1-99999';
    $statusCode = $overrides['status_code'] ?? '200';
    $grossAmount = $overrides['gross_amount'] ?? '350000.00';
    $serverKey = config('midtrans.server_key', 'test-server-key');

    $signature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

    return array_merge([
        'order_id' => $orderId,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'transaction_id' => 'txn-abc-123',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'fraud_status' => 'accept',
        'signature_key' => $signature,
    ], $overrides);
}

it('rejects notification with invalid signature', function () {
    $this->postJson('/midtrans/notification', [
        'order_id' => 'PADEL-1-99999',
        'status_code' => '200',
        'gross_amount' => '350000.00',
        'signature_key' => 'invalid-signature',
        'transaction_status' => 'settlement',
    ])->assertStatus(403);

    expect($this->payment->fresh()->status)->toBe('pending');
});

it('marks payment as paid and booking as confirmed on settlement', function () {
    $payload = midtransPayload(['transaction_status' => 'settlement']);

    mock(MidtransService::class)
        ->shouldReceive('verifySignature')->once()->andReturn(true)
        ->shouldReceive('parseNotification')->once()->andReturn((object) $payload)
        ->shouldReceive('handleNotification')->once()->andReturnUsing(function ($notif) {
            $payment = Payment::where('midtrans_order_id', $notif->order_id)->first();
            $payment->update(['status' => 'paid', 'paid_at' => now()]);
            $payment->booking->update(['status' => 'confirmed']);
        });

    $this->postJson('/midtrans/notification', $payload)->assertSuccessful();

    expect($this->payment->fresh()->status)->toBe('paid')
        ->and($this->booking->fresh()->status)->toBe('confirmed');
});

it('marks payment as paid on capture with fraud accept', function () {
    $payload = midtransPayload([
        'transaction_status' => 'capture',
        'fraud_status' => 'accept',
    ]);

    mock(MidtransService::class)
        ->shouldReceive('verifySignature')->once()->andReturn(true)
        ->shouldReceive('parseNotification')->once()->andReturn((object) $payload)
        ->shouldReceive('handleNotification')->once()->andReturnUsing(function ($notif) {
            $payment = Payment::where('midtrans_order_id', $notif->order_id)->first();
            $payment->update(['status' => 'paid', 'paid_at' => now()]);
            $payment->booking->update(['status' => 'confirmed']);
        });

    $this->postJson('/midtrans/notification', $payload)->assertSuccessful();

    expect($this->payment->fresh()->status)->toBe('paid');
});

it('keeps payment as pending on pending status', function () {
    $payload = midtransPayload(['transaction_status' => 'pending', 'status_code' => '201']);

    mock(MidtransService::class)
        ->shouldReceive('verifySignature')->once()->andReturn(true)
        ->shouldReceive('parseNotification')->once()->andReturn((object) $payload)
        ->shouldReceive('handleNotification')->once();

    $this->postJson('/midtrans/notification', $payload)->assertSuccessful();

    expect($this->payment->fresh()->status)->toBe('pending');
});

it('marks payment as failed and booking cancelled on expire', function () {
    $payload = midtransPayload(['transaction_status' => 'expire', 'status_code' => '407']);

    mock(MidtransService::class)
        ->shouldReceive('verifySignature')->once()->andReturn(true)
        ->shouldReceive('parseNotification')->once()->andReturn((object) $payload)
        ->shouldReceive('handleNotification')->once()->andReturnUsing(function ($notif) {
            $payment = Payment::where('midtrans_order_id', $notif->order_id)->first();
            $payment->update(['status' => 'failed']);
            $payment->booking->update(['status' => 'cancelled']);
        });

    $this->postJson('/midtrans/notification', $payload)->assertSuccessful();

    expect($this->payment->fresh()->status)->toBe('failed')
        ->and($this->booking->fresh()->status)->toBe('cancelled');
});

it('marks payment as failed and booking cancelled on cancel', function () {
    $payload = midtransPayload(['transaction_status' => 'cancel', 'status_code' => '200']);

    mock(MidtransService::class)
        ->shouldReceive('verifySignature')->once()->andReturn(true)
        ->shouldReceive('parseNotification')->once()->andReturn((object) $payload)
        ->shouldReceive('handleNotification')->once()->andReturnUsing(function ($notif) {
            $payment = Payment::where('midtrans_order_id', $notif->order_id)->first();
            $payment->update(['status' => 'failed']);
            $payment->booking->update(['status' => 'cancelled']);
        });

    $this->postJson('/midtrans/notification', $payload)->assertSuccessful();

    expect($this->payment->fresh()->status)->toBe('failed')
        ->and($this->booking->fresh()->status)->toBe('cancelled');
});
