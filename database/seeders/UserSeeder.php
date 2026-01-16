<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@retailops.test'],
            [
                'name' => 'RetailOps Admin',
                'password' => Hash::make('password'),
                'role' => null,
                'is_super' => true,
            ]
        );

        $tenant = Tenant::query()->where('slug', 'retailops-demo')->firstOrFail();

        User::query()->updateOrCreate(
            ['email' => 'robistdotcom@gmail.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'RetailOps Owner',
                'password' => Hash::make('password'),
                'role' => 'owner',
                'is_super' => false,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'smazoomder@gmail.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Shaon Majumder',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'is_super' => false,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'staff2@retailops.test'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'RetailOps Staff Two',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'is_super' => false,
            ]
        );
    }
}
