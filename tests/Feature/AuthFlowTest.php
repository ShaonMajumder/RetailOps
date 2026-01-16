<?php

namespace Tests\Feature;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_tenant_and_owner(): void
    {
        SubscriptionPlan::factory()->create([
            'name' => 'Starter',
            'slug' => 'starter',
            'stripe_price_id' => 'price_test_starter',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'tenant_name' => 'Demo Store',
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'plan' => 'starter',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'owner@example.com')
            ->assertJsonPath('data.tenant.subscription_plan', 'starter');

        $this->assertDatabaseHas('tenants', [
            'name' => 'Demo Store',
            'billing_email' => 'owner@example.com',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.com',
            'role' => 'owner',
        ]);
    }

    public function test_login_returns_token(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'owner@example.com')
            ->assertJsonPath('data.user.tenant_id', $tenant->id)
            ->assertJsonStructure(['data' => ['token']]);
    }
}
