"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="brand">
          <div className="logo-mark">RO</div>
          <div>
            <div className="brand-title">RetailOps</div>
            <div className="brand-subtitle">Cloud POS + Inventory</div>
          </div>
        </div>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#quickstart">Quickstart</a>
          <Link href="/login" className="landing-cta">
            Get Started
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <div className="hero-badge">Purpose-built for multi-store retail</div>
          <h1 className="hero-title">
            RetailOps turns inventory, orders, and billing into a single <span>profit cockpit.</span>
          </h1>
          <p className="hero-body">
            Unify POS operations, inventory accuracy, and subscription billing for every tenant. Track stock drift,
            automate low-stock alerts, and ship faster decisions with live sales reporting.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn primary">
              Launch with the API
            </Link>
            <a href="#features" className="btn ghost">
              Explore features
            </a>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-title">Live Operations Signals</div>
          <div className="hero-card-row">
            <span>Low stock alerts</span>
            <strong>7 items</strong>
          </div>
          <div className="hero-card-row">
            <span>Daily gross sales</span>
            <strong>$18,420</strong>
          </div>
          <div className="hero-card-row">
            <span>Pending orders</span>
            <strong>12</strong>
          </div>
          <div className="hero-card-row">
            <span>Active tenants</span>
            <strong>3 plans</strong>
          </div>
        </div>
      </section>

      <section className="metric-strip">
        <div className="metric-card">
          <div className="metric-label">Stock accuracy target</div>
          <div className="metric-value">99.2%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Store onboarding sprint</div>
          <div className="metric-value">24h</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Faster reorder cycles</div>
          <div className="metric-value">3x</div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-title">Everything ops teams need. Nothing they do not.</div>
        <div className="section-subtitle">
          RetailOps is a multi-tenant platform that keeps data isolated per tenant while giving HQ a full operational
          picture.
        </div>
        <div className="feature-grid">
          {[
            {
              title: "Inventory guardrails",
              text: "Keep stock levels above zero with transactional order flows, low-stock thresholds, and real-time updates.",
            },
            {
              title: "Order operations",
              text: "Create, cancel, and pay orders with clear status transitions. Every change stays tenant scoped.",
            },
            {
              title: "Customer management",
              text: "Unify customer profiles with order history and quick lookup across stores and devices.",
            },
            {
              title: "Reporting suite",
              text: "Daily sales, top products, and low-stock insights available via API endpoints or exports.",
            },
            {
              title: "Billing integrity",
              text: "Stripe Cashier keeps subscription state as the source of truth with one active plan per tenant.",
            },
            {
              title: "Tenant isolation",
              text: "All models are tenant-aware and protected by policies, keeping each retailer fully isolated.",
            },
          ].map((item, index) => (
            <div key={item.title} className="feature-card">
              <div className="feature-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="feature-title">{item.title}</div>
              <div className="feature-text">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-title">A workflow that scales from one store to 10,000</div>
        <div className="section-subtitle">
          Launch in hours, add tenants in minutes, and ship updates without breaking operational guarantees.
        </div>
        <div className="workflow-grid">
          {[
            {
              step: "Step 01",
              title: "Provision tenants",
              text: "Create tenants, assign owners, and connect subscription plans for each retailer.",
            },
            {
              step: "Step 02",
              title: "Load catalog",
              text: "Sync products, set low-stock thresholds, and establish SKU discipline from day one.",
            },
            {
              step: "Step 03",
              title: "Track orders",
              text: "Capture sales, accept payments, and automatically adjust stock within transactions.",
            },
            {
              step: "Step 04",
              title: "Monitor reports",
              text: "Pull daily sales, top products, and low-stock insights to power dashboards.",
            },
          ].map((item) => (
            <div key={item.step} className="workflow-card">
              <div className="workflow-step">{item.step}</div>
              <div className="feature-title">{item.title}</div>
              <div className="feature-text">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="badge-row" style={{ padding: "0 40px 40px" }}>
        {["Multi-tenant", "Stripe Cashier", "Laravel 12", "Inventory integrity"].map((label) => (
          <span key={label} className="badge">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
