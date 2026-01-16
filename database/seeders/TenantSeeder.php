<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $plan = SubscriptionPlan::query()->where('slug', 'starter')->firstOrFail();

        Tenant::query()->updateOrCreate(
            ['slug' => 'retailops-demo'],
            [
                'subscription_plan_id' => $plan->id,
                'name' => 'ReailOps Demo Tenant',
                'billing_email' => 'owner@retailops.test',
            ]
        );
    }
}
