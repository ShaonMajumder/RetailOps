<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_context_tracks_tenant_state(): void
    {
        $context = new TenantContext();
        $tenant = Tenant::factory()->create();

        $this->assertFalse($context->hasTenant());
        $this->assertNull($context->getTenant());
        $this->assertNull($context->tenantId());

        $context->setTenant($tenant);

        $this->assertTrue($context->hasTenant());
        $this->assertSame($tenant->id, $context->tenantId());
        $this->assertSame($tenant->id, $context->getTenant()?->id);
    }
}
