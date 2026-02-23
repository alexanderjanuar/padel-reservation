<?php

namespace Database\Factories;

use App\Models\Facility;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Facility>
 */
class FacilityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Parkir',
                'Kafe',
                'Kamar Mandi',
                'Sewa Raket',
                'Parkir Valet',
                'Wi-Fi',
                'Mushola',
                'Pro Shop',
                'Loker',
                'Tribun Penonton',
            ]),
            'icon' => null,
        ];
    }
}
