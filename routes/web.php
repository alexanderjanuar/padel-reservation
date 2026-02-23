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

Route::get('venue/{id}', function ($id) {
    return Inertia::render('Venue/Show', [
        'id' => $id,
    ]);
})->name('venue.show');

require __DIR__.'/settings.php';
