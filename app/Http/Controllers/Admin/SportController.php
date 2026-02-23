<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sports = Sport::withCount('courts')->orderBy('name')->get();

        return Inertia::render('Admin/Sports', [
            'sports' => $sports
        ]);
    }
}
