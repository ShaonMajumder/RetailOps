<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('slug', 'retailops-demo')->firstOrFail();
        $defaults = [
            ['name' => 'Espresso Beans 1kg', 'sku' => 'BEANS-1KG', 'price' => 28.50, 'stock_quantity' => 40, 'low_stock_threshold' => 8],
            ['name' => 'Paper Cups 12oz', 'sku' => 'CUPS-12OZ', 'price' => 9.90, 'stock_quantity' => 120, 'low_stock_threshold' => 20],
            ['name' => 'Almond Milk 1L', 'sku' => 'MILK-ALM', 'price' => 3.75, 'stock_quantity' => 60, 'low_stock_threshold' => 10],
            ['name' => 'Vanilla Syrup 750ml', 'sku' => 'SYR-VAN', 'price' => 11.50, 'stock_quantity' => 25, 'low_stock_threshold' => 5],
            ['name' => 'Granola Bars (Box)', 'sku' => 'GRAN-BOX', 'price' => 16.00, 'stock_quantity' => 30, 'low_stock_threshold' => 6],
        ];

        foreach ($defaults as $attributes) {
            Product::query()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'sku' => $attributes['sku']],
                array_merge($attributes, ['tenant_id' => $tenant->id])
            );
        }

        $targetCount = 8;
        $existingCount = Product::query()
            ->where('tenant_id', $tenant->id)
            ->count();
        $missingCount = max(0, $targetCount - $existingCount);

        if ($missingCount > 0) {
            Product::factory()
                ->count($missingCount)
                ->for($tenant)
                ->create();
        }
    }
}
