<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createOrder(User $user, ?int $customerId, array $items): Order
    {
        return DB::transaction(function () use ($user, $customerId, $items) {
            if (!$user->tenant_id) {
                throw ValidationException::withMessages([
                    'tenant' => ['User is missing a tenant context.'],
                ]);
            }

            $tenantId = $user->tenant_id;

            $order = Order::query()->create([
                'tenant_id' => $tenantId,
                'customer_id' => $customerId,
                'user_id' => $user->id,
                'status' => Order::STATUS_PENDING,
                'total_amount' => 0,
            ]);

            $total = 0;

            foreach ($items as $item) {
                $product = Product::query()
                    ->whereKey($item['product_id'])
                    ->where('tenant_id', $tenantId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($product->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for {$product->name}."],
                    ]);
                }

                $product->decrement('stock_quantity', $item['quantity']);

                $lineTotal = round(((float) $product->price) * $item['quantity'], 2);

                OrderItem::query()->create([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'total_price' => $lineTotal,
                ]);

                $total += $lineTotal;
            }

            $order->update(['total_amount' => $total]);

            return $order->load(['items.product', 'customer']);
        });
    }

    public function cancelOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->status === Order::STATUS_CANCELLED) {
                return $order->load(['items.product', 'customer']);
            }

            $order->load('items');

            foreach ($order->items as $item) {
                Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->increment('stock_quantity', $item->quantity);
            }

            $order->update([
                'status' => Order::STATUS_CANCELLED,
            ]);

            return $order->load(['items.product', 'customer']);
        });
    }

    public function markPaid(Order $order): Order
    {
        $order->update([
            'status' => Order::STATUS_PAID,
            'paid_at' => now(),
        ]);

        return $order->load(['items.product', 'customer']);
    }
}
