# RetailOps API

RetailOps is a cloud-based, multi-tenant POS & inventory management SaaS for small and mid-sized retailers. It provides real-time stock tracking, order processing, role-based access control, and sales reporting via an API-first backend.

Version: 1.2.6

Demo Video : https://www.youtube.com/watch?v=7DK-HktfHKg

## Product overview

RetailOps targets:

-   Single-store retailers
-   Multi-store retail chains
-   Restaurants / cafes needing simple POS + inventory control

## Business model

RetailOps is a B2B SaaS with recurring subscription revenue.

Example plans:

-   Starter — Single store
-   Growth — Multi-store
-   Pro — Advanced reports & roles

Subscriptions are managed using Laravel Cashier (Stripe).

## Quickstart (Docker)

1. Run the startup script (Windows):
    ```powershell
    .\scripts\dev-up.ps1
    ```
    Or macOS/Linux:
    ```bash
    ./scripts/dev-up.sh
    ```
2. Manual alternative (if you prefer):
    ```bash
    cp docker/environment/.env.local .env
    docker compose up -d --build
    ```
3. Optional manual commands (if you disabled auto-migrate/seed):
    ```bash
    docker compose exec app composer install
    docker compose exec app php artisan key:generate
    docker compose exec app php artisan migrate --seed
    ```
4. Stop the stack when done:
    ```bash
    docker compose down
    ```

API base URL: `http://localhost:8080`

## Frontend (Next.js SPA)

The operations console lives in `frontend/` and consumes the API endpoints.

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000/`

## Demo recording (Playwright)

From `frontend/`:

```bash
npm install
npx playwright install
Set `DEMO_EMAIL` and `DEMO_PASSWORD` in `frontend/.env.local` (or `.env` at the repo root), then run:
DEMO_BROWSER_CHANNEL=chrome npm run demo:record+titles
```

## Seeded accounts (after migrate --seed)

-   Super user: `admin@retailops.test` / `password`
-   Tenant owner: `owner@retailops.test` / `password`
-   Staff users: `staff1@retailops.test` / `password`, `staff2@retailops.test` / `password`

Seeded tenant slug: `retailops-demo`

## Stripe test price IDs (seeded)

-   Starter: `price_test_starter`
-   Growth: `price_test_growth`
-   Pro: `price_test_pro`

Replace these with real Stripe price IDs in production. For local development, set `STRIPE_KEY` and `STRIPE_SECRET` in `.env`.

## Architecture highlights

-   Multi-tenancy resolved by `X-Tenant-ID` header.
-   `ResolveTenant` middleware sets tenant context for each request.
-   `BelongsToTenant` global scope enforces tenant isolation across Products, Customers, Orders.
-   Policies define authorization rules (no authorization logic in controllers).
-   Orders are created and cancelled inside DB transactions with row-level locks.

## Key design decisions

-   Stock deduction uses `SELECT ... FOR UPDATE` to prevent negative inventory.
-   SKU is unique per tenant (`tenant_id`, `sku`).
-   Reports use aggregate SQL to avoid N+1 queries.

## API examples

Authenticate:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@retailops.test","password":"password"}'
```

Set `X-Tenant-ID` and `Authorization` for tenant requests:

```bash
curl http://localhost:8080/api/products \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: 1"
```

Create order:

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: 1" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":2}]}'
```

Reports:

```bash
curl http://localhost:8080/api/reports/daily-sales?from=2026-01-01&to=2026-01-31 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: 1"
```

Postman collection: `docs/postman/retailops.postman_collection.json`

Swagger UI: `http://localhost:8080/docs` (spec: `public/openapi.json`)

Demo video: See the submission demo video for a walkthrough of setup, multi-tenancy, auth, orders, and reports.

## Indexes (performance)

-   `products`: `tenant_id, sku` (unique), `tenant_id, stock_quantity`
-   `orders`: `tenant_id, status`, `tenant_id, created_at`, `tenant_id, paid_at`
-   `order_items`: `tenant_id, product_id`
-   `customers`: `tenant_id, name`

## Operational expectations

After seeding:

-   At least one active tenant and subscription
-   Multiple users with roles
-   Products, customers, and orders present
-   Reports return data immediately
-   Billing endpoints return subscription state

## Testing

Run the test suite:

```bash
docker compose exec app php artisan test
```
