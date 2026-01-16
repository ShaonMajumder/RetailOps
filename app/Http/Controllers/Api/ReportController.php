<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateDailySalesSnapshot;
use App\Http\Resources\DailySalesResource;
use App\Http\Resources\TopProductResource;
use App\Http\Resources\ProductResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    use ApiResponse;

    public function dailySales(Request $request)
    {
        $this->authorize('viewReports', Order::class);

        [$start, $end] = $this->resolveDateRange($request);

        $rows = Order::query()
            ->where('status', Order::STATUS_PAID)
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('DATE(paid_at) as date, SUM(total_amount) as total_sales, COUNT(*) as orders')
            ->groupByRaw('DATE(paid_at)')
            ->orderBy('date')
            ->get();

        return $this->successResponse('Daily sales report retrieved.', DailySalesResource::collection($rows), [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
        ]);
    }

    public function topProducts(Request $request)
    {
        $this->authorize('viewReports', Order::class);

        [$start, $end] = $this->resolveDateRange($request);

        $rows = OrderItem::query()
            ->select('product_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->whereHas('order', function ($query) use ($start, $end) {
                $query->where('status', Order::STATUS_PAID)
                    ->whereBetween('paid_at', [$start, $end]);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->with('product:id,name,sku')
            ->get();

        return $this->successResponse('Top products report retrieved.', TopProductResource::collection($rows), [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
        ]);
    }

    public function lowStock()
    {
        $this->authorize('viewReports', Order::class);

        $products = Product::query()
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->orderBy('stock_quantity')
            ->get(['id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold']);

        return $this->successResponse('Low stock report retrieved.', ProductResource::collection($products));
    }

    public function dailySalesSnapshot(Request $request, TenantContext $tenantContext)
    {
        $this->authorize('viewReports', Order::class);

        [$start, $end] = $this->resolveDateRange($request);
        $tenant = $tenantContext->getTenant();

        $cacheKey = $this->buildDailySalesCacheKey($tenant->id, $start, $end);

        GenerateDailySalesSnapshot::dispatch(
            $tenant->id,
            $start->toDateString(),
            $end->toDateString(),
            $cacheKey
        );

        return $this->successResponse('Daily sales snapshot queued.', [
            'cache_key' => $cacheKey,
        ], [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
        ], 202);
    }

    public function dailySalesSnapshotResult(Request $request, TenantContext $tenantContext)
    {
        $this->authorize('viewReports', Order::class);

        [$start, $end] = $this->resolveDateRange($request);
        $tenant = $tenantContext->getTenant();

        $cacheKey = $this->buildDailySalesCacheKey($tenant->id, $start, $end);
        $payload = Cache::get($cacheKey);

        if (! $payload) {
            return $this->errorResponse('Daily sales snapshot not ready.', 202, [
                'cache_key' => $cacheKey,
            ]);
        }

        return $this->successResponse('Daily sales snapshot retrieved.', $payload['data'] ?? $payload, $payload['meta'] ?? null);
    }

    private function resolveDateRange(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $start = $from ? Carbon::parse($from)->startOfDay() : now()->subDays(6)->startOfDay();
        $end = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();

        return [$start, $end];
    }

    private function buildDailySalesCacheKey(int $tenantId, Carbon $start, Carbon $end): string
    {
        return sprintf(
            'daily_sales_snapshot:%d:%s:%s',
            $tenantId,
            $start->toDateString(),
            $end->toDateString()
        );
    }
}
