import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearSessionTokens, getAccessToken, getRefreshToken, setSessionTokens } from "../lib/session";

const AuthContext = createContext(null);

function rememberTokens(data) {
  if (data?.accessToken || data?.refreshToken) {
    setSessionTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        if (getAccessToken()) {
          const data = await api("/auth/me");
          if (active) setUser(data.user);
          return;
        }
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          if (active) setUser(null);
          return;
        }
        const data = await api("/auth/refresh", { method: "POST", body: { refreshToken } });
        rememberTokens(data);
        if (active) setUser(data.user);
      } catch {
        clearSessionTokens();
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    rememberTokens(data);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await api("/auth/register", { method: "POST", body: payload });
    rememberTokens(data);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      await api("/auth/logout", { method: "POST", body: refreshToken ? { refreshToken } : {} });
    } catch {
      /* still clear local tab session */
    }
    clearSessionTokens();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
