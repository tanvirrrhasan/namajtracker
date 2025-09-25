import { X, Calendar, Users, ImageIcon, Settings, Info, Heart, Shield, FileText } from "lucide-react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
      // Prefer Firestore client check (does not require worker cookie)
      const membersCol = collection(db, 'members');
      const snaps: any[] = [];
      const q1 = await getDocs(query(membersCol, where('user_id', '==', user.id)));
      snaps.push(...q1.docs);
      if (user.email) {
        const q2 = await getDocs(query(membersCol, where('email', '==', user.email)));
        snaps.push(...q2.docs);
      }
      const member = snaps[0]?.data() as any | undefined;
      setIsAdmin(Boolean(member?.is_admin));
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
      { icon: FileText, label: "সদস্য হওয়ার আবেদন", label_en: "Apply for Membership", href: "/application" },
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
      <div className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-gradient-to-b from-slate-800 to-slate-900 border-l border-emerald-800/30 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-end mb-6">
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

          </div>
          
          {/* Menu Items - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4">
            <nav className="space-y-2 pb-4">
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
          </div>

          {/* Logout Button - Fixed at bottom */}
          {user && (
            <div className="p-4 border-t border-emerald-800/30 flex-shrink-0">
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
