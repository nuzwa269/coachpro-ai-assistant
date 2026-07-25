import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  credits: number;
  plan: "free" | "basic" | "pro";
  plan_renews_at: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Idle auto sign-out after 30 minutes of inactivity
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

  const loadProfileAndRole = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,name,avatar_url,credits,plan,plan_renews_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    setIsAdmin(Array.isArray(roles) && roles.some((r: { role: string }) => r.role === "admin"));
  }, []);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => {
          loadProfileAndRole(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
      if (existing?.user) {
        loadProfileAndRole(existing.user.id);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfileAndRole]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfileAndRole(user.id);
  }, [user, loadProfileAndRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
        try {
          const { toast } = await import("@/hooks/use-toast");
          toast({
            title: "Signed out",
            description: "You were signed out after 30 minutes of inactivity.",
          });
        } catch {}
      }, IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
