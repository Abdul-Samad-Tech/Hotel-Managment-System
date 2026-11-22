import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/roles";
import { PortalPage } from "./PortalPage";

export function RoleGate({ allow }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate("/login", { replace: true });
    else if (!allow.includes(user.role)) navigate(homeFor(user.role), { replace: true });
  }, [allow, navigate, ready, user]);

  if (!ready || !user || !allow.includes(user.role)) return null;
  return <PortalPage />;
}
