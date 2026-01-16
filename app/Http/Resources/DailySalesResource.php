<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DailySalesResource extends JsonResource
{
    /**
     * @param  Request  $request
     */
    public function toArray($request): array
    {
        return [
            'date' => $this->date,
            'total_sales' => $this->total_sales,
            'orders' => (int) $this->orders,
        ];
    }
}
