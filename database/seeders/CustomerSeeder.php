<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('slug', 'retailops-demo')->firstOrFail();

        Customer::factory()
            ->count(3)
            ->for($tenant)
            ->sequence(
                ['name' => 'Lena Torres', 'email' => 'lena@example.com', 'phone' => '555-111-2222'],
                ['name' => 'Marshall Reed', 'email' => 'marshall@example.com', 'phone' => '555-333-4444'],
                ['name' => 'Carmen Diaz', 'email' => 'carmen@example.com', 'phone' => '555-555-6666']
            )
            ->create();
    }
}
