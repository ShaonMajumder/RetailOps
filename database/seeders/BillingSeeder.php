<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Laravel\Cashier\Subscription;

class BillingSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('slug', 'retailops-demo')->firstOrFail();
        $plan = SubscriptionPlan::query()->where('slug', 'starter')->firstOrFail();

        $tenant->update([
            'stripe_id' => $tenant->stripe_id ?: 'cus_seeded_retailops',
        ]);

        Subscription::query()->updateOrCreate(
            [
                'stripe_id' => 'sub_seeded_retailops',
            ],
            [
                'tenant_id' => $tenant->id,
                'type' => 'default',
                'stripe_status' => 'active',
                'stripe_price' => $plan->stripe_price_id,
                'quantity' => 1,
                'trial_ends_at' => null,
                'ends_at' => null,
            ]
        );
    }
}
