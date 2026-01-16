"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

type CustomersMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export default function CustomersPage() {
  const settings = useSettings();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleUnauthenticated = (payload: { message?: string }) => {
    if (payload?.message === "Unauthenticated.") {
      settings.clearAuth();
      setError("Session expired. Please sign in again.");
      router.push("/login");
      return true;
    }
    return false;
  };

  const loadCustomers = async (targetPage = page) => {
    if (!settings.token) return;
    setError(null);
    try {
      const payload = await apiRequest<unknown>(settings, `/api/customers?page=${targetPage}&per_page=10`);
      const list = Array.isArray(payload.data)
        ? (payload.data as Customer[])
        : ((payload.data as { data?: Customer[] } | null)?.data ?? []);
      setCustomers(list);
      const meta = (payload.meta as CustomersMeta | null) ?? {};
      setPage(meta.current_page ?? targetPage);
      setLastPage(meta.last_page ?? 1);
      setTotal(meta.total ?? list.length);
      setMessage("Customers loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      if (!handleUnauthenticated(payload)) {
        setError(payload?.message || "Failed to load customers.");
      }
    }
  };

  useEffect(() => {
    if (settings.ready && !settings.token) {
      router.push("/login");
      return;
    }
    loadCustomers();
  }, [settings.token]);

  if (settings.ready && !settings.token) {
    return (
      <div className="card">
        <div className="card-title">Customers</div>
        <div className="card-subtitle">Sign in to view customer data.</div>
        <div className="notice">Redirecting to login...</div>
      </div>
    );
  }

  const handleCreate = async () => {
    setError(null);
    try {
      await apiRequest(settings, "/api/customers", {
        method: "POST",
        body: form,
      });
      setMessage("Customer created.");
      loadCustomers();
    } catch (err) {
      const payload = err as { message?: string };
      if (!handleUnauthenticated(payload)) {
        setError(payload?.message || "Failed to create customer.");
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/customers/${selectedId}`, {
        method: "PUT",
        body: form,
      });
      setMessage("Customer updated.");
      loadCustomers();
    } catch (err) {
      const payload = err as { message?: string };
      if (!handleUnauthenticated(payload)) {
        setError(payload?.message || "Failed to update customer.");
      }
    }
  };

  const handleFetch = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      const payload = await apiRequest<Customer>(settings, `/api/customers/${selectedId}`);
      const customer = payload.data;
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
      setMessage("Customer loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      if (!handleUnauthenticated(payload)) {
        setError(payload?.message || "Failed to fetch customer.");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await apiRequest(settings, `/api/customers/${selectedId}`, { method: "DELETE" });
      setMessage("Customer deleted.");
      loadCustomers();
    } catch (err) {
      const payload = err as { message?: string };
      if (!handleUnauthenticated(payload)) {
        setError(payload?.message || "Failed to delete customer.");
      }
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Customer directory</div>
        <div className="card-subtitle">Refresh to sync the latest customers.</div>
        <button className="btn ghost" onClick={loadCustomers}>
          Refresh list
        </button>
        <table className="table" style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="btn ghost" disabled={page <= 1} onClick={() => loadCustomers(page - 1)}>
            Previous
          </button>
          <div className="pagination-meta">
            Page {page} of {lastPage} • {total} total
          </div>
          <button className="btn ghost" disabled={page >= lastPage} onClick={() => loadCustomers(page + 1)}>
            Next
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Customers</div>
        <div className="card-subtitle">Unified customer profiles with contact data.</div>
        <div className="form-row">
          <button className={`btn ${showForm ? "ghost" : "primary"}`} onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? "Hide form" : "Create customer"}
          </button>
        </div>
        {showForm && (
          <div className="form" style={{ marginTop: "12px" }}>
            <div className="form-row">
              <input
                className="input"
                placeholder="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <input
                className="input"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="form-row inline">
              <input
                className="input"
                placeholder="Customer ID for update/delete"
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
        )}
        {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
        {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}
      </div>
    </div>
  );
}
