"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number | string;
  stock_quantity: number;
  low_stock_threshold: number;
};

export default function ProductsPage() {
  const settings = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "0",
    stock_quantity: "0",
    low_stock_threshold: "0",
  });
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    if (!settings.token) return;
    setError(null);
    try {
      const payload = await apiRequest<unknown>(settings, "/api/products");
      const list = Array.isArray(payload.data)
        ? (payload.data as Product[])
        : ((payload.data as { data?: Product[] } | null)?.data ?? []);
      setProducts(list);
      setMessage("Products loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to load products.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, [settings.token]);

  const handleCreate = async () => {
    setError(null);
    try {
      await apiRequest(settings, "/api/products", {
        method: "POST",
        body: {
          name: form.name,
          sku: form.sku,
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity),
          low_stock_threshold: Number(form.low_stock_threshold),
        },
      });
      setMessage("Product created.");
      loadProducts();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to create product.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/products/${selectedId}`, {
        method: "PUT",
        body: {
          name: form.name,
          sku: form.sku,
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity),
          low_stock_threshold: Number(form.low_stock_threshold),
        },
      });
      setMessage("Product updated.");
      loadProducts();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to update product.");
    }
  };

  const handleFetch = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      const payload = await apiRequest<Product>(settings, `/api/products/${selectedId}`);
      const product = payload.data;
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        price: String(product.price ?? ""),
        stock_quantity: String(product.stock_quantity ?? ""),
        low_stock_threshold: String(product.low_stock_threshold ?? ""),
      });
      setMessage("Product loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to fetch product.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/products/${selectedId}`, { method: "DELETE" });
      setMessage("Product deleted.");
      loadProducts();
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to delete product.");
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Products</div>
        <div className="card-subtitle">Inventory catalog with SKU-level tracking.</div>
        <div className="form">
          <div className="form-row inline">
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <input
              className="input"
              placeholder="SKU"
              value={form.sku}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
            />
          </div>
          <div className="form-row inline">
            <input
              className="input"
              placeholder="Price"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
            <input
              className="input"
              placeholder="Stock"
              value={form.stock_quantity}
              onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })}
            />
            <input
              className="input"
              placeholder="Low stock threshold"
              value={form.low_stock_threshold}
              onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })}
            />
          </div>
          <div className="form-row inline">
            <input
              className="input"
              placeholder="Product ID for update/delete"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            />
            <button className="btn ghost" onClick={handleFetch}>
              Fetch
            </button>
            <button className="btn primary" onClick={handleCreate}>
              Create
            </button>
            <button className="btn secondary" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
        {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
        {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Current catalog</div>
        <div className="card-subtitle">Use the refresh button to sync.</div>
        <button className="btn ghost" onClick={loadProducts}>
          Refresh list
        </button>
        <table className="table" style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.stock_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
