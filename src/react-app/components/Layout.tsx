import { Outlet } from "react-router";
import BottomNavigation from "./BottomNavigation";
import TopBar from "./TopBar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white">
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pb-20">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
