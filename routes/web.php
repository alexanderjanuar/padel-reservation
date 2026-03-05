<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');
    Route::get('/auth/google/complete', [\App\Http\Controllers\Auth\GoogleRegistrationController::class, 'create'])->name('google.complete');
    Route::post('/auth/google/complete', [\App\Http\Controllers\Auth\GoogleRegistrationController::class, 'store'])->name('google.store');
});

Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('sports', [\App\Http\Controllers\Admin\SportController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('sports.index');
Route::post('sports', [\App\Http\Controllers\Admin\SportController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('sports.store');
Route::put('sports/{sport}', [\App\Http\Controllers\Admin\SportController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('sports.update');
Route::delete('sports/{sport}', [\App\Http\Controllers\Admin\SportController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('sports.destroy');

Route::get('venues', [\App\Http\Controllers\Admin\VenueController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('venues.index');
Route::post('venues', [\App\Http\Controllers\Admin\VenueController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('venues.store');
Route::put('venues/{venue}', [\App\Http\Controllers\Admin\VenueController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('venues.update');
Route::delete('venues/{venue}', [\App\Http\Controllers\Admin\VenueController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('venues.destroy');

Route::get('facilities', [\App\Http\Controllers\Admin\FacilityController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.index');
Route::post('facilities', [\App\Http\Controllers\Admin\FacilityController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.store');
Route::put('facilities/{facility}', [\App\Http\Controllers\Admin\FacilityController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.update');
Route::delete('facilities/{facility}', [\App\Http\Controllers\Admin\FacilityController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('facilities.destroy');

Route::get('users/search', [\App\Http\Controllers\Admin\UserController::class, 'search'])
    ->middleware(['auth', 'verified'])
    ->name('users.search');

Route::post('users/quick-store', [\App\Http\Controllers\Admin\UserController::class, 'quickStore'])
    ->middleware(['auth', 'verified'])
    ->name('users.quick-store');

Route::get('courts', [\App\Http\Controllers\Admin\CourtController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('courts.index');
Route::post('courts', [\App\Http\Controllers\Admin\CourtController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('courts.store');
Route::put('courts/{court}', [\App\Http\Controllers\Admin\CourtController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('courts.update');
Route::delete('courts/{court}', [\App\Http\Controllers\Admin\CourtController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('courts.destroy');

Route::get('bookings/recap', [\App\Http\Controllers\Admin\ReportController::class, 'recap'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.recap');

Route::post('bookings', [\App\Http\Controllers\Admin\BookingController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.store');

Route::patch('bookings/{booking}/confirm', [\App\Http\Controllers\Admin\BookingController::class, 'confirm'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.confirm');

Route::patch('bookings/{booking}/cancel', [\App\Http\Controllers\Admin\BookingController::class, 'cancel'])
    ->middleware(['auth', 'verified'])
    ->name('bookings.cancel');

Route::get('venue/{id}', function ($id) {
    return Inertia::render('Venue/Show', [
        'id' => $id,
    ]);
})->name('venue.show');

require __DIR__.'/settings.php';
