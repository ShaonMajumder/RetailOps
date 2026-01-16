<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function manageBilling(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $tenant->id && $user->isOwner();
    }
}
