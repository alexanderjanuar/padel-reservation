<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourtRequest;
use App\Http\Requests\UpdateCourtRequest;
use App\Models\Court;
use App\Models\Sport;
use App\Models\Venue;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourtController extends Controller
{
    public function index(\Illuminate\Http\Request $request): Response
    {
        $date = $request->input('date', now()->toDateString());

        $courts = Court::with([
            'venue.facilities',
            'sport',
            'bookings' => function ($query) use ($date) {
                $query->where('date', $date)
                    ->whereIn('status', ['pending', 'confirmed', 'completed'])
                    ->with('user:id,name,phone')
                    ->select('id', 'court_id', 'user_id', 'start_time', 'end_time', 'status', 'total_price');
            },
        ])
            ->withExists([
                'bookings as is_booked_now' => function ($query) use ($date) {
                    $query->where('date', $date)
                        ->where('start_time', '<=', now()->toTimeString())
                        ->where('end_time', '>', now()->toTimeString())
                        ->whereIn('status', ['pending', 'confirmed', 'completed']);
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($court) {
                $bookedSlots = [];
                $slotMeta = [];

                foreach ($court->bookings as $booking) {
                    $startHour = (int) substr($booking->start_time, 0, 2);
                    $endHour = (int) substr($booking->end_time, 0, 2);

                    // Expand every hour in the range [start, end) as booked
                    for ($h = $startHour; $h < $endHour; $h++) {
                        $slot = sprintf('%02d:00', $h);
                        $bookedSlots[] = $slot;
                        $slotMeta[$slot] = [
                            'booking_id' => $booking->id,
                            'customer' => $booking->user?->name ?? 'Guest',
                            'phone' => $booking->user?->phone ?? '—',
                            'start_time' => substr($booking->start_time, 0, 5),
                            'end_time' => substr($booking->end_time, 0, 5),
                            'status' => $booking->status,
                            'total_price' => $booking->total_price,
                        ];
                    }
                }

                $court->booked_slots = array_values(array_unique($bookedSlots));
                $court->slot_meta = $slotMeta;

                unset($court->bookings);

                return $court;
            });

        $venues = Venue::select('id', 'name')->orderBy('name')->get();
        $sports = Sport::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Courts', [
            'courts' => $courts,
            'venues' => $venues,
            'sports' => $sports,
            'filters' => [
                'date' => $date,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCourtRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $images = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('courts', 'public');
                $images[] = $path;
            }
        }

        $validated['images'] = $images;

        Court::create($validated);

        return redirect()->back()->with('success', 'Lapangan berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCourtRequest $request, Court $court): RedirectResponse
    {
        $validated = $request->validated();
        $images = $court->images ?? [];

        // Handle image deletions
        if ($request->has('images_to_delete')) {
            $imagesToDelete = $request->input('images_to_delete');
            foreach ($imagesToDelete as $imagePath) {
                if (in_array($imagePath, $images)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($imagePath);
                    $images = array_values(array_diff($images, [$imagePath]));
                }
            }
        }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('courts', 'public');
                $images[] = $path;
            }
        }

        $validated['images'] = $images;
        unset($validated['images_to_delete']); // Remove before updating

        $court->update($validated);

        return redirect()->back()->with('success', 'Lapangan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Court $court): RedirectResponse
    {
        if (! empty($court->images)) {
            foreach ($court->images as $image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($image);
            }
        }

        $court->delete();

        return redirect()->back()->with('success', 'Lapangan berhasil dihapus.');
    }
}
