<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Sport;
use App\Models\User;
use App\Models\Venue;
use App\Services\FonnteService;

use function Pest\Laravel\mock;

beforeEach(function () {
    mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')
        ->andReturnNull();

    $this->user = User::factory()->create();
    $venue = Venue::factory()->create();
    $sport = Sport::factory()->create();
    $this->court = Court::factory()->create(['venue_id' => $venue->id, 'sport_id' => $sport->id]);
    $this->customer = User::factory()->create();
});

it('creates a booking and payment when paid', function () {
    $this->actingAs($this->user)
        ->post('/bookings', [
            'user_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'date' => '2026-12-01',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'total_price' => $this->court->price_per_hour,
            'payment_status' => 'paid',
        ])
        ->assertStatus(201)
        ->assertJson(['message' => 'Booking berhasil dibuat.']);

    $booking = Booking::where('user_id', $this->customer->id)->first();
    expect($booking)->not->toBeNull()
        ->and($booking->status)->toBe('confirmed');

    expect(Payment::where('booking_id', $booking->id)->exists())->toBeTrue();
});

it('creates a booking without payment when unpaid', function () {
    $this->actingAs($this->user)
        ->post('/bookings', [
            'user_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'date' => '2026-12-01',
            'start_time' => '12:00',
            'end_time' => '13:00',
            'total_price' => $this->court->price_per_hour,
            'payment_status' => 'unpaid',
        ])
        ->assertStatus(201);

    $booking = Booking::where('user_id', $this->customer->id)->first();
    expect($booking->status)->toBe('pending');
    expect(Payment::where('booking_id', $booking->id)->exists())->toBeFalse();
});

it('returns 422 when required fields are missing', function () {
    $this->actingAs($this->user)
        ->postJson('/bookings', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['user_id', 'court_id', 'date', 'start_time', 'end_time', 'total_price', 'payment_status']);
});

it('returns 422 when the slot is already booked', function () {
    Booking::factory()->create([
        'court_id' => $this->court->id,
        'date' => '2026-12-02',
        'start_time' => '09:00',
        'end_time' => '10:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($this->user)
        ->postJson('/bookings', [
            'user_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'date' => '2026-12-02',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'total_price' => $this->court->price_per_hour,
            'payment_status' => 'paid',
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.']);
});

it('returns 401 for unauthenticated requests', function () {
    $this->postJson('/bookings', [])->assertStatus(401);
});
