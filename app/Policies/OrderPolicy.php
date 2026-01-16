<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isStaff();
    }

    public function view(User $user, Order $order): bool
    {
        return $this->ownsTenant($user, $order) && ($user->isOwner() || $user->isStaff());
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isStaff();
    }

    public function cancel(User $user, Order $order): bool
    {
        return $this->ownsTenant($user, $order) && $user->isOwner();
    }

    public function pay(User $user, Order $order): bool
    {
        return $this->ownsTenant($user, $order) && $user->isOwner();
    }

    public function viewReports(User $user): bool
    {
        return $user->isOwner();
    }

    private function ownsTenant(User $user, Order $order): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $order->tenant_id;
    }
}
