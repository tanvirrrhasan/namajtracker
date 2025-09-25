import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { User, Mail, Phone, MapPin, Calendar, Settings, LogOut, Shield, Send, CheckCircle, X } from "lucide-react";
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
      // Primary: lookup by user_id
      let snapshot = await getDocs(query(membersCol, where("user_id", "==", user.id)));
      
      // Fallback: if missing user_id in DB, try by email
      if (snapshot.empty && user.email) {
        snapshot = await getDocs(query(membersCol, where("email", "==", user.email)));
      }

      if (snapshot.empty) {
        console.error("Member profile not found for user:", user.id);
        setProfile(null);
        setLoading(false);
        return;
      }

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
      <LoginPanel />
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

  if (!profile) {
    return (
      <div className="p-4">
        <div className="bg-red-800/40 rounded-xl p-6 border border-red-700/30 text-center">
          <div className="w-16 h-16 text-red-300 mx-auto mb-4">
            <User className="w-full h-full" />
          </div>
          <h2 className="text-xl font-semibold text-red-100 mb-2">প্রোফাইল পাওয়া যায়নি</h2>
          <p className="text-red-200/70 mb-4">
            আপনার সদস্য প্রোফাইল পাওয়া যায়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            লগ আউট করুন
          </button>
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

function LoginPanel() {
  const { signInWithGoogle, signInWithEmailPassword } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const handleEmailAction = async () => {
    try {
      setBusy(true);
      setError(null);
      await signInWithEmailPassword(email, password);
    } catch (e: any) {
      setError(e?.message || 'অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <div className="text-center">
        <User className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">লগইন</h2>
        <p className="text-emerald-200/70">গুগল বা ইমেইল/পাসওয়ার্ড দিয়ে লগইন করুন</p>
      </div>

        <button
          onClick={signInWithGoogle}
          disabled={busy}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-medium transition-all duration-200"
        >
          Google দিয়ে লগইন
        </button>

        <div className="text-center">
          <button
            onClick={() => setShowApplicationModal(true)}
            className="text-emerald-300 hover:text-emerald-200 text-sm underline transition-colors"
          >
            সদস্য হওয়ার জন্য আবেদন করুন
          </button>
        </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30 space-y-3">
        <div className="grid gap-2">
          <input
            type="email"
            placeholder="ইমেইল"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-700 text-emerald-100 px-3 py-2 rounded-lg border border-emerald-800/30 focus:border-emerald-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-700 text-emerald-100 px-3 py-2 rounded-lg border border-emerald-800/30 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEmailAction}
            disabled={busy}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            ইমেইল দিয়ে লগইন
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-xs text-emerald-200/60">নোট: প্রথমবার লগইনে অ্যাডমিন দেয়া temp_password মিললে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট তৈরি হবে।</p>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal onClose={() => setShowApplicationModal(false)} />
      )}
    </div>
  );
}

function ApplicationModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    reason: '',
    experience: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore scroll when modal closes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const applicationData = {
        ...formData,
        status: 'pending',
        applied_at: new Date().toISOString()
      };

      await addDoc(collection(db, "applications"), applicationData);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit application:", err);
      setError("আবেদন জমা দেওয়ার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-100 mb-2">
              আবেদন সফলভাবে জমা হয়েছে!
            </h3>
            <p className="text-green-200/70 mb-4 text-sm">
              আপনার আবেদন আমাদের কাছে পৌঁছেছে। অ্যাডমিন আপনার আবেদন পর্যালোচনা করে আপনাকে জানাবেন।
            </p>
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-emerald-100">সদস্য হওয়ার আবেদন</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-emerald-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                পূর্ণ নাম *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="আপনার পূর্ণ নাম"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                ইমেইল ঠিকানা *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="example@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                ফোন নম্বর *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="০১৭১২৩৪৫৬৭৮"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                বর্তমান ঠিকানা *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="গ্রাম/মহল্লা, থানা, জেলা"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              কেন সদস্য হতে চান? *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="সিরাতুল সাবিকুন কমিউনিটির সদস্য হওয়ার কারণ লিখুন..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              ধর্মীয় কাজে আপনার অভিজ্ঞতা (ঐচ্ছিক)
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="যদি কোনো ধর্মীয় কাজে অভিজ্ঞতা থাকে তাহলে লিখুন..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>জমা দেওয়া হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>আবেদন জমা দিন</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
