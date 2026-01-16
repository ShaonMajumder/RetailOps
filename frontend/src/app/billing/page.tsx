"use client";

import { useState } from "react";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

export default function BillingPage() {
  const settings = useSettings();
  const [plan, setPlan] = useState("starter");
  const [paymentMethod, setPaymentMethod] = useState("pm_card_visa");
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to manage billing.");
      }
      const payload = await apiRequest<Record<string, unknown>>(settings, "/api/billing/subscribe", {
        method: "POST",
        body: {
          plan,
          payment_method: paymentMethod,
        },
      });
      setSubscription(payload.data);
      setMessage("Subscription created.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to create subscription.");
    }
  };

  const handleFetch = async () => {
    setError(null);
    try {
      if (!settings.token) {
        throw new Error("Login required to manage billing.");
      }
      const payload = await apiRequest<Record<string, unknown>>(settings, "/api/billing/subscription");
      setSubscription(payload.data);
      setMessage("Subscription loaded.");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Failed to fetch subscription.");
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Subscription</div>
        <div className="card-subtitle">Manage plan upgrades and billing state.</div>
        <div className="form">
          <div className="form-row inline">
            <input className="input" value={plan} onChange={(event) => setPlan(event.target.value)} />
            <input
              className="input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
          </div>
          <div className="form-row inline">
            <button className="btn primary" onClick={handleSubscribe}>
              Create subscription
            </button>
            <button className="btn secondary" onClick={handleFetch}>
              Refresh subscription
            </button>
          </div>
        </div>
        {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
        {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Current billing state</div>
        <div className="card-subtitle">Subscription and plan details from Cashier.</div>
        <pre
          style={{
            background: "rgba(9, 13, 20, 0.8)",
            borderRadius: "12px",
            padding: "12px",
            color: "var(--text)",
            border: "1px solid rgba(142, 162, 184, 0.2)",
            maxHeight: "380px",
            overflow: "auto",
            fontSize: "12px",
          }}
        >
          {subscription ? JSON.stringify(subscription, null, 2) : "No subscription loaded."}
        </pre>
      </div>
    </div>
  );
}
