"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useSettings } from "../components/SettingsProvider";

export default function LoginPage() {
  const settings = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthHandledRef = useRef(false);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerForm, setRegisterForm] = useState({
    tenant_name: "",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    plan: "free",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleRegisterKey = "google_oauth_register";

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError && !oauthHandledRef.current) {
      setError(`Google login failed: ${oauthError.replace(/_/g, " ")}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || oauthHandledRef.current) {
      return;
    }

    const storedState =
      typeof window !== "undefined" ? window.sessionStorage.getItem("google_oauth_state") : null;

    if (!storedState || !state || storedState !== state) {
      setError("Google login state mismatch. Please try again.");
      return;
    }

    oauthHandledRef.current = true;
    window.sessionStorage.removeItem("google_oauth_state");

    const completeGoogleLogin = async () => {
      const registerPayload =
        typeof window !== "undefined" ? window.sessionStorage.getItem(googleRegisterKey) : null;
      const registerData = registerPayload ? JSON.parse(registerPayload) as { tenant_name?: string } : {};

      setMessage("Completing Google login...");
      setError(null);
      try {
        settings.update({ baseUrl });
        const redirectUri = `${window.location.origin}/login`;
        const payload = await apiRequest<{
          token: string;
          user: { tenant_id: number; name: string; email: string; role: string; id: number };
        }>(settings, "/api/auth/google", {
          method: "POST",
          body: { code, redirect_uri: redirectUri, tenant_name: registerData.tenant_name },
          includeAuth: false,
          includeTenant: false,
        });
        settings.update({
          token: payload.data.token,
          tenantId: String(payload.data.user.tenant_id || settings.tenantId),
          user: payload.data.user,
        });
        setMessage("Google login successful. Token saved.");
        router.replace("/products");
      } catch (err) {
        const payload = err as { message?: string };
        setError(payload?.message || "Google login failed.");
      } finally {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(googleRegisterKey);
        }
      }
    };

    void completeGoogleLogin();
  }, [searchParams, settings, baseUrl, router]);

  const handleRegister = async () => {
    setMessage(null);
    setError(null);
    try {
      settings.update({ baseUrl });
      const payload = await apiRequest<{
        token: string;
        user: { tenant_id: number; name: string; email: string; role: string; id: number };
        tenant: { name: string; id: number };
      }>(settings, "/api/auth/register", {
        method: "POST",
        body: registerForm,
        includeAuth: false,
        includeTenant: false,
      });
      settings.update({
        token: payload.data.token,
        tenantId: String(payload.data.user.tenant_id || settings.tenantId),
        tenantName: payload.data.tenant?.name || "",
        user: payload.data.user,
      });
      setMessage("Tenant registered and token stored.");
      router.replace("/products");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Registration failed.");
    }
  };

  const handleLogin = async () => {
    setMessage(null);
    setError(null);
    try {
      settings.update({ baseUrl });
      const payload = await apiRequest<{
        token: string;
        user: { tenant_id: number; name: string; email: string; role: string; id: number };
      }>(settings, "/api/auth/login", {
        method: "POST",
        body: loginForm,
        includeAuth: false,
        includeTenant: false,
      });
      settings.update({
        token: payload.data.token,
        tenantId: String(payload.data.user.tenant_id || settings.tenantId),
        user: payload.data.user,
      });
      setMessage("Login successful. Token saved.");
      router.replace("/products");
    } catch (err) {
      const payload = err as { message?: string };
      setError(payload?.message || "Login failed.");
    }
  };

  const handleGoogleLogin = () => {
    setMessage(null);
    setError(null);

    if (!googleClientId) {
      setError("Google client ID is not configured.");
      return;
    }

    settings.update({ baseUrl });

    const redirectUri = `${window.location.origin}/login`;
    const state =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}${Math.random().toString(16).slice(2)}`;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("google_oauth_state", state);
    }

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      include_granted_scopes: "true",
      prompt: "select_account",
      state,
    });

    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  const handleGoogleRegister = () => {
    setMessage(null);
    setError(null);

    if (!googleClientId) {
      setError("Google client ID is not configured.");
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(googleRegisterKey, JSON.stringify({ tenant_name: registerForm.tenant_name }));
    }

    handleGoogleLogin();
  };

  return (
    <div className="card" style={{ maxWidth: "520px", width: "100%" }}>
      <div className="card-title">RetailOps access</div>
      <div className="card-subtitle">Sign in to access your operations console.</div>
      <div className="form-row inline" style={{ marginBottom: "12px" }}>
        <button className={`btn ${mode === "login" ? "primary" : "ghost"}`} onClick={() => setMode("login")}>
          Login
        </button>
        <button className={`btn ${mode === "register" ? "primary" : "ghost"}`} onClick={() => setMode("register")}>
          Register
        </button>
      </div>
      <div className="form">
        <input
          className="input"
          placeholder="API Base URL"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
        />
        {mode === "register" ? (
          <>
            <input
              className="input"
              placeholder="Tenant name"
              value={registerForm.tenant_name}
              onChange={(event) => setRegisterForm({ ...registerForm, tenant_name: event.target.value })}
            />
            <input
              className="input"
              placeholder="Owner name"
              value={registerForm.name}
              onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
            />
            <input
              className="input"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
            />
            <div className="form-row inline">
              <input
                className="input"
                placeholder="Password"
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
              />
              <input
                className="input"
                placeholder="Confirm password"
                type="password"
                value={registerForm.password_confirmation}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, password_confirmation: event.target.value })
                }
              />
            </div>
            <input
              className="input"
              placeholder="Plan slug"
              value={registerForm.plan}
              onChange={(event) => setRegisterForm({ ...registerForm, plan: event.target.value })}
            />
            <div className="form-row">
              <button className="btn primary" onClick={handleRegister} style={{ width: "100%" }}>
                Create account
              </button>
            </div>
            <div className="form-row">
              <button className="btn ghost" onClick={handleGoogleRegister} style={{ width: "100%" }}>
                Register with Google
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              className="input"
              placeholder="Email"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            />
            <div className="form-row">
              <button className="btn primary" onClick={handleLogin} style={{ width: "100%" }}>
                Login
              </button>
            </div>
            <div className="form-row">
              <button className="btn ghost" onClick={handleGoogleLogin} style={{ width: "100%" }}>
                Login with Google
              </button>
            </div>
          </>
        )}
      </div>
      {message && <div className="notice" style={{ marginTop: "16px" }}>{message}</div>}
      {error && <div className="error" style={{ marginTop: "16px" }}>{error}</div>}
    </div>
  );
}
