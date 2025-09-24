import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { User, Mail, Phone, MapPin, Calendar, Settings, LogOut, Shield } from "lucide-react";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";

interface MemberProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone?: string;
  address?: string;
  is_admin: boolean;
  is_active: boolean;
  joined_date?: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useFirebaseAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;
      
      const membersCol = collection(db, "members");
      const memberQuery = query(membersCol, where("user_id", "==", user.id));
      const snapshot = await getDocs(memberQuery);
      
      if (snapshot.empty) {
        // Create member profile if doesn't exist
        const newMemberData = {
          name: user.name || user.email || "নাম নেই",
          user_id: user.id,
          email: user.email,
          phone: '',
          address: '',
          is_admin: false,
          is_active: true,
          joined_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
        
        const docRef = await addDoc(membersCol, newMemberData);
        const newProfile = {
          id: docRef.id,
          ...newMemberData
        };
        
        setProfile(newProfile);
        setFormData({
          phone: newProfile.phone || '',
          address: newProfile.address || '',
        });
      } else {
        const memberDoc = snapshot.docs[0];
        const memberData = {
          id: memberDoc.id,
          ...memberDoc.data()
        } as MemberProfile;
        
        setProfile(memberData);
        setFormData({
          phone: memberData.phone || '',
          address: memberData.address || '',
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি লগ আউট করতে চান?')) {
      await signOut();
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <User className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">
          লগইন প্রয়োজন
        </h2>
        <p className="text-emerald-200/70">
          প্রোফাইল দেখতে লগইন করুন
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <div className="bg-slate-800/30 rounded-xl p-6 animate-pulse">
            <div className="w-20 h-20 bg-emerald-800/30 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-emerald-800/30 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-emerald-800/20 rounded w-1/3 mx-auto"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-emerald-800/20 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-emerald-800/30 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-800/40 to-emerald-700/40 rounded-2xl p-6 border border-emerald-700/30 text-center">
        <div className="relative inline-block mb-4">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-emerald-300 mx-auto"
            />
          ) : (
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          {profile?.is_admin && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-yellow-600 p-1 rounded-full border-2 border-slate-900">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-emerald-100 mb-1">
          {profile?.name || user?.name || 'নাম নেই'}
        </h1>
        
        <p className="text-emerald-200/70 mb-3">{user?.email}</p>
        
        {profile?.is_admin && (
          <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/30">
            <Shield className="w-4 h-4 mr-1" />
            অ্যাডমিন (Admin)
          </span>
        )}
      </div>

      {/* Profile Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-emerald-100">ব্যক্তিগত তথ্য</h2>
        
        <div className="space-y-3">
          {/* Email */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-sm text-emerald-200/70">ইমেইল</p>
                <p className="text-emerald-100 font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-emerald-300" />
              <div className="flex-1">
                <p className="text-sm text-emerald-200/70">ফোন নম্বর</p>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-700 text-emerald-100 px-3 py-2 rounded-lg border border-emerald-800/30 focus:border-emerald-600 focus:outline-none"
                    placeholder="ফোন নম্বর লিখুন"
                  />
                ) : (
                  <p className="text-emerald-100 font-medium">
                    {profile?.phone || 'ফোন নম্বর যোগ করুন'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-emerald-300" />
              <div className="flex-1">
                <p className="text-sm text-emerald-200/70">ঠিকানা</p>
                {editing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-slate-700 text-emerald-100 px-3 py-2 rounded-lg border border-emerald-800/30 focus:border-emerald-600 focus:outline-none w-full resize-none"
                    placeholder="ঠিকানা লিখুন"
                    rows={2}
                  />
                ) : (
                  <p className="text-emerald-100 font-medium">
                    {profile?.address || 'ঠিকানা যোগ করুন'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Join Date */}
          {profile?.joined_date && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <div>
                  <p className="text-sm text-emerald-200/70">যোগদানের তারিখ</p>
                  <p className="text-emerald-100 font-medium">
                    {new Date(profile.joined_date).toLocaleDateString('bn-BD')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {editing ? (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Here you would typically save the data
                setEditing(false);
              }}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-medium transition-all duration-200"
            >
              সংরক্ষণ করুন
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormData({
                  phone: profile?.phone || '',
                  address: profile?.address || '',
                });
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-emerald-100 py-3 rounded-xl font-medium transition-all duration-200"
            >
              বাতিল
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800/50 hover:bg-slate-700/50 text-emerald-100 py-3 rounded-xl font-medium transition-all duration-200 border border-emerald-800/30"
          >
            <Settings className="w-5 h-5" />
            <span>প্রোফাইল সম্পাদনা</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 py-3 rounded-xl font-medium transition-all duration-200 border border-red-800/30"
        >
          <LogOut className="w-5 h-5" />
          <span>লগ আউট (Logout)</span>
        </button>
      </div>
    </div>
  );
}
