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
        $padel = Sport::create(['name' => 'Padel', 'slug' => 'padel', 'icon' => '🎾']);
        $futsal = Sport::create(['name' => 'Futsal', 'slug' => 'futsal', 'icon' => '⚽']);
        $badminton = Sport::create(['name' => 'Badminton', 'slug' => 'badminton', 'icon' => '🏸']);

        // ── Fasilitas ───────────────────────────────────────────
        $facilities = collect([
            'Parkir Luas',
            'Kafe & Resto',
            'Kamar Mandi & Shower',
            'Sewa Raket',
            'Parkir Valet',
            'Wi-Fi Gratis',
            'Mushola',
            'Pro Shop',
            'Loker',
            'Tribun Penonton',
        ])->map(fn (string $name): Facility => Facility::create(['name' => $name]));

        // ── Venue ───────────────────────────────────────────────
        $venueConfigs = [
            [
                'venue' => [
                    'name' => 'The Padel Garden',
                    'slug' => 'the-padel-garden',
                    'description' => 'Fasilitas padel premium dengan standar internasional. Dilengkapi dengan rumput sintetis terbaik, pencahayaan optimal, dan area santai untuk pengalaman bermain yang tak terlupakan.',
                    'address' => 'Jl. Senopati No. 42, Kebayoran Baru',
                    'city' => 'Jakarta Selatan',
                    'latitude' => -6.2297,
                    'longitude' => 106.8015,
                    'phone' => '021-7654321',
                    'image_url' => 'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                ],
                'courts' => [
                    ['name' => 'Lapangan 1 - Utama', 'sport' => $padel, 'type' => 'outdoor', 'price' => 350000],
                    ['name' => 'Lapangan 2', 'sport' => $padel, 'type' => 'outdoor', 'price' => 350000],
                    ['name' => 'Lapangan 3 - Indoor', 'sport' => $padel, 'type' => 'indoor', 'price' => 400000],
                    ['name' => 'Lapangan 4', 'sport' => $padel, 'type' => 'outdoor', 'price' => 300000],
                ],
            ],
            [
                'venue' => [
                    'name' => 'Oasis Courts',
                    'slug' => 'oasis-courts',
                    'description' => 'Kompleks olahraga modern multi-lapangan di jantung kota Senayan. Tersedia lapangan padel, futsal, dan badminton dengan fasilitas lengkap dan pelayanan profesional.',
                    'address' => 'Jl. Asia Afrika No. 15, Senayan',
                    'city' => 'Jakarta Selatan',
                    'latitude' => -6.2184,
                    'longitude' => 106.8023,
                    'phone' => '021-5723456',
                    'image_url' => 'https://images.unsplash.com/photo-1698656005701-4ec1e1dcf638?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                ],
                'courts' => [
                    ['name' => 'Padel Court A', 'sport' => $padel, 'type' => 'indoor', 'price' => 450000],
                    ['name' => 'Padel Court B', 'sport' => $padel, 'type' => 'indoor', 'price' => 450000],
                    ['name' => 'Lapangan Futsal 1', 'sport' => $futsal, 'type' => 'indoor', 'price' => 300000],
                    ['name' => 'Lapangan Futsal 2', 'sport' => $futsal, 'type' => 'outdoor', 'price' => 250000],
                    ['name' => 'Lapangan Badminton 1', 'sport' => $badminton, 'type' => 'indoor', 'price' => 150000],
                    ['name' => 'Lapangan Badminton 2', 'sport' => $badminton, 'type' => 'indoor', 'price' => 150000],
                ],
            ],
            [
                'venue' => [
                    'name' => 'Cloud Padel Club',
                    'slug' => 'cloud-padel-club',
                    'description' => 'Klub padel eksklusif di kawasan PIK dengan pemandangan laut. Nikmati pengalaman bermain padel premium dengan suasana santai dan fasilitas kelas dunia.',
                    'address' => 'Jl. Pantai Indah Kapuk Boulevard No. 8',
                    'city' => 'Jakarta Utara',
                    'latitude' => -6.1089,
                    'longitude' => 106.7442,
                    'phone' => '021-6612345',
                    'image_url' => 'https://images.unsplash.com/photo-1644781702528-7aa6fd386fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                ],
                'courts' => [
                    ['name' => 'Lapangan Padel Rooftop', 'sport' => $padel, 'type' => 'outdoor', 'price' => 500000],
                    ['name' => 'Lapangan Padel Indoor', 'sport' => $padel, 'type' => 'indoor', 'price' => 450000],
                    ['name' => 'Lapangan Badminton', 'sport' => $badminton, 'type' => 'indoor', 'price' => 175000],
                ],
            ],
            [
                'venue' => [
                    'name' => 'Sport Arena Tangerang',
                    'slug' => 'sport-arena-tangerang',
                    'description' => 'Arena olahraga terlengkap di BSD City. Lapangan indoor dan outdoor untuk futsal, badminton, dan padel. Cocok untuk latihan rutin maupun turnamen.',
                    'address' => 'Jl. Boulevard BSD No. 22, BSD City',
                    'city' => 'Tangerang',
                    'latitude' => -6.3020,
                    'longitude' => 106.6530,
                    'phone' => '021-5378900',
                    'image_url' => null,
                ],
                'courts' => [
                    ['name' => 'Lapangan Futsal A', 'sport' => $futsal, 'type' => 'indoor', 'price' => 275000],
                    ['name' => 'Lapangan Futsal B', 'sport' => $futsal, 'type' => 'indoor', 'price' => 275000],
                    ['name' => 'Lapangan Futsal C', 'sport' => $futsal, 'type' => 'outdoor', 'price' => 200000],
                    ['name' => 'Lapangan Badminton 1', 'sport' => $badminton, 'type' => 'indoor', 'price' => 125000],
                    ['name' => 'Lapangan Badminton 2', 'sport' => $badminton, 'type' => 'indoor', 'price' => 125000],
                ],
            ],
            [
                'venue' => [
                    'name' => 'Grand Sport Center Bekasi',
                    'slug' => 'grand-sport-center-bekasi',
                    'description' => 'Pusat olahraga terbesar di kawasan Bekasi dengan area parkir luas dan fasilitas modern. Pilihan tepat untuk bermain futsal dan badminton bersama rekan.',
                    'address' => 'Jl. Ahmad Yani No. 100, Bekasi Selatan',
                    'city' => 'Bekasi',
                    'latitude' => -6.2500,
                    'longitude' => 106.9900,
                    'phone' => '021-8823456',
                    'image_url' => null,
                ],
                'courts' => [
                    ['name' => 'Lapangan Futsal Indoor 1', 'sport' => $futsal, 'type' => 'indoor', 'price' => 250000],
                    ['name' => 'Lapangan Futsal Indoor 2', 'sport' => $futsal, 'type' => 'indoor', 'price' => 250000],
                    ['name' => 'Lapangan Badminton A', 'sport' => $badminton, 'type' => 'indoor', 'price' => 100000],
                    ['name' => 'Lapangan Badminton B', 'sport' => $badminton, 'type' => 'indoor', 'price' => 100000],
                ],
            ],
            [
                'venue' => [
                    'name' => 'Bandung Padel House',
                    'slug' => 'bandung-padel-house',
                    'description' => 'Destinasi padel premium pertama di Bandung. Udara sejuk pegunungan membuat pengalaman bermain semakin menyenangkan. Tersedia juga lapangan badminton.',
                    'address' => 'Jl. Ir. H. Juanda No. 55, Dago',
                    'city' => 'Bandung',
                    'latitude' => -6.8854,
                    'longitude' => 107.6145,
                    'phone' => '022-2503456',
                    'image_url' => null,
                ],
                'courts' => [
                    ['name' => 'Lapangan Padel 1', 'sport' => $padel, 'type' => 'outdoor', 'price' => 300000],
                    ['name' => 'Lapangan Padel 2', 'sport' => $padel, 'type' => 'outdoor', 'price' => 300000],
                    ['name' => 'Lapangan Badminton', 'sport' => $badminton, 'type' => 'indoor', 'price' => 120000],
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
            $reviewedVenues = $venues->random(fake()->numberBetween(1, 3));
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
