<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\FonnteService;

use function Pest\Laravel\mock;

beforeEach(function () {
    $this->fonnteService = mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')
        ->andReturnNull()
        ->shouldReceive('sendConfirmationNotification')
        ->andReturnNull()
        ->getMock();

    $this->admin = User::factory()->create();
    $this->booking = Booking::factory()->create(['status' => 'pending']);
    Payment::factory()->create([
        'booking_id' => $this->booking->id,
        'method' => 'qris',
        'status' => 'pending',
    ]);
});

it('admin can confirm a pending booking', function () {
    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/confirm")
        ->assertSuccessful()
        ->assertJson(['message' => 'Booking berhasil dikonfirmasi.']);

    expect($this->booking->fresh()->status)->toBe('confirmed');
});

it('sets payment to paid when booking is confirmed', function () {
    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/confirm")
        ->assertSuccessful();

    $payment = $this->booking->fresh()->payment;
    expect($payment->status)->toBe('paid')
        ->and($payment->paid_at)->not->toBeNull();
});

it('sends WA confirmation notification when booking is confirmed', function () {
    // Fresh mock for this specific test to assert ->once()
    mock(FonnteService::class)
        ->shouldReceive('sendBookingNotification')->andReturnNull()
        ->shouldReceive('sendConfirmationNotification')->once()->andReturnNull();

    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/confirm")
        ->assertSuccessful();
});

it('returns 422 when trying to confirm a non-pending booking', function () {
    $this->booking->update(['status' => 'confirmed']);

    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/confirm")
        ->assertStatus(422)
        ->assertJson(['message' => 'Booking tidak dapat dikonfirmasi.']);
});

it('creates a cash payment if none exists when confirming', function () {
    $bookingWithoutPayment = Booking::factory()->create(['status' => 'pending']);

    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$bookingWithoutPayment->id}/confirm")
        ->assertSuccessful();

    $payment = Payment::where('booking_id', $bookingWithoutPayment->id)->first();
    expect($payment)->not->toBeNull()
        ->and($payment->status)->toBe('paid')
        ->and($payment->method)->toBe('cash');
});

it('returns 401 when unauthenticated user tries to confirm booking', function () {
    $this->patchJson("/bookings/{$this->booking->id}/confirm")
        ->assertStatus(401);
});

it('admin can cancel a pending booking', function () {
    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/cancel")
        ->assertSuccessful()
        ->assertJson(['message' => 'Booking berhasil dibatalkan.']);

    expect($this->booking->fresh()->status)->toBe('cancelled');
});

it('returns 422 when trying to cancel an already cancelled booking', function () {
    $this->booking->update(['status' => 'cancelled']);

    $this->actingAs($this->admin)
        ->patchJson("/bookings/{$this->booking->id}/cancel")
        ->assertStatus(422);
});
