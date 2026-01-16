<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderStockTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_deducts_and_cancellation_restores_stock(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'stock_quantity' => 5,
            'price' => 10.00,
            'low_stock_threshold' => 1,
        ]);

        Sanctum::actingAs($user);

        $response = $this->withHeader('X-Tenant-ID', $tenant->id)
            ->postJson('/api/orders', [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 3],
                ],
            ])
            ->assertStatus(201);

        $orderId = $response->json('data.id');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 2,
        ]);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->postJson("/api/orders/{$orderId}/cancel")
            ->assertOk();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 5,
        ]);
    }
}
