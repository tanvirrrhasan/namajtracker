import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/react-app/lib/supabaseClient";

type SupabaseAuthContextValue = {
  user: {
    id: string;
    email: string | null;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthContextValue["user"]>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email,
              name: (u.user_metadata as any)?.full_name ?? (u.user_metadata as any)?.name ?? null,
              avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
            }
          : null
      );
      setInitialized(true);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email,
              name: (u.user_metadata as any)?.full_name ?? (u.user_metadata as any)?.name ?? null,
              avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
            }
          : null
      );
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({ user, signInWithGoogle, signOut }), [user]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 inline-block w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent"></div>
          <div className="text-sm opacity-80">Loading…</div>
        </div>
      </div>
    );
  }
  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  return ctx;
}


