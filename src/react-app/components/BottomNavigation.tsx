import { Home, Users, Activity, User } from "lucide-react";
import { useLocation, Link } from "react-router";

export default function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "হোম", label_en: "Home", path: "/" },
    { icon: Users, label: "নামাজ", label_en: "Prayer", path: "/prayer" },
    { icon: Activity, label: "কার্যক্রম", label_en: "Activities", path: "/activities" },
    { icon: User, label: "প্রোফাইল", label_en: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-emerald-800/30 px-4 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-emerald-800/40 text-emerald-300 shadow-lg shadow-emerald-800/20" 
                  : "text-emerald-200/70 hover:text-emerald-300 hover:bg-emerald-800/20"
              }`}
            >
              <item.icon className={`w-6 h-6 mb-1 ${isActive ? "scale-110" : ""}`} />
              <div className="text-center">
                <div className={`text-xs font-medium ${isActive ? "text-emerald-200" : ""}`}>
                  {item.label}
                </div>
                <div className="text-[10px] opacity-70">{item.label_en}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
