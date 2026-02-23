<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'venue_id' => Venue::factory(),
            'rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->optional(0.7)->paragraph(),
        ];
    }
}
