<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\assertAuthenticated;
use function Pest\Laravel\get;
use function PHPUnit\Framework\assertTrue;

test('new google user is redirected to password complete page if in session', function () {
    $response = $this->withSession([
        'google_user' => [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'google_id' => '1234567890',
        ],
    ])->get('/auth/google/complete');

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('auth/GoogleRegister')
            ->where('name', 'Test User')
            ->where('email', 'test@example.com')
    );
});

test('returns to login if session is empty for complete page', function () {
    $response = get('/auth/google/complete');

    $response->assertRedirect('/login');
});

test('can complete registration with password', function () {
    $response = $this->withSession([
        'google_user' => [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'google_id' => '1234567890',
        ],
    ])->post('/auth/google/complete', [
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'test@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('Test User');
    expect($user->google_id)->toBe('1234567890');
    assertTrue(Hash::check('password', $user->password));

    assertAuthenticated();
    $response->assertRedirect(route('dashboard', [], false));
});

test('registration requires confirmed password', function () {
    $response = $this->withSession([
        'google_user' => [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'google_id' => '1234567890',
        ],
    ])->post('/auth/google/complete', [
        'password' => 'password',
        'password_confirmation' => 'different-password',
    ]);

    $response->assertInvalid(['password']);
});
