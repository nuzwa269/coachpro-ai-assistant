import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Defence-in-depth: when admin is required, re-verify server-side via RPC
  // so a tampered client-side `isAdmin` flag cannot reveal the admin UI shell.
  const [serverAdminCheck, setServerAdminCheck] = useState<
    "idle" | "checking" | "allowed" | "denied"
  >("idle");

  useEffect(() => {
    if (!requireAdmin || !user) {
      setServerAdminCheck("idle");
      return;
    }
    let cancelled = false;
    setServerAdminCheck("checking");
    (async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (cancelled) return;
      setServerAdminCheck(!error && data === true ? "allowed" : "denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [requireAdmin, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin) {
    // Fail-closed: even if the cached client `isAdmin` says yes,
    // wait for the server RPC and only render on confirmed allow.
    if (!isAdmin || serverAdminCheck === "denied") {
      return <Navigate to="/dashboard" replace />;
    }
    if (serverAdminCheck !== "allowed") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
