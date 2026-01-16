<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_order_calculates_total_and_deducts_stock(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 12.50,
            'stock_quantity' => 10,
            'low_stock_threshold' => 1,
        ]);

        $service = new OrderService();

        $order = $service->createOrder($user, null, [
            ['product_id' => $product->id, 'quantity' => 2],
        ]);

        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame('25.00', (string) $order->total_amount);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 8,
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'total_price' => 25.00,
        ]);
    }

    public function test_create_order_requires_tenant_context(): void
    {
        $user = User::factory()->create([
            'tenant_id' => null,
            'role' => 'owner',
        ]);

        $service = new OrderService();

        $this->expectException(ValidationException::class);
        $service->createOrder($user, null, [
            ['product_id' => 1, 'quantity' => 1],
        ]);
    }

    public function test_create_order_rejects_insufficient_stock(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 10.00,
            'stock_quantity' => 1,
            'low_stock_threshold' => 0,
        ]);

        $service = new OrderService();

        $this->expectException(ValidationException::class);
        $service->createOrder($user, null, [
            ['product_id' => $product->id, 'quantity' => 2],
        ]);
    }

    public function test_cancel_order_is_idempotent(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 5.00,
            'stock_quantity' => 5,
            'low_stock_threshold' => 0,
        ]);

        $service = new OrderService();
        $order = $service->createOrder($user, null, [
            ['product_id' => $product->id, 'quantity' => 2],
        ]);

        $service->cancelOrder($order);
        $service->cancelOrder($order);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => Order::STATUS_CANCELLED,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 5,
        ]);
    }

    public function test_mark_paid_sets_status_and_timestamp(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'owner',
        ]);

        $product = Product::factory()->for($tenant)->create([
            'price' => 9.00,
            'stock_quantity' => 3,
            'low_stock_threshold' => 0,
        ]);

        $service = new OrderService();
        $order = $service->createOrder($user, null, [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $order = $service->markPaid($order);

        $this->assertSame(Order::STATUS_PAID, $order->status);
        $this->assertNotNull($order->paid_at);
    }
}
