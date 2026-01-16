<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\GoogleLoginRequest;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Resources\TenantResource;
use App\Http\Resources\UserResource;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(RegisterRequest $request)
    {
        $planSlug = $request->input('plan', 'free');
        $plan = SubscriptionPlan::query()->where('slug', $planSlug)->first()
            ?? SubscriptionPlan::query()->where('slug', 'starter')->firstOrFail();

        $tenantName = $request->input('tenant_name');
        $slugBase = Str::slug($tenantName);
        $slug = $slugBase;
        $suffix = 1;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $slugBase.'-'.$suffix;
            $suffix++;
        }

        [$tenant, $user] = $this->createTenantAndOwner(
            $plan,
            $tenantName,
            $slug,
            $request->input('email'),
            $request->input('name'),
            $request->input('password')
        );

        $token = $user->createToken('api')->plainTextToken;

        $tenant->load('subscriptionPlan');

        return $this->successResponse('Registration successful.', [
            'token' => $token,
            'user' => new UserResource($user),
            'tenant' => new TenantResource($tenant),
        ], null, 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::query()->where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            return $this->errorResponse('Invalid credentials.', 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return $this->successResponse('Login successful.', [
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function googleLogin(GoogleLoginRequest $request)
    {
        try {
            $driver = Socialite::driver('google')->stateless();

            if ($request->filled('redirect_uri')) {
                $driver->redirectUrl($request->input('redirect_uri'));
            }

            $googleUser = $driver->user();
        } catch (\Throwable $exception) {
            return $this->errorResponse('Google authentication failed.', 401);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return $this->errorResponse('Google account email is missing.', 422);
        }

        $user = User::query()->where('email', $email)->first();
        $googleId = $googleUser->getId();

        if (! $user) {
            $tenantName = $request->input('tenant_name');
            $displayName = $googleUser->getName() ?: $email;

            if (! $tenantName) {
                $fallbackBase = trim((string) Str::of($displayName)->before('@')) ?: 'RetailOps';
                $tenantName = $fallbackBase.' Store';
            }

            $plan = SubscriptionPlan::query()->where('slug', 'free')->first()
                ?? SubscriptionPlan::query()->where('slug', 'starter')->firstOrFail();

            $slugBase = Str::slug($tenantName);
            $slug = $slugBase;
            $suffix = 1;

            while (Tenant::query()->where('slug', $slug)->exists()) {
                $slug = $slugBase.'-'.$suffix;
                $suffix++;
            }

            [$tenant, $user] = $this->createTenantAndOwner(
                $plan,
                $tenantName,
                $slug,
                $email,
                $displayName ?: 'Owner',
                Str::random(32)
            );

            $tenant->load('subscriptionPlan');
        }

        if ($user->google_id && $user->google_id !== $googleId) {
            return $this->errorResponse('Google account mismatch.', 403);
        }

        if (! $user->google_id) {
            $user->forceFill(['google_id' => $googleId])->save();
        }

        $token = $user->createToken('api')->plainTextToken;

        return $this->successResponse('Login successful.', [
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function logout()
    {
        $user = request()->user();
        $user?->currentAccessToken()?->delete();

        return $this->successResponse('Logged out.');
    }

    private function createTenantAndOwner(
        SubscriptionPlan $plan,
        string $tenantName,
        string $slug,
        string $email,
        string $name,
        string $password
    ): array {
        return DB::transaction(function () use ($plan, $tenantName, $slug, $email, $name, $password) {
            $tenant = Tenant::query()->create([
                'subscription_plan_id' => $plan->id,
                'name' => $tenantName,
                'slug' => $slug,
                'billing_email' => $email,
            ]);

            $user = User::query()->create([
                'tenant_id' => $tenant->id,
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'owner',
            ]);

            return [$tenant, $user];
        });
    }
}
