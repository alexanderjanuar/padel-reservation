<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacilityRequest;
use App\Http\Requests\UpdateFacilityRequest;
use App\Models\Facility;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FacilityController extends Controller
{
    public function index(): Response
    {
        $facilities = Facility::withCount('venues')->get();

        return Inertia::render('Admin/Facilities', [
            'facilities' => $facilities,
        ]);
    }

    public function store(StoreFacilityRequest $request): RedirectResponse
    {
        Facility::create($request->validated());

        return redirect()->route('facilities.index')->with('success', 'Fasilitas berhasil dibuat.');
    }

    public function update(UpdateFacilityRequest $request, Facility $facility): RedirectResponse
    {
        $facility->update($request->validated());

        return redirect()->route('facilities.index')->with('success', 'Fasilitas berhasil diperbarui.');
    }

    public function destroy(Facility $facility): RedirectResponse
    {
        if ($facility->venues()->count() > 0) {
            return redirect()->route('facilities.index')->with('error', 'Fasilitas tidak dapat dihapus karena masih digunakan oleh tempat.');
        }

        $facility->delete();

        return redirect()->route('facilities.index')->with('success', 'Fasilitas berhasil dihapus.');
    }
}
