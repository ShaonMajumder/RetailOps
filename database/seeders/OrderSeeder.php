<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OrderService;
use App\Services\TenantContext;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('slug', 'retailops-demo')->firstOrFail();
        if (Order::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $owner = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('role', 'owner')
            ->firstOrFail();
        $customer = Customer::query()->where('tenant_id', $tenant->id)->first();
        $products = Product::query()->where('tenant_id', $tenant->id)->take(4)->get();

        $tenantContext = app(TenantContext::class);
        $tenantContext->setTenant($tenant);

        $orderService = app(OrderService::class);

        $paidOrder = $orderService->createOrder($owner, $customer?->id, [
            ['product_id' => $products[0]->id, 'quantity' => 2],
            ['product_id' => $products[1]->id, 'quantity' => 1],
        ]);
        $orderService->markPaid($paidOrder);

        $orderService->createOrder($owner, null, [
            ['product_id' => $products[2]->id, 'quantity' => 1],
            ['product_id' => $products[3]->id, 'quantity' => 3],
        ]);

        $tenantContext->setTenant(null);
    }
}
