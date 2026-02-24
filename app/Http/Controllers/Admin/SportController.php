<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sport;
use Inertia\Inertia;

class SportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sports = Sport::withCount(['courts', 'bookings'])->orderBy('name')->get();

        return Inertia::render('Admin/Sports', [
            'sports' => $sports,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(\App\Http\Requests\StoreSportRequest $request)
    {
        $validated = $request->validated();

        Sport::create([
            'name' => $validated['name'],
            'slug' => \Illuminate\Support\Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Olahraga berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(\App\Http\Requests\UpdateSportRequest $request, Sport $sport)
    {
        $validated = $request->validated();

        $sport->update([
            'name' => $validated['name'],
            'slug' => \Illuminate\Support\Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Olahraga berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sport $sport)
    {
        if ($sport->courts()->count() > 0 || $sport->bookings()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus olahraga yang memiliki lapangan atau pemesanan aktif.');
        }

        $sport->delete();

        return back()->with('success', 'Olahraga berhasil dihapus.');
    }
}
