<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PolicyEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_delete_products(): void
    {
        $tenant = Tenant::factory()->create();
        $staff = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'staff',
        ]);

        $product = Product::factory()->for($tenant)->create();

        Sanctum::actingAs($staff);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->deleteJson("/api/products/{$product->id}")
            ->assertStatus(403);
    }
}
