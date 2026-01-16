<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SubscribeRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\SubscriptionPlan;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Laravel\Cashier\Exceptions\IncompletePayment;

class BillingController extends Controller
{
    use ApiResponse;

    public function subscribe(SubscribeRequest $request, TenantContext $tenantContext): JsonResponse
    {
        $tenant = $tenantContext->getTenant();
        $this->authorize('manageBilling', $tenant);

        $plan = SubscriptionPlan::query()
            ->where('slug', $request->input('plan'))
            ->firstOrFail();

        $subscription = $tenant->subscription('default');
        if ($subscription && $subscription->active()) {
            return $this->errorResponse('Tenant already has an active subscription.', 422);
        }

        try {
            $subscription = $tenant->newSubscription('default', $plan->stripe_price_id)
                ->create($request->input('payment_method'), [
                    'email' => $tenant->billing_email,
                ]);
        } catch (IncompletePayment $exception) {
            return $this->errorResponse('Payment requires additional action.', 402, [
                'payment_intent' => $exception->payment->id,
            ]);
        }

        $tenant->update(['subscription_plan_id' => $plan->id]);

        return $this->successResponse('Subscription created.', [
            'subscription' => new SubscriptionResource($subscription),
            'plan' => new SubscriptionPlanResource($plan),
        ], null, 201);
    }

    public function subscription(TenantContext $tenantContext): JsonResponse
    {
        $tenant = $tenantContext->getTenant();
        $this->authorize('manageBilling', $tenant);

        $subscription = $tenant->subscription('default');
        $plan = $tenant->subscriptionPlan;

        return $this->successResponse('Subscription retrieved.', [
            'subscription' => $subscription ? new SubscriptionResource($subscription) : null,
            'plan' => $plan ? new SubscriptionPlanResource($plan) : null,
        ]);
    }
}
