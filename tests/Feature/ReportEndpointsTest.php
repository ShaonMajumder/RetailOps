<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reports_endpoints_return_data(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 15.00,
            'stock_quantity' => 4,
            'low_stock_threshold' => 5,
        ]);

        $order = Order::query()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => null,
            'user_id' => $owner->id,
            'status' => Order::STATUS_PAID,
            'total_amount' => 30.00,
            'paid_at' => Carbon::parse('2026-01-10 10:00:00'),
        ]);

        OrderItem::query()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 15.00,
            'total_price' => 30.00,
        ]);

        Sanctum::actingAs($owner);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->getJson('/api/reports/daily-sales?from=2026-01-01&to=2026-01-31')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.total_sales', 30);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->getJson('/api/reports/top-products?from=2026-01-01&to=2026-01-31')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.product_id', $product->id)
            ->assertJsonPath('data.0.total_quantity', 2);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->getJson('/api/reports/low-stock')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $product->id);
    }
}
