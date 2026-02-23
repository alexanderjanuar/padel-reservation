<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startHour = fake()->numberBetween(6, 22);
        $startTime = str_pad($startHour, 2, '0', STR_PAD_LEFT).':00';
        $endTime = str_pad($startHour + 1, 2, '0', STR_PAD_LEFT).':00';

        return [
            'user_id' => User::factory(),
            'court_id' => Court::factory(),
            'date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_price' => fake()->randomElement([
                200000,
                250000,
                300000,
                350000,
                400000,
                450000,
                500000,
            ]),
            'status' => fake()->randomElement(['pending', 'confirmed', 'cancelled', 'completed']),
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    /**
     * Set the booking as confirmed.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'confirmed',
        ]);
    }

    /**
     * Set the booking as pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'pending',
        ]);
    }
}
