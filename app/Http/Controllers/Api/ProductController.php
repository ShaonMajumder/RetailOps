<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Requests\Api\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;

class ProductController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()->orderBy('name')->paginate(15);

        return $this->successResponse('Products retrieved.', ProductResource::collection($products), [
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'per_page' => $products->perPage(),
            'total' => $products->total(),
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);

        $product = Product::query()->create($request->validated());

        return $this->successResponse('Product created.', new ProductResource($product), null, 201);
    }

    public function show(Product $product)
    {
        $this->authorize('view', $product);

        return $this->successResponse('Product retrieved.', new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product);

        $product->update($request->validated());

        return $this->successResponse('Product updated.', new ProductResource($product));
    }

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);

        $product->delete();

        return $this->successResponse('Product deleted.');
    }
}
