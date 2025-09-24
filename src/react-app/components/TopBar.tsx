import { useState } from "react";
import { Menu } from "lucide-react";
import SidePanel from "./SidePanel";

export default function TopBar() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-emerald-800/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPanelOpen(true)}
              className="p-2 rounded-lg hover:bg-emerald-800/20 transition-colors"
            >
              <Menu className="w-6 h-6 text-emerald-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-100 bg-clip-text text-transparent">
                মসজিদ কমিউনিটি
              </h1>
              <p className="text-xs text-emerald-200/70">Masjid Community</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-emerald-200/80">
              {new Date().toLocaleDateString('bn-BD', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      <SidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
