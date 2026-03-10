<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Sport;
use App\Models\User;
use App\Models\Venue;
use App\Services\FonnteService;
use App\Services\MidtransService;

use function Pest\Laravel\mock;

beforeEach(function () {
    mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')->andReturnNull()
        ->shouldReceive('sendConfirmationNotification')->andReturnNull();

    $this->user = User::factory()->create();
    $venue = Venue::factory()->create();
    $sport = Sport::factory()->create();
    $this->court = Court::factory()->create(['venue_id' => $venue->id, 'sport_id' => $sport->id]);
    $this->customer = User::factory()->create();
});

it('creates a booking with midtrans payment and returns snap token via guest route', function () {
    mock(MidtransService::class)
        ->shouldReceive('createSnapToken')
        ->once()
        ->andReturn(['snap_token' => 'fake-snap-token-123', 'order_id' => 'PADEL-1-99999']);

    $this->postJson('/bookings/guest', [
        'guest_name' => $this->customer->name,
        'guest_email' => $this->customer->email,
        'guest_phone' => '081234567890',
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '10:00',
        'end_time' => '11:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'midtrans',
    ])
        ->assertStatus(201)
        ->assertJsonFragment(['snap_token' => 'fake-snap-token-123']);

    $booking = Booking::where('user_id', $this->customer->id)->first();
    expect($booking)->not->toBeNull()
        ->and($booking->status)->toBe('pending');

    $payment = Payment::where('booking_id', $booking->id)->first();
    expect($payment)->not->toBeNull()
        ->and($payment->method)->toBe('midtrans')
        ->and($payment->status)->toBe('pending')
        ->and($payment->snap_token)->toBe('fake-snap-token-123')
        ->and($payment->midtrans_order_id)->toBe('PADEL-1-99999');
});

it('returns existing snap token if payment is still valid', function () {
    $booking = Booking::factory()->create(['status' => 'pending']);
    Payment::factory()->create([
        'booking_id' => $booking->id,
        'method' => 'midtrans',
        'status' => 'pending',
        'snap_token' => 'existing-token',
        'midtrans_order_id' => 'PADEL-1-11111',
        'expired_at' => now()->addMinutes(20),
    ]);

    mock(MidtransService::class)
        ->shouldNotReceive('createSnapToken');

    $this->actingAs($this->user)
        ->postJson("/midtrans/snap-token/{$booking->id}")
        ->assertSuccessful()
        ->assertJsonFragment(['snap_token' => 'existing-token']);
});

it('creates new snap token when payment is expired', function () {
    $booking = Booking::factory()->create(['status' => 'pending']);
    Payment::factory()->create([
        'booking_id' => $booking->id,
        'method' => 'midtrans',
        'status' => 'pending',
        'snap_token' => 'old-token',
        'midtrans_order_id' => 'PADEL-1-22222',
        'expired_at' => now()->subMinutes(10),
    ]);

    mock(MidtransService::class)
        ->shouldReceive('createSnapToken')
        ->once()
        ->andReturn(['snap_token' => 'new-token-456', 'order_id' => 'PADEL-1-33333']);

    $this->actingAs($this->user)
        ->postJson("/midtrans/snap-token/{$booking->id}")
        ->assertSuccessful()
        ->assertJsonFragment(['snap_token' => 'new-token-456']);
});

it('returns 422 when booking is not pending', function () {
    $booking = Booking::factory()->create(['status' => 'confirmed']);

    mock(MidtransService::class)
        ->shouldNotReceive('createSnapToken');

    $this->actingAs($this->user)
        ->postJson("/midtrans/snap-token/{$booking->id}")
        ->assertStatus(422);
});

it('requires authentication for snap token endpoint', function () {
    $booking = Booking::factory()->create(['status' => 'pending']);

    $this->postJson("/midtrans/snap-token/{$booking->id}")
        ->assertStatus(401);
});
