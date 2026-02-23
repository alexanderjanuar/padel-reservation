<?php

namespace Database\Factories;

use App\Models\Court;
use App\Models\Sport;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Court>
 */
class CourtFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'venue_id' => Venue::factory(),
            'sport_id' => Sport::factory(),
            'name' => 'Lapangan '.fake()->numberBetween(1, 10),
            'type' => fake()->randomElement(['indoor', 'outdoor']),
            'price_per_hour' => fake()->randomElement([
                200000,
                250000,
                300000,
                350000,
                400000,
                450000,
                500000,
            ]),
            'is_active' => true,
        ];
    }

    /**
     * Mark the court as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
