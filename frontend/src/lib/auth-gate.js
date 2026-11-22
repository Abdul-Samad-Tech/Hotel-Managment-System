/**
 * Public site is viewable without login.
 * Any booking / account action must sign in first.
 */
export function requireSignedIn(user, navigate, { returnTo, message } = {}) {
  if (user) return true;
  if (returnTo) {
    try {
      sessionStorage.setItem("azure-bay-return", returnTo);
    } catch {
      /* ignore */
    }
  }
  const note = message || "Sign in to continue with your stay.";
  try {
    sessionStorage.setItem("azure-bay-auth-note", note);
  } catch {
    /* ignore */
  }
  navigate("/login");
  return false;
}

export function takeAuthNote() {
  try {
    const note = sessionStorage.getItem("azure-bay-auth-note");
    if (note) sessionStorage.removeItem("azure-bay-auth-note");
    return note || "";
  } catch {
    return "";
  }
}

export function takeReturnPath(fallback = "/") {
  try {
    const path = sessionStorage.getItem("azure-bay-return");
    if (path) sessionStorage.removeItem("azure-bay-return");
    return path || fallback;
  } catch {
    return fallback;
  }
}
