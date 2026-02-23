<?php

namespace Database\Factories;

use App\Models\Sport;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sport>
 */
class SportFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Padel',
            'Tenis',
            'Badminton',
            'Futsal',
            'Basket',
            'Voli',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'icon' => null,
        ];
    }
}
