import {
  clearAuthSession,
  getAuthToken,
  hasUnexpiredAuthToken,
} from "./auth";

const backendUrl = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.Vite_BACKEND_URL ||
  ""
).replace(/\/+$/, "");

export function getApiUrl(path) {
  return `${backendUrl}/${path.replace(/^\/+/, '')}`;
}

export async function authenticatedFetch(path, options = {}) {
  const token = getAuthToken();
  if (!token || !hasUnexpiredAuthToken()) {
    clearAuthSession();
    window.dispatchEvent(new Event("auth:unauthorized"));
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(getApiUrl(path), { ...options, headers });
  if (response.status === 401) {
    clearAuthSession();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }
  return response;
}
