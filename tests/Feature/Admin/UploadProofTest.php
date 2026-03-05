<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->booking = Booking::factory()->create();
    Payment::factory()->create([
        'booking_id' => $this->booking->id,
        'method' => 'qris',
        'status' => 'pending',
    ]);
});

it('allows uploading proof of payment for a booking', function () {
    $file = UploadedFile::fake()->image('bukti.jpg', 400, 400);

    $this->postJson("/bookings/{$this->booking->id}/upload-proof", [
        'proof' => $file,
    ])->assertSuccessful()
        ->assertJson(['message' => 'Bukti pembayaran berhasil diupload.']);

    $payment = $this->booking->fresh()->payment;
    expect($payment->proof_of_payment)->not->toBeNull();
    Storage::disk('public')->assertExists($payment->proof_of_payment);
});

it('replaces old proof when uploading again', function () {
    $first = UploadedFile::fake()->image('first.jpg');
    $this->postJson("/bookings/{$this->booking->id}/upload-proof", ['proof' => $first])
        ->assertSuccessful();
    $oldPath = $this->booking->fresh()->payment->proof_of_payment;

    $second = UploadedFile::fake()->image('second.jpg');
    $this->postJson("/bookings/{$this->booking->id}/upload-proof", ['proof' => $second])
        ->assertSuccessful();

    $newPath = $this->booking->fresh()->payment->proof_of_payment;
    expect($newPath)->not->toBe($oldPath);
    Storage::disk('public')->assertExists($newPath);
    Storage::disk('public')->assertMissing($oldPath);
});

it('creates a payment record if none exists when uploading proof', function () {
    $bookingWithoutPayment = Booking::factory()->create();

    $file = UploadedFile::fake()->image('bukti2.jpg');
    $this->postJson("/bookings/{$bookingWithoutPayment->id}/upload-proof", [
        'proof' => $file,
    ])->assertSuccessful();

    $payment = Payment::where('booking_id', $bookingWithoutPayment->id)->first();
    expect($payment)->not->toBeNull()
        ->and($payment->method)->toBe('qris')
        ->and($payment->status)->toBe('pending')
        ->and($payment->proof_of_payment)->not->toBeNull();
});

it('returns 422 when proof file is missing', function () {
    $this->postJson("/bookings/{$this->booking->id}/upload-proof", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['proof']);
});

it('returns 422 when proof file is not an image', function () {
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->postJson("/bookings/{$this->booking->id}/upload-proof", [
        'proof' => $file,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['proof']);
});

it('returns 404 for non-existent booking', function () {
    $file = UploadedFile::fake()->image('bukti.jpg');
    $this->postJson('/bookings/99999/upload-proof', ['proof' => $file])
        ->assertNotFound();
});
