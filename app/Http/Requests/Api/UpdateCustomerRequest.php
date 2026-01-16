<?php

namespace App\Http\Requests\Api;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContext::class)->tenantId();
        $customerId = $this->route('customer')?->id ?? $this->route('customer');

        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'nullable',
                'email',
                'max:150',
                Rule::unique('customers', 'email')
                    ->ignore($customerId)
                    ->where('tenant_id', $tenantId),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
