<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isStaff();
    }

    public function view(User $user, Product $product): bool
    {
        return $this->ownsTenant($user, $product) && ($user->isOwner() || $user->isStaff());
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Product $product): bool
    {
        return $this->ownsTenant($user, $product) && $user->isOwner();
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->ownsTenant($user, $product) && $user->isOwner();
    }

    private function ownsTenant(User $user, Product $product): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $product->tenant_id;
    }
}
