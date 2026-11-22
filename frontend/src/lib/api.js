import { getAccessToken } from "./session";

function authHeaders(extra) {
  const headers = { ...(extra || {}) };
  const access = getAccessToken();
  if (access) headers.Authorization = `Bearer ${access}`;
  return headers;
}

export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: "include",
    headers: authHeaders(body ? { "Content-Type": "application/json" } : undefined),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export async function downloadCsv(path, filename) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Export failed.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
