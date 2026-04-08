<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Sport;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    public function __invoke(\Illuminate\Http\Request $request): Response
    {
        $courts = Court::with(['venue:id,name,images', 'sport:id,name'])
            ->where('is_active', true)
            ->select('id', 'name', 'type', 'price_per_hour', 'sport_id', 'venue_id', 'images')
            ->get();

        $sports = Sport::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'courts' => $courts,
            'sports' => $sports,
        ]);
    }
}
