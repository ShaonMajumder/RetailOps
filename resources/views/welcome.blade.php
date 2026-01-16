<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ config('app.name', 'RetailOps') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|ibm-plex-sans:400,500,600" rel="stylesheet" />

        <style>
            :root {
                color-scheme: light;
                --bg: #0b141f;
                --bg-soft: #111c2b;
                --ink: #f7f2e9;
                --muted: #b6c1d2;
                --accent: #f2b84b;
                --accent-strong: #ff9f1a;
                --teal: #2ad1a3;
                --line: rgba(247, 242, 233, 0.12);
                --card: rgba(17, 28, 43, 0.9);
                --shadow: 0 20px 60px rgba(3, 9, 17, 0.55);
                --radius: 20px;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                font-family: "IBM Plex Sans", "Segoe UI", Tahoma, sans-serif;
                color: var(--ink);
                background: radial-gradient(1200px 700px at 5% -10%, rgba(242, 184, 75, 0.18), transparent 60%),
                    radial-gradient(900px 600px at 95% 0%, rgba(42, 209, 163, 0.2), transparent 55%),
                    linear-gradient(180deg, #0b141f 0%, #0b141f 40%, #0d1a29 100%);
                min-height: 100vh;
            }

            body::before {
                content: "";
                position: fixed;
                inset: 0;
                background-image: linear-gradient(120deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 40%),
                    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0, rgba(255, 255, 255, 0.04) 1px, transparent 1px, transparent 6px);
                pointer-events: none;
                mix-blend-mode: soft-light;
                opacity: 0.4;
            }

            a {
                color: inherit;
                text-decoration: none;
            }

            .page {
                position: relative;
                z-index: 1;
            }

            .container {
                width: min(1140px, 92vw);
                margin: 0 auto;
            }

            header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 28px 0;
            }

            .logo {
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: "Space Grotesk", "Segoe UI", Tahoma, sans-serif;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                font-size: 14px;
            }

            .logo-mark {
                width: 36px;
                height: 36px;
                border-radius: 12px;
                background: linear-gradient(135deg, var(--accent), var(--accent-strong));
                display: grid;
                place-items: center;
                color: #0b141f;
                font-size: 18px;
                font-weight: 700;
                box-shadow: inset 0 0 0 2px rgba(11, 20, 31, 0.2);
            }

            nav {
                display: flex;
                gap: 18px;
                align-items: center;
                color: var(--muted);
                font-size: 14px;
            }

            nav a {
                padding: 6px 10px;
                border-radius: 999px;
                transition: color 0.2s ease, background 0.2s ease;
            }

            nav a:hover {
                color: var(--ink);
                background: rgba(247, 242, 233, 0.08);
            }

            .cta {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 12px 18px;
                border-radius: 999px;
                font-weight: 600;
                font-size: 14px;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
            }

            .cta.primary {
                background: linear-gradient(135deg, var(--accent), var(--accent-strong));
                color: #1a1a1a;
                box-shadow: 0 12px 30px rgba(242, 184, 75, 0.3);
            }

            .cta.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 16px 40px rgba(242, 184, 75, 0.4);
            }

            .cta.ghost {
                border: 1px solid var(--line);
                color: var(--ink);
                background: rgba(11, 20, 31, 0.2);
            }

            .cta.ghost:hover {
                background: rgba(247, 242, 233, 0.08);
                transform: translateY(-2px);
            }

            .hero {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 40px;
                padding: 40px 0 60px;
                align-items: center;
            }

            .eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 14px;
                background: rgba(247, 242, 233, 0.08);
                border: 1px solid var(--line);
                border-radius: 999px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: var(--muted);
            }

            h1 {
                font-family: "Space Grotesk", "Segoe UI", Tahoma, sans-serif;
                font-size: clamp(2.6rem, 3.7vw, 4rem);
                margin: 18px 0 18px;
                line-height: 1.05;
            }

            h1 span {
                color: var(--accent);
            }

            .hero p {
                font-size: 1.05rem;
                color: var(--muted);
                line-height: 1.7;
                margin-bottom: 24px;
            }

            .hero-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 14px;
                margin-bottom: 26px;
            }

            .metrics {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
            }

            .metric {
                background: rgba(17, 28, 43, 0.8);
                border: 1px solid var(--line);
                padding: 16px;
                border-radius: 16px;
                text-align: left;
            }

            .metric strong {
                font-size: 1.2rem;
                display: block;
                margin-bottom: 4px;
            }

            .metric span {
                color: var(--muted);
                font-size: 0.85rem;
            }

            .hero-card {
                background: var(--card);
                border-radius: var(--radius);
                padding: 28px;
                border: 1px solid rgba(247, 242, 233, 0.12);
                box-shadow: var(--shadow);
                position: relative;
                overflow: hidden;
                animation: float 8s ease-in-out infinite;
            }

            .hero-card::after {
                content: "";
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 80% 0%, rgba(242, 184, 75, 0.15), transparent 50%);
            }

            .hero-card h3 {
                font-family: "Space Grotesk", "Segoe UI", Tahoma, sans-serif;
                margin: 0 0 14px;
            }

            .signal {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid var(--line);
                position: relative;
                z-index: 1;
            }

            .signal:last-child {
                border-bottom: none;
            }

            .signal span {
                color: var(--muted);
                font-size: 0.9rem;
            }

            .signal strong {
                color: var(--teal);
                font-weight: 600;
            }

            section {
                padding: 60px 0;
                border-top: 1px solid rgba(247, 242, 233, 0.08);
            }

            .section-title {
                font-family: "Space Grotesk", "Segoe UI", Tahoma, sans-serif;
                font-size: clamp(1.8rem, 2.4vw, 2.6rem);
                margin-bottom: 12px;
            }

            .section-subtitle {
                color: var(--muted);
                margin-bottom: 32px;
                max-width: 620px;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 18px;
            }

            .card {
                background: rgba(17, 28, 43, 0.85);
                border: 1px solid rgba(247, 242, 233, 0.1);
                border-radius: 18px;
                padding: 20px;
                min-height: 170px;
            }

            .card h4 {
                font-family: "Space Grotesk", "Segoe UI", Tahoma, sans-serif;
                margin: 14px 0 10px;
                font-size: 1.1rem;
            }

            .card p {
                color: var(--muted);
                line-height: 1.6;
                font-size: 0.95rem;
            }

            .icon {
                width: 38px;
                height: 38px;
                border-radius: 12px;
                display: grid;
                place-items: center;
                background: rgba(242, 184, 75, 0.12);
                border: 1px solid rgba(242, 184, 75, 0.3);
                color: var(--accent);
                font-weight: 700;
            }

            .workflow {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 16px;
            }

            .step {
                background: rgba(11, 20, 31, 0.55);
                border-radius: 18px;
                padding: 20px;
                border: 1px solid var(--line);
            }

            .step span {
                color: var(--accent);
                font-weight: 700;
                letter-spacing: 0.08em;
                font-size: 0.8rem;
            }

            .step h5 {
                margin: 10px 0 8px;
                font-size: 1.05rem;
            }

            .quickstart {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 22px;
                align-items: start;
            }

            .code-block {
                background: #0a111b;
                border: 1px solid rgba(247, 242, 233, 0.1);
                padding: 18px;
                border-radius: 16px;
                font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
                font-size: 0.85rem;
                color: #f1e7d3;
                white-space: pre-wrap;
            }

            footer {
                padding: 40px 0 60px;
                color: var(--muted);
                font-size: 0.9rem;
            }

            .badges {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 12px;
            }

            .badge {
                border: 1px solid var(--line);
                border-radius: 999px;
                padding: 6px 12px;
                font-size: 12px;
                color: var(--muted);
                background: rgba(11, 20, 31, 0.4);
            }

            .animate {
                animation: fadeUp 0.9s ease forwards;
                opacity: 0;
                transform: translateY(16px);
            }

            .delay-1 { animation-delay: 0.1s; }
            .delay-2 { animation-delay: 0.2s; }
            .delay-3 { animation-delay: 0.3s; }
            .delay-4 { animation-delay: 0.4s; }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes fadeUp {
                to { opacity: 1; transform: translateY(0); }
            }

            @media (max-width: 720px) {
                header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 16px;
                }

                nav {
                    flex-wrap: wrap;
                }

                .metrics {
                    grid-template-columns: 1fr;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                * {
                    animation: none !important;
                    transition: none !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="page">
            <div class="container">
                <header>
                    <div class="logo">
                        <div class="logo-mark">RO</div>
                        <div>
                            <div>RetailOps</div>
                            <small style="color: var(--muted); font-size: 11px; letter-spacing: 0.08em;">Cloud POS + Inventory</small>
                        </div>
                    </div>
                    <nav>
                        <a href="#features">Features</a>
                        <a href="#workflow">Workflow</a>
                        <a href="#quickstart">Quickstart</a>
                        <a class="cta ghost" href="#quickstart">Get Started</a>
                    </nav>
                </header>

                <section class="hero">
                    <div>
                        <div class="eyebrow animate">Purpose-built for multi-store retail</div>
                        <h1 class="animate delay-1">RetailOps turns inventory, orders, and billing into a single <span>profit cockpit</span>.</h1>
                        <p class="animate delay-2">Unify POS operations, inventory accuracy, and subscription billing for every tenant. Track stock drift, automate low-stock alerts, and ship faster decisions with live sales reporting.</p>
                        <div class="hero-actions animate delay-3">
                            <a class="cta primary" href="#quickstart">Launch with the API</a>
                            <a class="cta ghost" href="#features">Explore features</a>
                        </div>
                        <div class="metrics animate delay-4">
                            <div class="metric">
                                <strong>99.2%</strong>
                                <span>Stock accuracy target</span>
                            </div>
                            <div class="metric">
                                <strong>24h</strong>
                                <span>Store onboarding sprint</span>
                            </div>
                            <div class="metric">
                                <strong>3x</strong>
                                <span>Faster reorder cycles</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-card animate delay-2">
                        <h3>Live Operations Signals</h3>
                        <div class="signal">
                            <span>Low stock alerts</span>
                            <strong>7 items</strong>
                        </div>
                        <div class="signal">
                            <span>Daily gross sales</span>
                            <strong>$18,420</strong>
                        </div>
                        <div class="signal">
                            <span>Pending orders</span>
                            <strong>12</strong>
                        </div>
                        <div class="signal">
                            <span>Active tenants</span>
                            <strong>3 plans</strong>
                        </div>
                    </div>
                </section>
            </div>

            <section id="features">
                <div class="container">
                    <h2 class="section-title">Everything ops teams need. Nothing they do not.</h2>
                    <p class="section-subtitle">RetailOps is a multi-tenant platform that keeps data isolated per tenant while giving HQ a full operational picture.</p>
                    <div class="grid">
                        <div class="card">
                            <div class="icon">01</div>
                            <h4>Inventory guardrails</h4>
                            <p>Keep stock levels above zero with transactional order flows, low-stock thresholds, and real-time product updates.</p>
                        </div>
                        <div class="card">
                            <div class="icon">02</div>
                            <h4>Order operations</h4>
                            <p>Create, cancel, and pay orders with clear status transitions. Every change stays tenant-scoped and auditable.</p>
                        </div>
                        <div class="card">
                            <div class="icon">03</div>
                            <h4>Customer management</h4>
                            <p>Unify customer profiles with order history and quick lookup across stores and devices.</p>
                        </div>
                        <div class="card">
                            <div class="icon">04</div>
                            <h4>Reporting suite</h4>
                            <p>Daily sales, top products, and low-stock insights are available via API endpoints for dashboards or exports.</p>
                        </div>
                        <div class="card">
                            <div class="icon">05</div>
                            <h4>Billing integrity</h4>
                            <p>Stripe Cashier keeps subscription state as the source of truth with one active plan per tenant.</p>
                        </div>
                        <div class="card">
                            <div class="icon">06</div>
                            <h4>Tenant isolation</h4>
                            <p>All models are tenant-aware and protected by policies, keeping each retailer fully isolated.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="workflow">
                <div class="container">
                    <h2 class="section-title">A workflow that scales from one store to 10,000</h2>
                    <p class="section-subtitle">Launch in hours, add tenants in minutes, and ship updates without breaking operational guarantees.</p>
                    <div class="workflow">
                        <div class="step">
                            <span>STEP 01</span>
                            <h5>Provision tenants</h5>
                            <p>Create tenants, assign owners, and connect subscription plans for each retailer.</p>
                        </div>
                        <div class="step">
                            <span>STEP 02</span>
                            <h5>Load catalog</h5>
                            <p>Sync products, set low-stock thresholds, and establish SKU discipline from day one.</p>
                        </div>
                        <div class="step">
                            <span>STEP 03</span>
                            <h5>Track orders</h5>
                            <p>Capture sales, accept payments, and automatically adjust stock within transactions.</p>
                        </div>
                        <div class="step">
                            <span>STEP 04</span>
                            <h5>Monitor reports</h5>
                            <p>Pull daily sales, top products, and low stock insights to power dashboards.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="quickstart">
                <div class="container">
                    <h2 class="section-title">Quickstart from the API</h2>
                    <p class="section-subtitle">RetailOps is API-first. Use these routes to connect your UI or operational scripts.</p>
                    <div class="quickstart">
                        <div>
                            <div class="card" style="min-height: 0; margin-bottom: 16px;">
                                <h4>Core routes</h4>
                                <div class="badges">
                                    <span class="badge">POST /api/auth/register</span>
                                    <span class="badge">POST /api/auth/login</span>
                                    <span class="badge">GET /api/products</span>
                                    <span class="badge">GET /api/orders</span>
                                    <span class="badge">GET /api/reports/low-stock</span>
                                </div>
                            </div>
                            <div class="card" style="min-height: 0;">
                                <h4>Tenant guardrails</h4>
                                <p>All requests inside the tenant middleware require a valid auth token and tenant context. Ensure your client includes the tenant identifier header or subdomain configured by your middleware.</p>
                            </div>
                        </div>
                        <div class="code-block">
POST /api/auth/login
{
  "email": "owner@retailops.local",
  "password": "password"
}

GET /api/reports/daily-sales
Authorization: Bearer YOUR_TOKEN

POST /api/orders
Authorization: Bearer YOUR_TOKEN
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
                        </div>
                    </div>
                </div>
            </section>

            <footer>
                <div class="container">
                    <div>RetailOps is designed for production-grade tenant isolation, centralized authorization, and Stripe-backed billing.</div>
                    <div class="badges">
                        <span class="badge">Multi-tenant</span>
                        <span class="badge">Stripe Cashier</span>
                        <span class="badge">Laravel 12</span>
                        <span class="badge">Inventory integrity</span>
                    </div>
                </div>
            </footer>
        </div>
    </body>
</html>
