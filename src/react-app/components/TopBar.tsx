import { useState } from "react";
import { Menu, FileText } from "lucide-react";
import { Link } from "react-router";
import SidePanel from "./SidePanel";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";

export default function TopBar() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { user } = useFirebaseAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-emerald-800/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-100 bg-clip-text text-transparent">
              সিরাতুল সাবিকুন
            </h1>
            <p className="text-xs text-emerald-200/70">Siratul Sabiqun</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {!user && (
              <Link
                to="/application"
                className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>সদস্য হওয়ার আবেদন</span>
              </Link>
            )}
            <button
              onClick={() => setIsPanelOpen(true)}
              className="p-2 rounded-lg hover:bg-emerald-800/20 transition-colors"
            >
              <Menu className="w-6 h-6 text-emerald-300" />
            </button>
          </div>
        </div>
      </header>

      <SidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
