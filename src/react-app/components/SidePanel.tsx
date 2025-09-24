import { X, Calendar, Users, ImageIcon, Settings, Info, Heart, Shield } from "lucide-react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { user, signOut } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Temporary solution: Check if user email is admin email
    if (user.email === 'vaitanvir833@gmail.com') {
      setIsAdmin(true);
      return;
    }

    try {
      const response = await fetch("/api/members/profile");
      
      if (!response.ok) {
        console.log("User not authenticated or profile not found");
        setIsAdmin(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: Calendar, label: "ইভেন্ট", label_en: "Events", href: "#" },
      { icon: Users, label: "সদস্য", label_en: "Members", href: "#" },
      { icon: ImageIcon, label: "গ্যালারি", label_en: "Gallery", href: "/gallery" },
      { icon: Heart, label: "দান ও চাঁদা", label_en: "Donations & Funds", href: "#" },
      { icon: Settings, label: "সেটিংস", label_en: "Settings", href: "#" },
      { icon: Info, label: "সম্পর্কে", label_en: "About", href: "#" },
    ];

    // Add admin panel button if user is admin
    if (isAdmin) {
      baseItems.unshift({ icon: Shield, label: "অ্যাডমিন প্যানেল", label_en: "Admin Panel", href: "/admin" });
    }

    return baseItems;
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-emerald-800/30 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-emerald-300">মেনু</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-emerald-800/20 transition-colors"
            >
              <X className="w-5 h-5 text-emerald-300" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-emerald-900/30 rounded-lg p-4 mb-6 border border-emerald-800/30">
              <div className="flex items-center space-x-3">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-emerald-300"
                  />
                )}
                <div>
                  <p className="font-medium text-emerald-100">
                    {user.name || user.email}
                  </p>
                  <p className="text-sm text-emerald-200/70">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="space-y-2">
            {getMenuItems().map((item, index) => (
              <button
                key={index}
                onClick={() => item.href !== "#" ? handleNavigation(item.href) : null}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                  item.href === "#" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  item.label === "অ্যাডমিন প্যানেল" 
                    ? "hover:bg-yellow-800/20 border border-yellow-600/30" 
                    : "hover:bg-emerald-800/20"
                }`}
                disabled={item.href === "#"}
              >
                <item.icon className={`w-5 h-5 ${
                  item.label === "অ্যাডমিন প্যানেল" 
                    ? "text-yellow-300 group-hover:text-yellow-200" 
                    : "text-emerald-300 group-hover:text-emerald-200"
                }`} />
                <div>
                  <div className={`font-medium ${
                    item.label === "অ্যাডমিন প্যানেল" 
                      ? "text-yellow-100 group-hover:text-yellow-50" 
                      : "text-white group-hover:text-emerald-100"
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-xs ${
                    item.label === "অ্যাডমিন প্যানেল" 
                      ? "text-yellow-200/70" 
                      : "text-emerald-200/70"
                  }`}>
                    {item.label_en}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          {user && (
            <div className="mt-8 pt-6 border-t border-emerald-800/30">
              <button
                onClick={signOut}
                className="w-full px-4 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg transition-colors border border-red-800/30"
              >
                লগ আউট (Logout)
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
