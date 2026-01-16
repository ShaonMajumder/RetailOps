<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Tenant;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GenerateDailySalesSnapshot implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $tenantId,
        public readonly string $fromDate,
        public readonly string $toDate,
        public readonly string $cacheKey
    ) {
    }

    public function handle(TenantContext $tenantContext): void
    {
        $tenant = Tenant::query()->findOrFail($this->tenantId);
        $tenantContext->setTenant($tenant);

        $start = Carbon::parse($this->fromDate)->startOfDay();
        $end = Carbon::parse($this->toDate)->endOfDay();

        $rows = Order::query()
            ->where('status', Order::STATUS_PAID)
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('DATE(paid_at) as date, SUM(total_amount) as total_sales, COUNT(*) as orders')
            ->groupByRaw('DATE(paid_at)')
            ->orderBy('date')
            ->get()
            ->toArray();

        Cache::put($this->cacheKey, [
            'data' => $rows,
            'meta' => [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
            ],
        ], now()->addMinutes(30));
    }
}
