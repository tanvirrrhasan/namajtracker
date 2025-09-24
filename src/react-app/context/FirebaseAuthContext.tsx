import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { auth, googleProvider } from "@/react-app/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";

type FirebaseUserLite = {
  id: string;
  email: string | null;
  name?: string | null;
  avatar_url?: string | null;
} | null;

type Ctx = {
  user: FirebaseUserLite;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const C = createContext<Ctx | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUserLite>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(
        u
          ? {
              id: u.uid,
              email: u.email,
              name: u.displayName,
              avatar_url: u.photoURL,
            }
          : null
      );
      setInitialized(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
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
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useFirebaseAuth() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}


