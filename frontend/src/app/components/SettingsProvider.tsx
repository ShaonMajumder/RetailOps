"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
};

type SettingsState = {
  baseUrl: string;
  token: string;
  tenantId: string;
  tenantName: string;
  user: UserProfile | null;
  ready: boolean;
};

type SettingsContextValue = SettingsState & {
  update: (next: Partial<Omit<SettingsState, "ready">>) => void;
  clearAuth: () => void;
};

const defaultState: SettingsState = {
  baseUrl: "http://localhost:8080",
  token: "",
  tenantId: "1",
  tenantName: "",
  user: null,
  ready: false,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const STORAGE_KEY = "retailops_settings_v1";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(defaultState);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        setState({
          baseUrl: parsed.baseUrl || defaultState.baseUrl,
          token: parsed.token || "",
          tenantId: parsed.tenantId || defaultState.tenantId,
          tenantName: parsed.tenantName || "",
          user: parsed.user || null,
          ready: true,
        });
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setState((prev) => ({ ...prev, ready: true }));
  }, []);

  const persist = useCallback((next: SettingsState) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        baseUrl: next.baseUrl,
        token: next.token,
        tenantId: next.tenantId,
        tenantName: next.tenantName,
        user: next.user,
      })
    );
  }, []);

  const update = useCallback(
    (next: Partial<Omit<SettingsState, "ready">>) => {
      setState((prev) => {
        const merged = { ...prev, ...next };
        persist(merged);
        return merged;
      });
    },
    [persist]
  );

  const clearAuth = useCallback(() => {
    setState((prev) => {
      const merged = { ...prev, token: "", user: null };
      persist(merged);
      return merged;
    });
  }, [persist]);

  const value = useMemo(
    () => ({
      ...state,
      update,
      clearAuth,
    }),
    [state, update, clearAuth]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
