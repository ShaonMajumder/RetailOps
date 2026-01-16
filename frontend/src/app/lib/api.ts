"use client";

type ApiSettings = {
  baseUrl: string;
  token: string;
  tenantId: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
};

export async function apiRequest<T>(
  settings: ApiSettings,
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown> | null;
    includeTenant?: boolean;
    includeAuth?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const url = `${settings.baseUrl}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.includeAuth !== false && settings.token) {
    headers.Authorization = `Bearer ${settings.token}`;
  }

  if (options.includeTenant !== false && settings.tenantId) {
    headers["X-Tenant-ID"] = settings.tenantId;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok) {
    throw payload;
  }
  return payload;
}
