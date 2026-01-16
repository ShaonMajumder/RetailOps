"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSettings } from "./SettingsProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, ready } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoutes = ["/", "/login"];

  useEffect(() => {
    if (!ready) return;
    if (!token && !publicRoutes.includes(pathname)) {
      router.replace("/login");
    }
    if (token && pathname === "/login") {
      router.replace("/products");
    }
  }, [ready, token, pathname, router]);

  if (!ready) {
    return <div className="auth-splash">Loading console...</div>;
  }

  if (!token && !publicRoutes.includes(pathname)) {
    return <div className="auth-splash">Redirecting to login...</div>;
  }

  if (token && pathname === "/login") {
    return <div className="auth-splash">Opening workspace...</div>;
  }

  return <>{children}</>;
}
