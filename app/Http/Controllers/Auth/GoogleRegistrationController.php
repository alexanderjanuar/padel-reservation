<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class GoogleRegistrationController extends Controller
{
    /**
     * Show the password creation view for a new Google user.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('google_user')) {
            return redirect()->route('login');
        }

        $googleUser = $request->session()->get('google_user');

        return Inertia::render('auth/GoogleRegister', [
            'name' => $googleUser['name'],
            'email' => $googleUser['email'],
        ]);
    }

    /**
     * Store the new user and their password.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->session()->has('google_user')) {
            return redirect()->route('login');
        }

        $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $googleUser = $request->session()->get('google_user');

        $user = User::create([
            'name' => $googleUser['name'],
            'email' => $googleUser['email'],
            'google_id' => $googleUser['google_id'],
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('user');

        $request->session()->forget('google_user');

        Auth::login($user);

        return redirect()->intended(route('dashboard', [], false));
    }
}
