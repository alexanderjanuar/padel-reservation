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
use Illuminate\Support\Facades\Hash;

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
        $admin = User::factory()->create([
            'name' => 'Admin Reserve',
            'email' => 'admin@reserve.id',
            'password' => Hash::make('password'),
        ]);

        $testUser = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ]);

        $users = User::factory(8)->sequence(
            ['name' => 'Rina Wulandari'],
            ['name' => 'Agus Pratama'],
            ['name' => 'Siti Nurhaliza'],
            ['name' => 'Doni Setiawan'],
            ['name' => 'Maya Putri'],
            ['name' => 'Fajar Nugroho'],
            ['name' => 'Dewi Lestari'],
            ['name' => 'Rizky Hidayat'],
        )->create();

        $allUsers = $users->push($testUser);

        // ── Cabang Olahraga ─────────────────────────────────────
        $padel     = Sport::create(['name' => 'Padel',    'slug' => 'padel',    'icon' => '🎾']);
        $badminton = Sport::create(['name' => 'Badminton','slug' => 'badminton','icon' => '🏸']);
        $futsal    = Sport::create(['name' => 'Futsal',   'slug' => 'futsal',   'icon' => '⚽']);
        $tenis     = Sport::create(['name' => 'Tenis',    'slug' => 'tenis',    'icon' => '🎾']);

        // ── Fasilitas ───────────────────────────────────────────
        $facilities = collect([
            ['name' => 'Parkir Luas',          'icon' => '🅿️'],
            ['name' => 'Kafe & Resto',          'icon' => '☕'],
            ['name' => 'Kamar Mandi & Shower',  'icon' => '🚿'],
            ['name' => 'Sewa Raket',            'icon' => '🏸'],
            ['name' => 'Wi-Fi Gratis',          'icon' => '📶'],
            ['name' => 'Mushola',               'icon' => '🕌'],
            ['name' => 'Loker',                 'icon' => '🔒'],
            ['name' => 'Tribun Penonton',        'icon' => '🪑'],
            ['name' => 'Vending Machine',        'icon' => '🥤'],
            ['name' => 'AC / Pendingin Ruangan', 'icon' => '❄️'],
        ])->map(fn (array $f): Facility => Facility::create($f));

        // Helper — pricing rules for all courts
        // Weekend (Sat=6, Sun=0) all day: price × 1.5
        // Prime-time (Mon–Fri 17:00–22:00): price × 1.25
        $pricingRulesFor = function (int $basePrice): array {
            return [
                [
                    'days'       => [0, 6],
                    'start_time' => '06:00',
                    'end_time'   => '22:00',
                    'price'      => (int) ($basePrice * 1.5),
                ],
                [
                    'days'       => [1, 2, 3, 4, 5],
                    'start_time' => '17:00',
                    'end_time'   => '22:00',
                    'price'      => (int) ($basePrice * 1.25),
                ],
            ];
        };

        // ── Venue 1: The Padel Garden, Jakarta Selatan ──────────
        $venueA = Venue::create([
            'name'        => 'The Padel Garden',
            'slug'        => 'the-padel-garden',
            'description' => 'Venue padel eksklusif di jantung Jakarta Selatan. Empat lapangan indoor berstandar internasional dengan pencahayaan premium dan fasilitas modern.',
            'address'     => 'Jl. Kemang Raya No. 45',
            'city'        => 'Jakarta Selatan',
            'latitude'    => -6.2608,
            'longitude'   => 106.8136,
            'phone'       => '021-71234567',
            'images'      => [
                'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?w=1200&q=80',
                'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
            ],
            'is_active'   => true,
        ]);
        $venueA->facilities()->attach($facilities->random(6)->pluck('id'));

        $courtImages = [
            'https://images.unsplash.com/photo-1622228514930-cbcfef9405b5?w=900&q=80',
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&q=80',
            'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80',
        ];

        $padelA1 = Court::create([
            'venue_id'      => $venueA->id,
            'sport_id'      => $padel->id,
            'name'          => 'Court A1 – Padel Indoor',
            'type'          => 'indoor',
            'price_per_hour'=> 120000,
            'pricing_rules' => $pricingRulesFor(120000),
            'images'        => $courtImages,
            'is_active'     => true,
        ]);

        $padelA2 = Court::create([
            'venue_id'      => $venueA->id,
            'sport_id'      => $padel->id,
            'name'          => 'Court A2 – Padel Indoor',
            'type'          => 'indoor',
            'price_per_hour'=> 120000,
            'pricing_rules' => $pricingRulesFor(120000),
            'images'        => $courtImages,
            'is_active'     => true,
        ]);

        $padelA3 = Court::create([
            'venue_id'      => $venueA->id,
            'sport_id'      => $padel->id,
            'name'          => 'Court A3 – Padel Outdoor',
            'type'          => 'outdoor',
            'price_per_hour'=> 100000,
            'pricing_rules' => $pricingRulesFor(100000),
            'images'        => $courtImages,
            'is_active'     => true,
        ]);

        $tenisA1 = Court::create([
            'venue_id'      => $venueA->id,
            'sport_id'      => $tenis->id,
            'name'          => 'Court T1 – Tenis',
            'type'          => 'outdoor',
            'price_per_hour'=> 90000,
            'pricing_rules' => $pricingRulesFor(90000),
            'images'        => $courtImages,
            'is_active'     => true,
        ]);

        // ── Venue 2: Oasis Courts GBK, Jakarta Pusat ────────────
        $venueB = Venue::create([
            'name'        => 'Oasis Courts GBK',
            'slug'        => 'oasis-courts-gbk',
            'description' => 'Terletak strategis di kawasan GBK, menawarkan lapangan badminton dan futsal berkualitas tinggi. Tersedia tribun penonton dan kafe modern.',
            'address'     => 'Jl. Pintu Satu Senayan',
            'city'        => 'Jakarta Pusat',
            'latitude'    => -6.2183,
            'longitude'   => 106.8020,
            'phone'       => '021-57891234',
            'images'      => [
                'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1200&q=80',
                'https://images.unsplash.com/photo-1519766304817-4f37bda74b38?w=1200&q=80',
            ],
            'is_active'   => true,
        ]);
        $venueB->facilities()->attach($facilities->random(7)->pluck('id'));

        $badmintonImages = [
            'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=900&q=80',
            'https://images.unsplash.com/photo-1519766304817-4f37bda74b38?w=900&q=80',
        ];

        $badB1 = Court::create([
            'venue_id'      => $venueB->id,
            'sport_id'      => $badminton->id,
            'name'          => 'Badminton Court 1',
            'type'          => 'indoor',
            'price_per_hour'=> 60000,
            'pricing_rules' => $pricingRulesFor(60000),
            'images'        => $badmintonImages,
            'is_active'     => true,
        ]);

        $badB2 = Court::create([
            'venue_id'      => $venueB->id,
            'sport_id'      => $badminton->id,
            'name'          => 'Badminton Court 2',
            'type'          => 'indoor',
            'price_per_hour'=> 60000,
            'pricing_rules' => $pricingRulesFor(60000),
            'images'        => $badmintonImages,
            'is_active'     => true,
        ]);

        $badB3 = Court::create([
            'venue_id'      => $venueB->id,
            'sport_id'      => $badminton->id,
            'name'          => 'Badminton Court 3',
            'type'          => 'indoor',
            'price_per_hour'=> 60000,
            'pricing_rules' => $pricingRulesFor(60000),
            'images'        => $badmintonImages,
            'is_active'     => true,
        ]);

        $futsalB1 = Court::create([
            'venue_id'      => $venueB->id,
            'sport_id'      => $futsal->id,
            'name'          => 'Futsal Court 1 – Rumput Sintetis',
            'type'          => 'indoor',
            'price_per_hour'=> 150000,
            'pricing_rules' => $pricingRulesFor(150000),
            'images'        => $badmintonImages,
            'is_active'     => true,
        ]);

        $futsalB2 = Court::create([
            'venue_id'      => $venueB->id,
            'sport_id'      => $futsal->id,
            'name'          => 'Futsal Court 2 – Vinyl',
            'type'          => 'indoor',
            'price_per_hour'=> 130000,
            'pricing_rules' => $pricingRulesFor(130000),
            'images'        => $badmintonImages,
            'is_active'     => true,
        ]);

        // ── Venue 3: Arena Sporta BSD, Tangerang ─────────────────
        $venueC = Venue::create([
            'name'        => 'Arena Sporta BSD',
            'slug'        => 'arena-sporta-bsd',
            'description' => 'Kompleks olahraga terpadu di BSD City. Lapangan padel, badminton, dan futsal outdoor premium. Cocok untuk komunitas dan turnamen.',
            'address'     => 'Jl. BSD Grand Boulevard No. 1',
            'city'        => 'Tangerang',
            'latitude'    => -6.3014,
            'longitude'   => 106.6537,
            'phone'       => '021-53671234',
            'images'      => [
                'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1200&q=80',
                'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&q=80',
            ],
            'is_active'   => true,
        ]);
        $venueC->facilities()->attach($facilities->random(5)->pluck('id'));

        $arenaImages = [
            'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=900&q=80',
            'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=900&q=80',
        ];

        $padelC1 = Court::create([
            'venue_id'      => $venueC->id,
            'sport_id'      => $padel->id,
            'name'          => 'Padel Arena 1',
            'type'          => 'outdoor',
            'price_per_hour'=> 95000,
            'pricing_rules' => $pricingRulesFor(95000),
            'images'        => $arenaImages,
            'is_active'     => true,
        ]);

        $padelC2 = Court::create([
            'venue_id'      => $venueC->id,
            'sport_id'      => $padel->id,
            'name'          => 'Padel Arena 2',
            'type'          => 'outdoor',
            'price_per_hour'=> 95000,
            'pricing_rules' => $pricingRulesFor(95000),
            'images'        => $arenaImages,
            'is_active'     => true,
        ]);

        $badC1 = Court::create([
            'venue_id'      => $venueC->id,
            'sport_id'      => $badminton->id,
            'name'          => 'Badminton Arena 1',
            'type'          => 'indoor',
            'price_per_hour'=> 55000,
            'pricing_rules' => $pricingRulesFor(55000),
            'images'        => $arenaImages,
            'is_active'     => true,
        ]);

        $futsalC1 = Court::create([
            'venue_id'      => $venueC->id,
            'sport_id'      => $futsal->id,
            'name'          => 'Futsal Arena – Outdoor',
            'type'          => 'outdoor',
            'price_per_hour'=> 110000,
            'pricing_rules' => $pricingRulesFor(110000),
            'images'        => $arenaImages,
            'is_active'     => true,
        ]);

        // ── Bookings ─────────────────────────────────────────────
        // All courts
        $allCourts = collect([
            $padelA1, $padelA2, $padelA3, $tenisA1,
            $badB1, $badB2, $badB3, $futsalB1, $futsalB2,
            $padelC1, $padelC2, $badC1, $futsalC1,
        ]);

        $today = now()->toDateString();

        // Today's fixed bookings so the welcome page shows occupied slots
        $todayBookings = [
            [$padelA1, '08:00', '10:00'],
            [$padelA1, '14:00', '16:00'],
            [$padelA1, '19:00', '21:00'],
            [$padelA2, '07:00', '09:00'],
            [$padelA2, '17:00', '19:00'],
            [$padelA3, '10:00', '12:00'],
            [$badB1,   '06:00', '08:00'],
            [$badB1,   '16:00', '18:00'],
            [$badB2,   '09:00', '11:00'],
            [$badB2,   '20:00', '22:00'],
            [$futsalB1,'15:00', '17:00'],
            [$futsalB2,'18:00', '20:00'],
            [$padelC1, '07:00', '09:00'],
            [$padelC2, '13:00', '15:00'],
        ];

        foreach ($todayBookings as [$court, $start, $end]) {
            $booking = Booking::create([
                'user_id'     => $allUsers->random()->id,
                'court_id'    => $court->id,
                'date'        => $today,
                'start_time'  => $start,
                'end_time'    => $end,
                'total_price' => $court->price_per_hour * (
                    (int) explode(':', $end)[0] - (int) explode(':', $start)[0]
                ),
                'status'      => fake()->randomElement(['confirmed', 'completed']),
            ]);

            Payment::create([
                'booking_id' => $booking->id,
                'method'     => fake()->randomElement(['bank_transfer', 'ewallet', 'cash']),
                'amount'     => $booking->total_price,
                'status'     => 'paid',
                'paid_at'    => now()->subHours(fake()->numberBetween(1, 48)),
            ]);
        }

        // Future bookings: 4–6 per day for 7 days
        $usedSlots = [];
        for ($day = 1; $day <= 7; $day++) {
            $date = now()->addDays($day)->toDateString();
            $targetCount = fake()->numberBetween(4, 7);
            $created = 0;
            $attempts = 0;

            while ($created < $targetCount && $attempts < 100) {
                $attempts++;
                $court     = $allCourts->random();
                $startHour = fake()->numberBetween(7, 20);
                $slotKey   = "{$court->id}-{$date}-{$startHour}";

                if (isset($usedSlots[$slotKey])) {
                    continue;
                }

                $usedSlots[$slotKey] = true;
                $start     = sprintf('%02d:00', $startHour);
                $end       = sprintf('%02d:00', $startHour + fake()->randomElement([1, 2]));
                $hours     = (int) explode(':', $end)[0] - (int) explode(':', $start)[0];
                $status    = fake()->randomElement(['pending', 'confirmed', 'confirmed', 'completed']);

                $booking = Booking::create([
                    'user_id'     => $allUsers->random()->id,
                    'court_id'    => $court->id,
                    'date'        => $date,
                    'start_time'  => $start,
                    'end_time'    => $end,
                    'total_price' => $court->price_per_hour * $hours,
                    'status'      => $status,
                ]);

                if (in_array($status, ['confirmed', 'completed'])) {
                    Payment::create([
                        'booking_id' => $booking->id,
                        'method'     => fake()->randomElement(['bank_transfer', 'ewallet', 'cash']),
                        'amount'     => $booking->total_price,
                        'status'     => 'paid',
                        'paid_at'    => now()->subDays(fake()->numberBetween(0, 3)),
                    ]);
                }

                $created++;
            }
        }

        // ── Ulasan ──────────────────────────────────────────────
        $venues = collect([$venueA, $venueB, $venueC]);
        $komentarPositif = [
            'Lapangannya bagus banget, terawat dengan baik. Pasti balik lagi!',
            'Fasilitas lengkap dan bersih. Parkir luas, ada kafe juga. Recommended!',
            'Harga sebanding dengan kualitas. Pelayanan ramah dan profesional.',
            'Tempatnya strategis dan mudah dijangkau. Lapangan indoor-nya nyaman.',
            'Sudah beberapa kali main di sini, selalu puas. Staff-nya helpful.',
            'Booking online gampang, lapangan sesuai ekspektasi. Top!',
            'Tempatnya cozy, cocok buat main bareng teman-teman sehabis kerja.',
            'Pencahayaannya optimal, bisa main sampai malam. Kamar mandinya bersih.',
            'Sewa raketnya terjangkau dan kualitasnya oke. Cocok buat pemula.',
            'Arena favoritku! Selalu ramai tapi tetap nyaman.',
            'Pertama kali coba padel di sini, langsung ketagihan!',
        ];

        $allUsers->each(function (User $user) use ($venues, $komentarPositif): void {
            $reviewedVenues = $venues->random(fake()->numberBetween(1, 2));
            $reviewedVenues->each(function (Venue $venue) use ($user, $komentarPositif): void {
                Review::create([
                    'user_id'  => $user->id,
                    'venue_id' => $venue->id,
                    'rating'   => fake()->numberBetween(3, 5),
                    'comment'  => fake()->optional(0.85)->randomElement($komentarPositif),
                ]);
            });
        });
    }
}
