<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Sport;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
        ]);

        // ── Pengguna ────────────────────────────────────────────
        $testUser = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'test@example.com',
        ]);

        $users = User::factory(10)->sequence(
            ['name' => 'Rina Wulandari'],
            ['name' => 'Agus Pratama'],
            ['name' => 'Siti Nurhaliza'],
            ['name' => 'Doni Setiawan'],
            ['name' => 'Maya Putri'],
            ['name' => 'Fajar Nugroho'],
            ['name' => 'Dewi Lestari'],
            ['name' => 'Rizky Hidayat'],
            ['name' => 'Nadia Kusuma'],
            ['name' => 'Hendra Wijaya'],
        )->create();

        $allUsers = $users->push($testUser);

        // ── Cabang Olahraga ─────────────────────────────────────
        $miniSoccer = Sport::create(['name' => 'Mini Soccer', 'slug' => 'mini-soccer', 'icon' => '⚽']);
        $futsal = Sport::create(['name' => 'Futsal', 'slug' => 'futsal', 'icon' => '🏃']);
        $badminton = Sport::create(['name' => 'Badminton', 'slug' => 'badminton', 'icon' => '🏸']);

        // ── Fasilitas ───────────────────────────────────────────
        $facilities = collect([
            'Parkir Luas',
            'Kafe & Resto',
            'Kamar Mandi & Shower',
            'Sewa Raket',
            'Wi-Fi Gratis',
            'Mushola',
            'Loker',
            'Tribun Penonton',
        ])->map(fn (string $name): Facility => Facility::create(['name' => $name]));

        // ── Venue ───────────────────────────────────────────────
        $venueConfigs = [
            [
                'venue' => [
                    'name' => 'Sport Center Utama',
                    'slug' => 'sport-center-utama',
                    'description' => 'Fasilitas olahraga lengkap dengan lapangan mini soccer, futsal, dan badminton. Dilengkapi dengan fasilitas modern dan pelayanan profesional.',
                    'address' => 'Jl. Olahraga No. 1',
                    'city' => 'Jakarta',
                    'latitude' => -6.2297,
                    'longitude' => 106.8015,
                    'phone' => '021-1234567',
                    'image_url' => 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                ],
                'courts' => [
                    ['name' => 'Lapangan Mini Soccer 1', 'sport' => $miniSoccer, 'type' => 'indoor', 'price' => 100000],
                    ['name' => 'Lapangan Badminton 1', 'sport' => $badminton, 'type' => 'indoor', 'price' => 75000],
                    ['name' => 'Lapangan Badminton 2', 'sport' => $badminton, 'type' => 'indoor', 'price' => 75000],
                    ['name' => 'Lapangan Futsal 1', 'sport' => $futsal, 'type' => 'indoor', 'price' => 100000],
                ],
            ],
        ];

        $courts = collect();

        foreach ($venueConfigs as $config) {
            $venue = Venue::create($config['venue']);

            // Pasang 4-6 fasilitas acak ke setiap venue
            $venue->facilities()->attach(
                $facilities->random(fake()->numberBetween(4, 6))->pluck('id')
            );

            foreach ($config['courts'] as $courtData) {
                $courts->push(Court::create([
                    'venue_id' => $venue->id,
                    'sport_id' => $courtData['sport']->id,
                    'name' => $courtData['name'],
                    'type' => $courtData['type'],
                    'price_per_hour' => $courtData['price'],
                    'images' => [
                        'https://images.unsplash.com/photo-1768327508132-a467c8be319a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNvdXJ0JTIwc3BvcnR8ZW58MHx8MHx8fDI%3D',
                        'https://images.unsplash.com/photo-1766675122854-28fc70f50132?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGNvdXJ0JTIwc3BvcnR8ZW58MHx8MHx8fDI%3D',
                        'https://images.unsplash.com/photo-1693517235862-a1b8c3323efb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGNvdXJ0JTIwc3BvcnR8ZW58MHx8MHx8fDI%3D',
                    ],
                ]));
            }
        }

        // ── Booking ─────────────────────────────────────────────
        $usedSlots = [];
        $bookingCount = 0;

        while ($bookingCount < 30) {
            $court = $courts->random();
            $date = fake()->dateTimeBetween('now', '+14 days')->format('Y-m-d');
            $startHour = fake()->numberBetween(6, 22);
            $slotKey = "{$court->id}-{$date}-{$startHour}";

            if (isset($usedSlots[$slotKey])) {
                continue;
            }

            $usedSlots[$slotKey] = true;
            $startTime = str_pad($startHour, 2, '0', STR_PAD_LEFT).':00';
            $endTime = str_pad($startHour + 1, 2, '0', STR_PAD_LEFT).':00';

            $booking = Booking::create([
                'user_id' => $allUsers->random()->id,
                'court_id' => $court->id,
                'date' => $date,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'total_price' => $court->price_per_hour,
                'status' => fake()->randomElement(['pending', 'confirmed', 'completed']),
            ]);

            // Buat pembayaran untuk booking yang sudah dikonfirmasi
            if (in_array($booking->status, ['confirmed', 'completed'])) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'method' => fake()->randomElement(['bank_transfer', 'ewallet', 'cash']),
                    'amount' => $booking->total_price,
                    'status' => 'paid',
                    'paid_at' => now()->subDays(fake()->numberBetween(0, 7)),
                ]);
            }

            $bookingCount++;
        }

        // ── Ulasan ──────────────────────────────────────────────
        $venues = Venue::all();
        $komentarPositif = [
            'Lapangannya bagus banget, rumput sintetisnya terawat dengan baik. Pasti balik lagi!',
            'Fasilitas lengkap dan bersih. Parkir luas, ada kafe juga. Recommended!',
            'Harga sebanding dengan kualitas. Pelayanan ramah dan profesional.',
            'Tempatnya strategis dan mudah dijangkau. Lapangan indoor-nya nyaman, AC dingin.',
            'Sudah beberapa kali main di sini, selalu puas. Staff-nya helpful banget.',
            'Booking online gampang, lapangan sesuai ekspektasi. Top!',
            'Tempatnya cozy, cocok buat main bareng teman-teman sehabis kerja.',
            'Pencahayaannya optimal, bisa main sampai malam. Kamar mandinya juga bersih.',
            'Sewa raketnya terjangkau dan kualitasnya oke. Cocok buat pemula.',
            'Arena favoritku! Selalu ramai tapi tetap nyaman karena lapangannya banyak.',
            'Pertama kali coba padel di sini, langsung ketagihan. Instrukturnya juga baik.',
        ];

        $allUsers->each(function (User $user) use ($venues, $komentarPositif): void {
            $reviewedVenues = $venues->random(fake()->numberBetween(1, min(1, $venues->count())));
            $reviewedVenues->each(function (Venue $venue) use ($user, $komentarPositif): void {
                Review::create([
                    'user_id' => $user->id,
                    'venue_id' => $venue->id,
                    'rating' => fake()->numberBetween(3, 5),
                    'comment' => fake()->optional(0.8)->randomElement($komentarPositif),
                ]);
            });
        });
    }
}
