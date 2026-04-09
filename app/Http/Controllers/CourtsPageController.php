<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Sport;
use Inertia\Inertia;
use Inertia\Response;

class CourtsPageController extends Controller
{
    public function __invoke(\Illuminate\Http\Request $request): Response
    {
        $courts = Court::with(['venue:id,name,images', 'sport:id,name'])
            ->where('is_active', true)
            ->select('id', 'name', 'type', 'price_per_hour', 'sport_id', 'venue_id', 'images')
            ->orderBy('created_at', 'desc')
            ->get();

        $sports = Sport::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('courts', [
            'courts' => $courts,
            'sports' => $sports,
            'filters' => [
                'sport' => $request->input('sport'),
                'type' => $request->input('type'),
                'search' => $request->input('search'),
            ],
        ]);
    }
}
