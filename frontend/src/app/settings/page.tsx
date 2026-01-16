"use client";

import { useState } from "react";
import { useSettings } from "../components/SettingsProvider";

export default function SettingsPage() {
  const settings = useSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [tenantId, setTenantId] = useState(settings.tenantId);
  const [token, setToken] = useState(settings.token);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    settings.update({ baseUrl, tenantId, token });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="card">
      <div className="card-title">Settings</div>
      <div className="card-subtitle">Configure API base URL, tenant ID, and token.</div>
      {settings.user && (
        <div className="notice" style={{ marginBottom: "16px" }}>
          Logged in as {settings.user.name} ({settings.user.email})
        </div>
      )}
      <div className="form">
        <div className="form-row inline">
          <div className="form-row">
            <label className="metric-label">API Base URL</label>
            <input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </div>
          <div className="form-row">
            <label className="metric-label">Tenant ID</label>
            <input className="input" value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <label className="metric-label">Bearer Token</label>
          <input className="input" value={token} onChange={(event) => setToken(event.target.value)} />
        </div>
        <div className="form-row inline">
          <button className="btn primary" onClick={handleSave}>
            Save settings
          </button>
          {saved && <div className="notice">Saved.</div>}
        </div>
      </div>
    </div>
  );
}
