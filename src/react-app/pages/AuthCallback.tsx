import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { getAuth, getRedirectResult } from "firebase/auth";
import { auth } from "@/react-app/lib/firebase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await getRedirectResult(getAuth() ?? auth);
      } catch (error) {
        console.error("Authentication failed:", error);
      } finally {
        navigate("/");
      }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-emerald-300 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">
          অথেনটিকেশন প্রক্রিয়াধীন...
        </h2>
        <p className="text-emerald-200/70">Authentication in progress...</p>
      </div>
    </div>
  );
}
