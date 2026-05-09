const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Maintenance
export const maintenance = {
  list: () => request<import("@/types").Maintenance[]>("/api/maintenance"),
  get: (id: number) => request<import("@/types").Maintenance>(`/api/maintenance/${id}`),
  create: (data: object) =>
    request<import("@/types").Maintenance>("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: object) =>
    request<import("@/types").Maintenance>(`/api/maintenance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/api/maintenance/${id}`, { method: "DELETE" }),
};

// Assets
export const assets = {
  list: () => request<import("@/types").Asset[]>("/api/assets"),
  get: (id: number) => request<import("@/types").Asset>(`/api/assets/${id}`),
  create: (form: FormData) =>
    request<import("@/types").Asset>("/api/assets", { method: "POST", body: form }),
  update: (id: number, form: FormData | object) => {
    if (form instanceof FormData) {
      return request<import("@/types").Asset>(`/api/assets/${id}`, { method: "PUT", body: form });
    }
    return request<import("@/types").Asset>(`/api/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  },
  delete: (id: number) => request<void>(`/api/assets/${id}`, { method: "DELETE" }),
};

// Expenses
export const expenses = {
  list: (params?: { month?: string; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.month) qs.set("month", params.month);
    if (params?.type) qs.set("type", params.type);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<import("@/types").Expense[]>(`/api/expenses${suffix}`);
  },
  trends: () => request<import("@/types").MonthlyTrend[]>("/api/expenses/trends"),
  create: (data: object) =>
    request<import("@/types").Expense>("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: object) =>
    request<import("@/types").Expense>(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/api/expenses/${id}`, { method: "DELETE" }),
};

// Documents
export const documents = {
  list: () => request<import("@/types").Document[]>("/api/documents"),
  get: (id: number) => request<import("@/types").Document>(`/api/documents/${id}`),
  create: (form: FormData) =>
    request<import("@/types").Document>("/api/documents", { method: "POST", body: form }),
  update: (id: number, form: FormData | object) => {
    if (form instanceof FormData) {
      return request<import("@/types").Document>(`/api/documents/${id}`, {
        method: "PUT",
        body: form,
      });
    }
    return request<import("@/types").Document>(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  },
  delete: (id: number) => request<void>(`/api/documents/${id}`, { method: "DELETE" }),
};

// Search
export const search = (q: string) =>
  request<import("@/types").SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`);

// Dashboard
export const dashboard = () =>
  request<import("@/types").DashboardData>("/api/dashboard");
