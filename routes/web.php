<?php

use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\BookingListController;
use App\Http\Controllers\Admin\CourtController;
use App\Http\Controllers\Admin\FacilityController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VenueController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\GoogleRegistrationController;
use App\Http\Controllers\BookingPageController;
use App\Http\Controllers\CourtDetailController;
use App\Http\Controllers\CourtsPageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MidtransController;
use App\Http\Controllers\MidtransWebhookController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');
Route::get('/booking', BookingPageController::class)->name('booking');
Route::get('/lapangan', CourtsPageController::class)->name('lapangan');
Route::get('/lapangan/{court}', CourtDetailController::class)->name('lapangan.show');

Route::middleware('guest')->group(function () {
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');
    Route::get('/auth/google/complete', [GoogleRegistrationController::class, 'create'])->name('google.complete');
    Route::post('/auth/google/complete', [GoogleRegistrationController::class, 'store'])->name('google.store');
});

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('sports', [SportController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('sports.index');
Route::post('sports', [SportController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('sports.store');
Route::put('sports/{sport}', [SportController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('sports.update');
Route::delete('sports/{sport}', [SportController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('sports.destroy');

Route::get('venues', [VenueController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('venues.index');
Route::post('venues', [VenueController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('venues.store');
Route::put('venues/{venue}', [VenueController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('venues.update');
Route::delete('venues/{venue}', [VenueController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('venues.destroy');

Route::get('facilities', [FacilityController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.index');
Route::post('facilities', [FacilityController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.store');
Route::put('facilities/{facility}', [FacilityController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.update');
Route::delete('facilities/{facility}', [FacilityController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.destroy');

Route::get('users/search', [UserController::class, 'search'])
    ->middleware(['auth', 'verified'])
    ->name('users.search');

Route::post('users/quick-store', [UserController::class, 'quickStore'])
    ->middleware(['auth', 'verified'])
    ->name('users.quick-store');

Route::get('courts', [CourtController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('courts.index');
Route::post('courts', [CourtController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('courts.store');
Route::put('courts/{court}', [CourtController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('courts.update');
Route::delete('courts/{court}', [CourtController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('courts.destroy');

Route::get('bookings/recap', [ReportController::class, 'recap'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.recap');

Route::get('bookings', [BookingListController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.index');

Route::post('bookings', [BookingController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.store');

Route::patch('bookings/{booking}', [BookingController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.update');

Route::post('bookings/guest', [BookingController::class, 'store'])
    ->name('bookings.guest');

Route::post('bookings/{booking}/upload-proof', [BookingController::class, 'uploadProof'])
    ->name('bookings.upload-proof');

Route::patch('bookings/{booking}/confirm', [BookingController::class, 'confirm'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.confirm');

Route::patch('bookings/{booking}/cancel', [BookingController::class, 'cancel'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.cancel');

Route::patch('user/phone', function (Request $request) {
    $request->validate(['phone' => ['required', 'string', 'max:30']]);
    $request->user()->update(['phone' => $request->input('phone')]);

    return response()->json(['message' => 'OK']);
})->middleware('auth')->name('user.phone');

// Midtrans
Route::post('midtrans/snap-token/{booking}', [MidtransController::class, 'createSnapToken'])
    ->middleware(['auth', 'verified'])
    ->name('midtrans.snap-token');

Route::post('midtrans/notification', MidtransWebhookController::class)
    ->name('midtrans.notification');

require __DIR__.'/settings.php';
