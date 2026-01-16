<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->throttleApi('api');
        $middleware->appendToGroup('api', \App\Http\Middleware\LogApiResponseTime::class);
        $middleware->alias([
            'tenant' => \App\Http\Middleware\ResolveTenant::class,
        ]);
        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\ResolveTenant::class
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (ValidationException $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'data' => [
                    'errors' => $exception->errors(),
                ],
                'meta' => null,
            ], $exception->status);
        });

        $exceptions->renderable(function (ModelNotFoundException $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'data' => null,
                'meta' => null,
            ], 404);
        });

        $exceptions->renderable(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $status = $exception->getStatusCode();
            $message = $exception->getMessage() ?: 'Request failed.';

            return response()->json([
                'success' => false,
                'message' => $message,
                'data' => null,
                'meta' => null,
            ], $status);
        });

        $exceptions->renderable(function (Throwable $exception, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $message = config('app.debug') ? $exception->getMessage() : 'Server error.';

            return response()->json([
                'success' => false,
                'message' => $message,
                'data' => null,
                'meta' => null,
            ], 500);
        });
    })->create();
