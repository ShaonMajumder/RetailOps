"use client";

import { useSettings } from "../components/SettingsProvider";

export default function ProfilePage() {
  const { user, tenantId, tenantName } = useSettings();

  if (!user) {
    return (
      <div className="card">
        <div className="card-title">Profile</div>
        <div className="card-subtitle">No user is logged in yet.</div>
        <div className="notice">Sign in to view your profile details.</div>
      </div>
    );
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Profile</div>
        <div className="card-subtitle">Account details for the active session.</div>
        <div className="grid-2">
          <div className="metric-card">
            <div className="metric-label">Full name</div>
            <div className="metric-value">{user.name}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Role</div>
            <div className="metric-value">{user.role}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Email</div>
            <div className="metric-value wrap">{user.email}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">User ID</div>
            <div className="metric-value">{user.id}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Tenant</div>
        <div className="card-subtitle">Workspace and tenant assignment.</div>
        <div className="grid-2">
          <div className="metric-card">
            <div className="metric-label">Tenant name</div>
            <div className="metric-value">{tenantName || "Not set"}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Tenant ID</div>
            <div className="metric-value">{tenantId}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
