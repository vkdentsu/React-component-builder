import {
  clearAuthSession,
  getAuthToken,
  hasUnexpiredAuthToken,
} from "./auth";

const backendUrl = import.meta.env.DEV
  ? ""
  : (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.Vite_BACKEND_URL ||
      ""
    ).replace(/\/+$/, "");

export function getApiUrl(path) {
  return `${backendUrl}/${path.replace(/^\/+/, '')}`;
}

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [250, 500, 1000];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachSafeJsonParser(response) {
  const originalText = response.text.bind(response);

  response.json = async () => {
    const rawText = await originalText();
    const trimmed = rawText ? rawText.trim() : "";

    if (!trimmed) {
      if (response.ok) {
        return {};
      }
      return {
        error: {
          code: "EMPTY_RESPONSE",
          message: `The server returned an empty response (HTTP ${response.status}). Please try again.`,
        },
      };
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      if (!response.ok) {
        return {
          error: {
            code: "INVALID_JSON_RESPONSE",
            message: `The server returned an unexpected response (HTTP ${response.status}). Please try again.`,
          },
        };
      }
      throw new Error("The server returned an invalid JSON response.");
    }
  };

  return response;
}

export async function parseJsonResponse(response, fallbackMessage = "Request failed.") {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || fallbackMessage);
  }
  if (!data || typeof data !== "object") {
    throw new Error(fallbackMessage);
  }
  return data;
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

  const url = getApiUrl(path);
  let lastError = null;
  let response = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      response = await fetch(url, { ...options, headers });
      if (!TRANSIENT_STATUS_CODES.has(response.status) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
    } catch (err) {
      lastError = err;
      if (attempt === RETRY_DELAYS_MS.length) {
        throw err;
      }
    }
    await wait(RETRY_DELAYS_MS[attempt]);
  }

  if (!response && lastError) {
    throw lastError;
  }

  if (response.status === 401) {
    clearAuthSession();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  return attachSafeJsonParser(response);
}
