"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

type OrderItem = {
  product_id: number;
  quantity: number;
};

type Order = {
  id: number;
  status: string;
  total_amount: number | string;
  customer?: { id: number; name: string } | null;
  items?: Array<{ product_id: number; quantity: number }>;
};

export default function OrdersPage() {
  const settings = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ product_id: 0, quantity: 1 }]);
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!settings.token) return;
    setError(null);
    try {
      const payload = await apiRequest<unknown>(settings, "/api/orders");
      const list = Array.isArray(payload.data)
        ? (payload.data as Order[])
        : ((payload.data as { data?: Order[] } | null)?.data ?? []);
      setOrders(list);
      setMessage("Orders loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to load orders.");
    }
  };

  useEffect(() => {
    loadOrders();
  }, [settings.token]);

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: 0, quantity: 1 }]);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      await apiRequest(settings, "/api/orders", {
        method: "POST",
        body: {
          customer_id: customerId ? Number(customerId) : null,
          items: items.filter((item) => item.product_id && item.quantity),
        },
      });
      setMessage("Order created.");
      loadOrders();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to create order.");
    }
  };

  const handleFetch = async () => {
    if (!orderId) return;
    setError(null);
    try {
      const payload = await apiRequest<Order>(settings, `/api/orders/${orderId}`);
      setOrders((prev) => [payload.data, ...prev.filter((order) => order.id !== payload.data.id)]);
      setMessage("Order retrieved.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to fetch order.");
    }
  };

  const handleCancel = async () => {
    if (!orderId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/orders/${orderId}/cancel`, { method: "POST" });
      setMessage("Order cancelled.");
      loadOrders();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to cancel order.");
    }
  };

  const handlePay = async () => {
    if (!orderId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/orders/${orderId}/pay`, { method: "POST" });
      setMessage("Order marked as paid.");
      loadOrders();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to pay order.");
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Orders</div>
        <div className="card-subtitle">Create, pay, and cancel orders with inventory protection.</div>
        <div className="form">
          <div className="form-row inline">
            <input
              className="input"
              placeholder="Customer ID (optional)"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            />
            <button className="btn secondary" onClick={addItem}>
              Add item
            </button>
          </div>
          {items.map((item, index) => (
            <div key={`${index}`} className="form-row inline">
              <input
                className="input"
                placeholder="Product ID"
                value={item.product_id || ""}
                onChange={(event) => updateItem(index, { product_id: Number(event.target.value) })}
              />
              <input
                className="input"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
              />
            </div>
          ))}
          <button className="btn primary" onClick={handleCreate}>
            Create order
          </button>
        </div>

        <div className="form" style={{ marginTop: "20px" }}>
          <div className="form-row inline">
            <input
              className="input"
              placeholder="Order ID"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            />
            <button className="btn ghost" onClick={handleFetch}>
              Fetch
            </button>
            <button className="btn secondary" onClick={handlePay}>
              Pay
            </button>
            <button className="btn danger" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
        {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
        {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Recent orders</div>
        <div className="card-subtitle">Latest orders from the tenant scope.</div>
        <button className="btn ghost" onClick={loadOrders}>
          Refresh list
        </button>
        <table className="table" style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Customer</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.status}</td>
                <td>{order.total_amount}</td>
                <td>{order.customer?.name || "Walk-in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
