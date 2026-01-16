<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCustomerRequest;
use App\Http\Requests\Api\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;

class CustomerController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::query()->orderBy('name')->paginate(15);

        return $this->successResponse('Customers retrieved.', CustomerResource::collection($customers), [
            'current_page' => $customers->currentPage(),
            'last_page' => $customers->lastPage(),
            'per_page' => $customers->perPage(),
            'total' => $customers->total(),
        ]);
    }

    public function store(StoreCustomerRequest $request)
    {
        $this->authorize('create', Customer::class);

        $customer = Customer::query()->create($request->validated());

        return $this->successResponse('Customer created.', new CustomerResource($customer), null, 201);
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        return $this->successResponse('Customer retrieved.', new CustomerResource($customer));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $customer->update($request->validated());

        return $this->successResponse('Customer updated.', new CustomerResource($customer));
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        return $this->successResponse('Customer deleted.');
    }
}
