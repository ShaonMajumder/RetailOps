<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isStaff();
    }

    public function view(User $user, Customer $customer): bool
    {
        return $this->ownsTenant($user, $customer) && ($user->isOwner() || $user->isStaff());
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->ownsTenant($user, $customer) && $user->isOwner();
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->ownsTenant($user, $customer) && $user->isOwner();
    }

    private function ownsTenant(User $user, Customer $customer): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $customer->tenant_id;
    }
}
