<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiResponseTime
{
    private const START_TIME_KEY = 'api_response_time_start';

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set(self::START_TIME_KEY, microtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $start = $request->attributes->get(self::START_TIME_KEY);
        if (! is_float($start)) {
            $start = microtime(true);
        }

        $durationMs = round((microtime(true) - $start) * 1000, 2);
        $route = $request->route();

        Log::info('API response time', [
            'method' => $request->method(),
            'path' => $request->path(),
            'route_name' => $route?->getName(),
            'route_action' => $route?->getActionName(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $durationMs,
            'tenant_id' => optional($request->attributes->get('tenant'))->id,
        ]);
    }
}
