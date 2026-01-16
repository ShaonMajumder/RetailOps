"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "./SettingsProvider";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/auth", label: "Auth" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/orders", label: "Orders" },
  { href: "/reports", label: "Reports" },
  { href: "/billing", label: "Billing" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { baseUrl, tenantId, tenantName, token, user, clearAuth } = useSettings();

  if (pathname === "/login") {
    return <div className="auth-layout">{children}</div>;
  }
  if (pathname === "/") {
    return <div className="landing-shell">{children}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-mark">RO</div>
          <div>
            <div className="brand-title">RetailOps</div>
            <div className="brand-subtitle">Cloud POS + Inventory</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <div className="pill">Active Tenant</div>
          <div className="sidebar-metric">{tenantName || tenantId || "Not set"}</div>
          <div className="sidebar-meta">{baseUrl}</div>
          <div className={`status-chip ${token ? "ok" : "warn"}`}>
            {token ? "Token ready" : "Connect auth token"}
          </div>
          {user && (
            <div className="sidebar-meta" style={{ marginTop: "8px" }}>
              {user.name} - {user.role}
            </div>
          )}
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">RetailOps Operations Console</div>
            <div className="topbar-subtitle">
              Manage inventory, orders, customers, and billing from a single cockpit.
            </div>
          </div>
          <div className="topbar-actions">
            <Link href="/login" className="btn ghost">
              Switch user
            </Link>
            <Link href="/reports" className="btn primary">
              Live reports
            </Link>
            <button className="btn ghost" onClick={clearAuth}>
              Logout
            </button>
          </div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}

