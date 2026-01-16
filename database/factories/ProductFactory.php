<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'name' => ucfirst($name),
            'sku' => strtoupper(Str::random(8)),
            'price' => fake()->randomFloat(2, 2, 250),
            'stock_quantity' => fake()->numberBetween(5, 120),
            'low_stock_threshold' => fake()->numberBetween(2, 20),
        ];
    }
}
