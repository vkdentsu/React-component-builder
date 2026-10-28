export const AUTH_TOKEN_KEY = "authToken";

export function hasUnexpiredAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return false;

  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
