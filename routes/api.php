<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('google', [AuthController::class, 'googleLogin']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('orders/{order}/pay', [OrderController::class, 'pay']);

    Route::get('reports/daily-sales', [ReportController::class, 'dailySales']);
    Route::post('reports/daily-sales/snapshot', [ReportController::class, 'dailySalesSnapshot']);
    Route::get('reports/daily-sales/snapshot', [ReportController::class, 'dailySalesSnapshotResult']);
    Route::get('reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('reports/low-stock', [ReportController::class, 'lowStock']);

    Route::post('billing/subscribe', [BillingController::class, 'subscribe']);
    Route::get('billing/subscription', [BillingController::class, 'subscription']);
});
