<?php

namespace App\Http\Controllers;

use App\Models\Court;
use Inertia\Inertia;
use Inertia\Response;

class CourtDetailController extends Controller
{
    public function __invoke(Court $court): Response
    {
        $court->load([
            'sport:id,name',
            'venue:id,name,address,city,phone,description,images',
            'venue.facilities:id,name,icon',
        ]);

        $relatedCourts = Court::with(['venue:id,name', 'sport:id,name'])
            ->where('sport_id', $court->sport_id)
            ->where('id', '!=', $court->id)
            ->where('is_active', true)
            ->select('id', 'name', 'type', 'price_per_hour', 'sport_id', 'venue_id', 'images')
            ->limit(3)
            ->get();

        return Inertia::render('court-detail', [
            'court' => $court,
            'relatedCourts' => $relatedCourts,
        ]);
    }
}
