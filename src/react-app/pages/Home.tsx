import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { Calendar, Users, Activity, Building, BookOpen, Heart, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router";

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time?: string;
  location?: string;
}

interface GalleryItem {
  id: string | number;
  title?: string;
  description?: string;
  image_url: string;
  media_type: 'image' | 'video';
  event_id?: string | number;
  uploaded_by_user_id: string;
  is_featured: boolean;
  created_at: string;
}

export default function HomePage() {
  const { user, signInWithGoogle } = useFirebaseAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchGalleryItems();
  }, []);

  const fetchEvents = async () => {
    try {
      const col = collection(db, "events");
      const q = query(col, orderBy("event_date", "desc"), limit(3));
      const snap = await getDocs(q);
      const rows: Event[] = snap.docs
        .map((d) => ({ id: (d.data() as any).id ?? 0, ...(d.data() as any) }))
        .filter((r: any) => r.is_active !== false);
      setEvents(rows);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchGalleryItems = async () => {
    try {
      const col = collection(db, "gallery");
      // Avoid composite index by fetching recent items and filtering client-side
      const q = query(col, orderBy("created_at", "desc"), limit(20));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d, index) => ({
        id: d.id || `gallery_${index}`,
        ...(d.data() as any),
      })) as GalleryItem[];
      // Keep only featured for home preview, max 4
      const featured = rows.filter((r) => r.is_featured).slice(0, 4);
      setGalleryItems(featured);
    } catch (error) {
      console.error("Failed to fetch gallery items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Public view (not logged in) still shows events preview and featured gallery
  if (!user) {
    return (
      <div className="p-4 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-emerald-800/40 to-emerald-700/40 rounded-2xl p-6 border border-emerald-700/30 text-center">
          <Building className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-100 mb-2">সিরাতুল সাবিকুন</h1>
          <p className="text-emerald-200/80 mb-6">স্বাগতম! আমাদের কমিউনিটির সদস্য হয়ে নামাজের হিসাব রাখুন এবং ইভেন্টে অংশগ্রহণ করুন।</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-emerald-800/30 flex items-center justify-center space-x-2"
            >
              <span>গুগল দিয়ে লগইন করুন</span>
            </button>
            <Link
              to="/application"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-800/30 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>সদস্য হওয়ার আবেদন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Registration Info Card */}
        <div className="bg-gradient-to-r from-blue-800/40 to-blue-700/40 rounded-2xl p-6 border border-blue-700/30">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600/20 p-3 rounded-xl">
              <FileText className="w-8 h-8 text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-100 mb-2">সদস্য হতে চান?</h3>
              <p className="text-blue-200/80 mb-4">
                আমাদের সিরাতুল সাবিকুন কমিউনিটির সদস্য হয়ে নামাজের হিসাব রাখুন, ইভেন্টে অংশগ্রহণ করুন এবং ধর্মীয় কার্যক্রমে অংশ নিন।
              </p>
              <div className="space-y-2 text-sm text-blue-200/70">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>নামাজের দৈনিক হিসাব রাখা</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>ইভেন্ট ও কার্যক্রমে অংশগ্রহণ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>গ্যালারি ও ছবি দেখা</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>কমিউনিটি সদস্যদের সাথে যোগাযোগ</span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/application"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>এখনই আবেদন করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events (public) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-100">সাম্প্রতিক ইভেন্ট</h3>
            <Link to="/activities" className="text-emerald-300 text-sm hover:text-emerald-200">সব দেখুন</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-emerald-800/30 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-emerald-800/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                  <h4 className="font-medium text-emerald-100 mb-1">{event.title}</h4>
                  <p className="text-sm text-emerald-200/70 mb-2">{event.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-emerald-300">
                    <span>📅 {new Date(event.event_date).toLocaleDateString('bn-BD')}</span>
                    {event.event_time && <span>🕐 {event.event_time}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-6 text-center">
              <Calendar className="w-12 h-12 text-emerald-300/50 mx-auto mb-3" />
              <p className="text-emerald-200/70">কোন ইভেন্ট পাওয়া যায়নি</p>
            </div>
          )}
        </div>

        {/* Featured Gallery (public) */}
        {galleryItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-100">ফিচার্ড গ্যালারি</h3>
              <Link to="/gallery" className="text-emerald-300 text-sm hover:text-emerald-200">সব দেখুন</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {galleryItems.map((item) => (
                <div key={item.id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-emerald-800/30 hover:border-emerald-600/50 transition-all group">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={item.image_url} alt={item.title || 'Gallery Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-1 right-1">
                      <span className="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded text-xs font-medium">ফিচার্ড</span>
                    </div>
                  </div>
                  {item.title && (
                    <div className="p-2">
                      <p className="text-xs text-emerald-100 line-clamp-2">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-800/40 to-emerald-700/40 rounded-2xl p-6 border border-emerald-700/30">
        <div className="flex items-center space-x-4">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-emerald-300"
            />
          )}
          <div>
          <h2 className="text-xl font-bold text-emerald-100">
            আসসালামু আলাইকুম, {user?.name?.split(' ')[0] || 'ভাই'}!
          </h2>
            <p className="text-emerald-200/70">আজকের নামাজের হিসাব আপডেট করুন</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
          <Users className="w-8 h-8 text-emerald-300 mb-2" />
          <h3 className="text-lg font-semibold text-emerald-100">সদস্য</h3>
          <p className="text-2xl font-bold text-emerald-300">৫০+</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
          <Activity className="w-8 h-8 text-emerald-300 mb-2" />
          <h3 className="text-lg font-semibold text-emerald-100">কার্যক্রম</h3>
          <p className="text-2xl font-bold text-emerald-300">১৫+</p>
        </div>
      </div>

      {/* Recent Events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-emerald-100">সাম্প্রতিক ইভেন্ট</h3>
          <button className="text-emerald-300 text-sm hover:text-emerald-200">
            সব দেখুন
          </button>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-emerald-800/30 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-emerald-800/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <h4 className="font-medium text-emerald-100 mb-1">{event.title}</h4>
                <p className="text-sm text-emerald-200/70 mb-2">{event.description}</p>
                <div className="flex items-center space-x-4 text-xs text-emerald-300">
                  <span>📅 {new Date(event.event_date).toLocaleDateString('bn-BD')}</span>
                  {event.event_time && <span>🕐 {event.event_time}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/30 rounded-xl p-6 text-center">
            <Calendar className="w-12 h-12 text-emerald-300/50 mx-auto mb-3" />
            <p className="text-emerald-200/70">কোন ইভেন্ট পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Featured Gallery */}
      {galleryItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-100">ফিচার্ড গ্যালারি</h3>
            <Link to="/gallery" className="text-emerald-300 text-sm hover:text-emerald-200">
              সব দেখুন
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryItems.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-emerald-800/30 hover:border-emerald-600/50 transition-all group">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Gallery Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 right-1">
                    <span className="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded text-xs font-medium">
                      ফিচার্ড
                    </span>
                  </div>
                </div>
                {item.title && (
                  <div className="p-2">
                    <p className="text-xs text-emerald-100 line-clamp-2">{item.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-gradient-to-br from-blue-800/40 to-blue-700/40 p-4 rounded-xl border border-blue-700/30 hover:from-blue-700/50 hover:to-blue-600/50 transition-all">
          <BookOpen className="w-8 h-8 text-blue-300 mx-auto mb-2" />
          <span className="text-blue-100 text-sm font-medium">মাদ্রাসা</span>
        </button>
        <button className="bg-gradient-to-br from-purple-800/40 to-purple-700/40 p-4 rounded-xl border border-purple-700/30 hover:from-purple-700/50 hover:to-purple-600/50 transition-all">
          <Heart className="w-8 h-8 text-purple-300 mx-auto mb-2" />
          <span className="text-purple-100 text-sm font-medium">দান</span>
        </button>
      </div>
    </div>
  );
}
