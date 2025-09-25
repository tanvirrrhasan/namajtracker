import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { auth, googleProvider } from "@/react-app/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

type FirebaseUserLite = {
  id: string;
  email: string | null;
  name?: string | null;
  avatar_url?: string | null;
} | null;

type Ctx = {
  user: FirebaseUserLite;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpIfInvited: (email: string, password: string) => Promise<void>;
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
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if this Google user is an approved member
      const membersCol = collection(db, "members");
      const snap = await getDocs(query(membersCol, where("email", "==", user.email), where("is_active", "==", true)));
      
      if (snap.empty) {
        // User is not an approved member - sign them out and show error
        await fbSignOut(auth);
        throw new Error("এই ইমেইলটি অনুমোদিত সদস্য তালিকায় নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।");
      }
      
      const memberDoc = snap.docs[0];
      // const memberData = memberDoc.data() as any;
      
      // Always update member record with current Firebase UID (handles both new and existing logins)
      await updateDoc(doc(db, "members", memberDoc.id), { 
        user_id: user.uid,
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.message.includes("অনুমোদিত সদস্য")) {
        alert(error.message);
      }
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    // Allow only if member exists and active; if not active/not found → error
    const membersCol = collection(db, "members");
    const snap = await getDocs(query(membersCol, where("email", "==", email), where("is_active", "==", true)));
    if (snap.empty) throw new Error("এই ইমেইলটি অনুমোদিত সদস্য তালিকায় নেই");

    const memberDoc = snap.docs[0];
    const memberData = memberDoc.data() as any;

    try {
      // Try normal login first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Always update member record with current Firebase UID (handles both new and existing logins)
      await updateDoc(doc(db, "members", memberDoc.id), { 
        user_id: user.uid,
        updated_at: new Date().toISOString()
      });
      return;
    } catch (e: any) {
      const code = e?.code || '';
      // If user doesn't exist in Firebase yet, but member exists and temp_password matches → auto signup then login
      if (code === 'auth/user-not-found') {
        const tempPassword = memberData?.temp_password;
        if (!tempPassword) {
          throw new Error("এই ইমেইল দিয়ে কোন অ্যাকাউন্ট নেই। আগে অ্যাডমিনের সাথে যোগাযোগ করুন।");
        }
        if (String(tempPassword) !== String(password)) {
          throw new Error("পাসওয়ার্ড সঠিক নয়। প্রথমবার লগইন করতে আমন্ত্রণের পাসওয়ার্ড ব্যবহার করুন।");
        }
        // Create Firebase account using the provided password (must match temp_password)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update member record with Firebase UID and clear temp_password
        await updateDoc(doc(db, "members", memberDoc.id), { 
          user_id: user.uid,
          temp_password: null,
          updated_at: new Date().toISOString()
        });
        return;
      }
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        throw new Error("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
      }
      if (code === 'auth/too-many-requests') {
        throw new Error("অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন।");
      }
      throw e;
    }
  };

  const signUpIfInvited = async (email: string, password: string) => {
    // Kept for backward-compat; same logic as auto in signInWithEmailPassword
    const membersCol = collection(db, "members");
    const snap = await getDocs(query(membersCol, where("email", "==", email), where("is_active", "==", true)));
    if (snap.empty) throw new Error("এই ইমেইলটি অনুমোদিত সদস্য তালিকায় নেই");
    const memberDoc = snap.docs[0];
    const data = memberDoc.data() as any;
    if (!data?.temp_password) throw new Error("এই ইমেইলের জন্য অ্যাকাউন্ট তৈরি করার অনুমতি নেই");
    if (String(data.temp_password) !== String(password)) throw new Error("পাসওয়ার্ড মিলছে না");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      if (e?.code === 'auth/operation-not-allowed') {
        throw new Error('ইমেইল/পাসওয়ার্ড সাইন-ইন সক্রিয় করা নেই। অ্যাডমিন কনসোল থেকে Enable করতে হবে।');
      }
      throw e;
    }
    await updateDoc(doc(db, "members", memberDoc.id), { temp_password: null });
  };

  const value = useMemo(() => ({ user, signInWithGoogle, signInWithEmailPassword, signUpIfInvited, signOut }), [user]);

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


