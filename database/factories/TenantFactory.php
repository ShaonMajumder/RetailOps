<?php

namespace Database\Factories;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'subscription_plan_id' => SubscriptionPlan::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(5),
            'billing_email' => fake()->companyEmail(),
        ];
    }
}
