"use client";

import { useState } from "react";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

type DailySalesRow = {
  date: string;
  total_sales: number | string;
  orders: number;
};

type TopProductRow = {
  product_id: number;
  name: string | null;
  sku: string | null;
  total_quantity: number;
  total_revenue: number | string;
};

type LowStockRow = {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

export default function ReportsPage() {
  const settings = useSettings();
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-01-31");
  const [dailySales, setDailySales] = useState<DailySalesRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [snapshotKey, setSnapshotKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizeArray = <T,>(value: T[] | { data?: T[] } | null | undefined) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && Array.isArray(value.data)) {
      return value.data;
    }
    return [];
  };

  const runDailySales = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to load reports.");
      }
      const payload = await apiRequest<DailySalesRow[] | { data?: DailySalesRow[] }>(
        settings,
        `/api/reports/daily-sales?from=${from}&to=${to}`
      );
      setDailySales(normalizeArray(payload.data));
      setMessage("Daily sales loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to load daily sales.");
    }
  };

  const runTopProducts = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to load reports.");
      }
      const payload = await apiRequest<TopProductRow[] | { data?: TopProductRow[] }>(
        settings,
        `/api/reports/top-products?from=${from}&to=${to}`
      );
      setTopProducts(normalizeArray(payload.data));
      setMessage("Top products loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to load top products.");
    }
  };

  const runLowStock = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to load reports.");
      }
      const payload = await apiRequest<LowStockRow[] | { data?: LowStockRow[] }>(
        settings,
        "/api/reports/low-stock"
      );
      setLowStock(normalizeArray(payload.data));
      setMessage("Low stock report loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to load low stock.");
    }
  };

  const queueSnapshot = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to queue snapshot.");
      }
      const payload = await apiRequest<{ cache_key: string }>(
        settings,
        `/api/reports/daily-sales/snapshot?from=${from}&to=${to}`,
        { method: "POST" }
      );
      setSnapshotKey(payload.data.cache_key);
      setMessage("Snapshot queued.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to queue snapshot.");
    }
  };

  const fetchSnapshot = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to fetch snapshot.");
      }
      const payload = await apiRequest<DailySalesRow[] | { data?: DailySalesRow[] }>(
        settings,
        `/api/reports/daily-sales/snapshot?from=${from}&to=${to}`
      );
      setDailySales(normalizeArray(payload.data));
      setMessage("Snapshot retrieved.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Snapshot not ready.");
    }
  };

  return (
    <div className="card">
      <div className="card-title">Reporting suite</div>
      <div className="card-subtitle">Daily sales, top products, low stock, and snapshot cache.</div>
      <div className="form">
        <div className="form-row inline">
          <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <button className="btn primary" onClick={runDailySales}>
            Daily sales
          </button>
          <button className="btn secondary" onClick={runTopProducts}>
            Top products
          </button>
          <button className="btn ghost" onClick={runLowStock}>
            Low stock
          </button>
        </div>
        <div className="form-row inline">
          <button className="btn primary" onClick={queueSnapshot}>
            Queue snapshot
          </button>
          <button className="btn secondary" onClick={fetchSnapshot}>
            Fetch snapshot
          </button>
          <input className="input" placeholder="Cache key" value={snapshotKey} onChange={(event) => setSnapshotKey(event.target.value)} />
        </div>
      </div>
      {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
      {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}

      <div className="grid-2" style={{ marginTop: "24px" }}>
        <div className="card">
          <div className="card-title">Daily sales</div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.total_sales}</td>
                  <td>{row.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Top products</div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row) => (
                <tr key={row.product_id}>
                  <td>{row.name || row.product_id}</td>
                  <td>{row.sku}</td>
                  <td>{row.total_quantity}</td>
                  <td>{row.total_revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-title">Low stock alerts</div>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Threshold</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.sku}</td>
                <td>{row.stock_quantity}</td>
                <td>{row.low_stock_threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
