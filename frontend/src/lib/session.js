const ACCESS_KEY = "azure-bay-access";
const REFRESH_KEY = "azure-bay-refresh";

/** Tab-scoped auth tokens (sessionStorage). Different tabs can hold different roles. */

export function getAccessToken() {
  try {
    return sessionStorage.getItem(ACCESS_KEY) || "";
  } catch {
    return "";
  }
}

export function getRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_KEY) || "";
  } catch {
    return "";
  }
}

export function setSessionTokens({ accessToken, refreshToken } = {}) {
  try {
    if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    /* private mode / blocked storage */
  }
}

export function clearSessionTokens() {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
