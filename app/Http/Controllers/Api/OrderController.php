<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly OrderService $orderService)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::query()
            ->with(['customer', 'items.product'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return $this->successResponse('Orders retrieved.', OrderResource::collection($orders), [
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        $this->authorize('create', Order::class);

        $order = $this->orderService->createOrder(
            $request->user(),
            $request->input('customer_id'),
            $request->input('items')
        );

        return $this->successResponse('Order created.', new OrderResource($order), null, 201);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['customer', 'items.product']);

        return $this->successResponse('Order retrieved.', new OrderResource($order));
    }

    public function cancel(Order $order)
    {
        $this->authorize('cancel', $order);

        $order = $this->orderService->cancelOrder($order);

        return $this->successResponse('Order cancelled.', new OrderResource($order));
    }

    public function pay(Order $order)
    {
        $this->authorize('pay', $order);

        if ($order->status !== Order::STATUS_PENDING) {
            return $this->errorResponse('Only pending orders can be paid.', 422);
        }

        $order = $this->orderService->markPaid($order);

        return $this->successResponse('Order marked as paid.', new OrderResource($order));
    }
}
