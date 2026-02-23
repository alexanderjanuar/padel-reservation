<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'paid', 'failed', 'refunded']);

        return [
            'booking_id' => Booking::factory(),
            'method' => fake()->randomElement(['bank_transfer', 'ewallet', 'cash']),
            'amount' => fake()->randomElement([
                200000,
                250000,
                300000,
                350000,
                400000,
                450000,
                500000,
            ]),
            'status' => $status,
            'paid_at' => $status === 'paid' ? fake()->dateTimeBetween('-7 days', 'now') : null,
        ];
    }

    /**
     * Set the payment as paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }
}
