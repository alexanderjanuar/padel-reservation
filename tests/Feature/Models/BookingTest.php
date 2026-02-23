<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Sport;
use App\Models\User;
use App\Models\Venue;

it('belongs to a user and court', function () {
    $user = User::factory()->create();
    $venue = Venue::factory()->create();
    $sport = Sport::factory()->create();
    $court = Court::factory()->create(['venue_id' => $venue->id, 'sport_id' => $sport->id]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'court_id' => $court->id,
    ]);

    expect($booking->user)->toBeInstanceOf(User::class)
        ->and($booking->user->id)->toBe($user->id)
        ->and($booking->court)->toBeInstanceOf(Court::class)
        ->and($booking->court->id)->toBe($court->id);
});

it('has one payment', function () {
    $booking = Booking::factory()->create();

    Payment::factory()->create(['booking_id' => $booking->id]);

    expect($booking->payment)->toBeInstanceOf(Payment::class);
});

it('prevents double booking the same court, date, and start time', function () {
    $court = Court::factory()->create();

    Booking::factory()->create([
        'court_id' => $court->id,
        'date' => '2026-03-01',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    Booking::factory()->create([
        'court_id' => $court->id,
        'date' => '2026-03-01',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);
})->throws(\Illuminate\Database\QueryException::class);

it('allows the same time slot on different courts', function () {
    $court1 = Court::factory()->create();
    $court2 = Court::factory()->create();

    Booking::factory()->create([
        'court_id' => $court1->id,
        'date' => '2026-03-01',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    $booking2 = Booking::factory()->create([
        'court_id' => $court2->id,
        'date' => '2026-03-01',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    expect($booking2)->toBeInstanceOf(Booking::class);
});

it('is accessible from user bookings relationship', function () {
    $user = User::factory()->create();
    Booking::factory(3)->create(['user_id' => $user->id]);

    expect($user->bookings)->toHaveCount(3);
});
