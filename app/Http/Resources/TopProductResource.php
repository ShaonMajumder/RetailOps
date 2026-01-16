<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopProductResource extends JsonResource
{
    /**
     * @param  Request  $request
     */
    public function toArray($request): array
    {
        return [
            'product_id' => $this->product_id,
            'name' => $this->product?->name,
            'sku' => $this->product?->sku,
            'total_quantity' => (int) $this->total_quantity,
            'total_revenue' => $this->total_revenue,
        ];
    }
}
