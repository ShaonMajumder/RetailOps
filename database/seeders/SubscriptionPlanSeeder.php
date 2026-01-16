<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        SubscriptionPlan::query()->updateOrCreate(
            ['slug' => 'free'],
            [
                'name' => 'Free',
                'stripe_price_id' => 'price_free',
                'price_cents' => 0,
                'features' => ['Single store', 'Core POS features'],
            ]
        );

        SubscriptionPlan::query()->updateOrCreate(
            ['slug' => 'starter'],
            [
                'name' => 'Starter',
                'stripe_price_id' => 'price_test_starter',
                'price_cents' => 2900,
                'features' => ['Single store', 'Core POS features'],
            ]
        );

        SubscriptionPlan::query()->updateOrCreate(
            ['slug' => 'growth'],
            [
                'name' => 'Growth',
                'stripe_price_id' => 'price_test_growth',
                'price_cents' => 7900,
                'features' => ['Multi-store', 'Inventory alerts'],
            ]
        );

        SubscriptionPlan::query()->updateOrCreate(
            ['slug' => 'pro'],
            [
                'name' => 'Pro',
                'stripe_price_id' => 'price_test_pro',
                'price_cents' => 14900,
                'features' => ['Advanced reports', 'Role management'],
            ]
        );
    }
}
