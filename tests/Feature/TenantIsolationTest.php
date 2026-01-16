<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_cannot_access_other_tenant_product(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'role' => 'owner',
        ]);

        $productB = Product::factory()->for($tenantB)->create();

        Sanctum::actingAs($user);

        $this->withHeader('X-Tenant-ID', $tenantA->id)
            ->getJson("/api/products/{$productB->id}")
            ->assertStatus(404);
    }
}
