<?php

namespace Database\Factories;

use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Venue>
 */
class VenueFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company().' Sports';

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->randomNumber(4),
            'description' => fake()->paragraph(3),
            'address' => fake()->streetAddress(),
            'city' => fake()->randomElement([
                'Jakarta Selatan',
                'Jakarta Utara',
                'Jakarta Barat',
                'Jakarta Timur',
                'Jakarta Pusat',
                'Tangerang',
                'Bekasi',
                'Depok',
                'Bogor',
                'Bandung',
            ]),
            'latitude' => fake()->latitude(-6.1, -6.4),
            'longitude' => fake()->longitude(106.7, 106.9),
            'phone' => fake()->phoneNumber(),
            'image_url' => null,
            'is_active' => true,
        ];
    }

    /**
     * Mark the venue as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
