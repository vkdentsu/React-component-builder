export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthSession(session) {
  if (!session || typeof session.accessToken !== "string" || !session.accessToken) {
    throw new Error("The authentication response did not include an access token.");
  }

  localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
  if (session.user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function hasUnexpiredAuthToken() {
  const token = getAuthToken();
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return false;

  try {
    const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = base64Payload.padEnd(
      Math.ceil(base64Payload.length / 4) * 4,
      "=",
    );
    const payload = JSON.parse(
      atob(paddedPayload),
    );

    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
