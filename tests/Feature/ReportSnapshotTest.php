<?php

namespace Tests\Feature;

use App\Jobs\GenerateDailySalesSnapshot;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_sales_snapshot_is_queued(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        Sanctum::actingAs($owner);
        Queue::fake();

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->postJson('/api/reports/daily-sales/snapshot?from=2026-01-01&to=2026-01-31')
            ->assertStatus(202)
            ->assertJsonPath('success', true);

        Queue::assertPushed(GenerateDailySalesSnapshot::class);
    }

    public function test_daily_sales_snapshot_returns_cached_data(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 12.00,
            'stock_quantity' => 5,
            'low_stock_threshold' => 1,
        ]);

        $order = Order::query()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => null,
            'user_id' => $owner->id,
            'status' => Order::STATUS_PAID,
            'total_amount' => 24.00,
            'paid_at' => Carbon::parse('2026-01-20 08:00:00'),
        ]);

        OrderItem::query()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 12.00,
            'total_price' => 24.00,
        ]);

        $start = Carbon::parse('2026-01-01')->toDateString();
        $end = Carbon::parse('2026-01-31')->toDateString();
        $cacheKey = sprintf('daily_sales_snapshot:%d:%s:%s', $tenant->id, $start, $end);

        GenerateDailySalesSnapshot::dispatchSync($tenant->id, $start, $end, $cacheKey);

        Sanctum::actingAs($owner);

        $this->withHeader('X-Tenant-ID', $tenant->id)
            ->getJson('/api/reports/daily-sales/snapshot?from=2026-01-01&to=2026-01-31')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.total_sales', 24);
    }
}
