<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenueRequest;
use App\Http\Requests\UpdateVenueRequest;
use App\Models\Venue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VenueController extends Controller
{
    public function index()
    {
        $venues = Venue::query()
            ->withCount(['courts', 'facilities', 'reviews'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Venues', [
            'venues' => $venues,
        ]);
    }

    public function store(StoreVenueRequest $request)
    {
        $validated = $request->validated();
        $validated['slug'] = Str::slug($validated['name']);

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('venues', 'public');
                $imagePaths[] = $path;
            }
        }
        $validated['images'] = $imagePaths;

        Venue::create($validated);

        return back()->with('success', 'Tempat berhasil ditambahkan.');
    }

    public function update(UpdateVenueRequest $request, Venue $venue)
    {
        $validated = $request->validated();
        $validated['slug'] = Str::slug($validated['name']);

        $existingImages = $request->input('existing_images', []);
        $currentImages = $venue->images ?? [];

        // Identify and delete removed images
        $imagesToDelete = array_diff($currentImages, $existingImages);
        foreach ($imagesToDelete as $image) {
            Storage::disk('public')->delete($image);
        }

        $imagePaths = $existingImages;

        // Store newly uploaded images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('venues', 'public');
                $imagePaths[] = $path;
            }
        }

        $validated['images'] = $imagePaths;

        $venue->update($validated);

        return back()->with('success', 'Tempat berhasil diperbarui.');
    }

    public function destroy(Venue $venue)
    {
        if ($venue->courts()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus tempat yang memiliki lapangan aktif.');
        }

        if (is_array($venue->images)) {
            foreach ($venue->images as $image) {
                Storage::disk('public')->delete($image);
            }
        }

        $venue->delete();

        return back()->with('success', 'Tempat berhasil dihapus.');
    }
}
