<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    /**
     * @param  Request  $request
     */
    public function toArray($request): array
    {
        return [
            'name' => $this->name,
            'stripe_id' => $this->stripe_id,
            'status' => $this->stripe_status,
            'trial_ends_at' => $this->trial_ends_at,
            'ends_at' => $this->ends_at,
        ];
    }
}
