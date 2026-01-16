<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (! $tenantId || ! ctype_digit((string) $tenantId)) {
            return response()->json([
                'success' => false,
                'message' => 'X-Tenant-ID header is required.',
                'data' => null,
                'meta' => null,
            ], 400);
        }

        $tenant = Tenant::query()->find($tenantId);

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid tenant.',
                'data' => null,
                'meta' => null,
            ], 404);
        }

        $user = $request->user();
        if ($user && $user->tenant_id && $user->tenant_id !== $tenant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant mismatch.',
                'data' => null,
                'meta' => null,
            ], 403);
        }

        $this->tenantContext->setTenant($tenant);
        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
