<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use App\Services\FonnteService;

use function Pest\Laravel\mock;

beforeEach(function () {
    mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')
        ->andReturnNull()
        ->shouldReceive('sendConfirmationNotification')
        ->andReturnNull();

    $this->court = Court::factory()->create();
});

it('allows guest to book a court without authentication', function () {
    $this->postJson('/bookings/guest', [
        'guest_name' => 'Budi Santoso',
        'guest_email' => 'budi@example.com',
        'guest_phone' => '081234567890',
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '09:00',
        'end_time' => '10:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])
        ->assertStatus(201)
        ->assertJson(['message' => 'Booking berhasil dibuat.']);
});

it('creates a user record from guest data when guest books', function () {
    $this->postJson('/bookings/guest', [
        'guest_name' => 'Rina Wulandari',
        'guest_email' => 'rina@example.com',
        'guest_phone' => '082345678901',
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '10:00',
        'end_time' => '11:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])->assertStatus(201);

    $user = User::where('email', 'rina@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Rina Wulandari');

    $booking = Booking::where('user_id', $user->id)->first();
    expect($booking)->not->toBeNull()
        ->and($booking->status)->toBe('pending');
});

it('creates a pending qris payment when guest books', function () {
    $this->postJson('/bookings/guest', [
        'guest_name' => 'Agus Pratama',
        'guest_email' => 'agus@example.com',
        'guest_phone' => '083456789012',
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '11:00',
        'end_time' => '12:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])->assertStatus(201);

    $user = User::where('email', 'agus@example.com')->first();
    $booking = Booking::where('user_id', $user->id)->first();
    $payment = Payment::where('booking_id', $booking->id)->first();

    expect($payment)->not->toBeNull()
        ->and($payment->status)->toBe('pending')
        ->and($payment->method)->toBe('qris')
        ->and($payment->paid_at)->toBeNull();
});

it('reuses existing user when same email books again', function () {
    $existingUser = User::factory()->create(['email' => 'siti@example.com']);

    $this->postJson('/bookings/guest', [
        'guest_name' => 'Siti Nurhaliza',
        'guest_email' => 'siti@example.com',
        'guest_phone' => '084567890123',
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '13:00',
        'end_time' => '14:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])->assertStatus(201);

    // Should not create a duplicate user
    expect(User::where('email', 'siti@example.com')->count())->toBe(1);

    $booking = Booking::where('user_id', $existingUser->id)->first();
    expect($booking)->not->toBeNull();
});

it('returns 422 when guest fields are missing without user_id', function () {
    $this->postJson('/bookings/guest', [
        'court_id' => $this->court->id,
        'date' => '2026-12-10',
        'start_time' => '14:00',
        'end_time' => '15:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['guest_name', 'guest_email', 'guest_phone']);
});

it('returns 422 when guest slot conflicts with existing booking', function () {
    $existingUser = User::factory()->create();
    Booking::factory()->create([
        'court_id' => $this->court->id,
        'user_id' => $existingUser->id,
        'date' => '2026-12-11',
        'start_time' => '08:00',
        'end_time' => '09:00',
        'status' => 'confirmed',
    ]);

    $this->postJson('/bookings/guest', [
        'guest_name' => 'Doni Setiawan',
        'guest_email' => 'doni@example.com',
        'guest_phone' => '085678901234',
        'court_id' => $this->court->id,
        'date' => '2026-12-11',
        'start_time' => '08:00',
        'end_time' => '09:00',
        'total_price' => $this->court->price_per_hour,
        'payment_status' => 'unpaid',
    ])->assertStatus(422)
        ->assertJson(['message' => 'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.']);
});
