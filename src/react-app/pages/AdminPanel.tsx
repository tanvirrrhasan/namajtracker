import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { Shield, Users, Calendar, Activity, Plus, Edit2, Trash2, Eye, Settings, X } from "lucide-react";
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/react-app/lib/firebase";

// Client-side image compression to keep base64 under Firestore 1MB field limit
async function compressImageToBase64(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0..1
    maxBytes?: number; // hard cap for base64 payload size in bytes
    mimeType?: string;
  } = {}
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, maxBytes = 900_000, mimeType = "image/jpeg" } = options;
  let quality = options.quality ?? 0.8;

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / imageBitmap.width, maxHeight / imageBitmap.height);
  const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Iteratively reduce quality until under size cap or quality too low
  for (let i = 0; i < 6; i++) {
    const dataUrl = canvas.toDataURL(mimeType, quality);
    // Estimate bytes from base64 length
    const base64Length = dataUrl.length - (dataUrl.indexOf(",") + 1);
    const approxBytes = Math.ceil((base64Length * 3) / 4);
    if (approxBytes <= maxBytes) {
      return dataUrl;
    }
    quality = Math.max(0.4, quality - 0.15);
  }
  // One last attempt at very low quality
  const finalDataUrl = canvas.toDataURL(mimeType, Math.max(0.3, quality));
  const finalBase64Length = finalDataUrl.length - (finalDataUrl.indexOf(",") + 1);
  const finalApproxBytes = Math.ceil((finalBase64Length * 3) / 4);
  if (finalApproxBytes <= maxBytes) return finalDataUrl;
  throw new Error("Compressed image still exceeds size limit");
}

interface Member {
  id: string | number;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  is_admin: boolean;
  is_active: boolean;
  joined_date?: string;
  created_at: string;
}

interface Event {
  id: string | number;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  image_url?: string;
  created_by_user_id: string;
  is_active: boolean;
  created_at: string;
}

interface ActivityType {
  id: string | number;
  title: string;
  description?: string;
  activity_type: string;
  scheduled_date?: string;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
}

interface GalleryItem {
  id: string | number;
  title?: string;
  description?: string;
  image_url: string; // base64 encoded image
  media_type: 'image' | 'video';
  event_id?: string | number;
  uploaded_by_user_id: string;
  is_featured: boolean;
  created_at: string;
}

export default function AdminPanel() {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'activities' | 'gallery'>('overview');
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [showAddGalleryForm, setShowAddGalleryForm] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Temporary solution: Check if user email is admin email
    if (user.email === 'vaitanvir833@gmail.com') {
      setIsAdmin(true);
      fetchAllData();
      return;
    }

    try {
      const response = await fetch("/api/members/profile");
      const data = await response.json();
      
      if (data.success && data.data.is_admin) {
        setIsAdmin(true);
        fetchAllData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch members from Firebase
      const membersQuery = query(collection(db, 'members'), orderBy('created_at', 'desc'));
      const membersSnapshot = await getDocs(membersQuery);
      const membersData = membersSnapshot.docs.map((doc, index) => ({
        id: doc.id || `member_${index}`, // Use doc.id as string or fallback
        ...doc.data()
      })) as Member[];
      setMembers(membersData);

      // Fetch events from Firebase
      const eventsQuery = query(collection(db, 'events'), orderBy('created_at', 'desc'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map((doc, index) => ({
        id: doc.id || `event_${index}`, // Use doc.id as string or fallback
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);

      // Fetch activities from Firebase
      const activitiesQuery = query(collection(db, 'activities'), orderBy('created_at', 'desc'));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map((doc, index) => ({
        id: doc.id || `activity_${index}`, // Use doc.id as string or fallback
        ...doc.data()
      })) as ActivityType[];
      setActivities(activitiesData);

      // Fetch gallery items from Firebase
      const galleryQuery = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
      const gallerySnapshot = await getDocs(galleryQuery);
      const galleryData = gallerySnapshot.docs.map((doc, index) => ({
        id: doc.id || `gallery_${index}`, // Use doc.id as string or fallback
        ...doc.data()
      })) as GalleryItem[];
      setGalleryItems(galleryData);

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberAdmin = async (memberId: string | number, isCurrentlyAdmin: boolean) => {
    try {
      const memberRef = doc(db, 'members', memberId.toString());
      await updateDoc(memberRef, {
        is_admin: !isCurrentlyAdmin,
        updated_at: new Date().toISOString()
      });
      fetchAllData(); // Refresh data
      console.log(`Admin status toggled for member ${memberId}`);
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    }
  };

  const toggleMemberActive = async (memberId: string | number, isCurrentlyActive: boolean) => {
    try {
      const memberRef = doc(db, 'members', memberId.toString());
      await updateDoc(memberRef, {
        is_active: !isCurrentlyActive,
        updated_at: new Date().toISOString()
      });
      fetchAllData(); // Refresh data
      console.log(`Active status toggled for member ${memberId}`);
    } catch (error) {
      console.error("Failed to toggle active status:", error);
    }
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMemberData = {
        ...memberData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(newMemberData).forEach(key => {
        if (newMemberData[key as keyof typeof newMemberData] === undefined) {
          delete newMemberData[key as keyof typeof newMemberData];
        }
      });
      
      const docRef = await addDoc(collection(db, 'members'), newMemberData);
      console.log('Member added with ID: ', docRef.id);
      fetchAllData(); // Refresh data
      setShowAddMemberForm(false);
    } catch (error) {
      console.error('Error adding member: ', error);
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>) => {
    try {
      const newEventData = {
        ...eventData,
        created_by_user_id: user?.email || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(newEventData).forEach(key => {
        if (newEventData[key as keyof typeof newEventData] === undefined) {
          delete newEventData[key as keyof typeof newEventData];
        }
      });
      
      const docRef = await addDoc(collection(db, 'events'), newEventData);
      console.log('Event added with ID: ', docRef.id);
      fetchAllData(); // Refresh data
      setShowAddEventForm(false);
    } catch (error) {
      console.error('Error adding event: ', error);
    }
  };

  const addActivity = async (activityData: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newActivityData = {
        ...activityData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(newActivityData).forEach(key => {
        if (newActivityData[key as keyof typeof newActivityData] === undefined) {
          delete newActivityData[key as keyof typeof newActivityData];
        }
      });
      
      const docRef = await addDoc(collection(db, 'activities'), newActivityData);
      console.log('Activity added with ID: ', docRef.id);
      fetchAllData(); // Refresh data
      setShowAddActivityForm(false);
    } catch (error) {
      console.error('Error adding activity: ', error);
    }
  };

  const addGalleryItem = async (galleryData: Omit<GalleryItem, 'id' | 'created_at' | 'uploaded_by_user_id'>) => {
    try {
      const newGalleryData = {
        ...galleryData,
        uploaded_by_user_id: user?.email || 'unknown',
        created_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(newGalleryData).forEach(key => {
        if (newGalleryData[key as keyof typeof newGalleryData] === undefined) {
          delete newGalleryData[key as keyof typeof newGalleryData];
        }
      });
      
      const docRef = await addDoc(collection(db, 'gallery'), newGalleryData);
      console.log('Gallery item added with ID: ', docRef.id);
      fetchAllData(); // Refresh data
      setShowAddGalleryForm(false);
    } catch (error: any) {
      console.error('Error adding gallery item: ', error);
      const message = (error && (error.code === 'permission-denied' || /insufficient permissions/i.test(error.message)))
        ? 'আপনার এই কাজটি করার অনুমতি নেই। অনুগ্রহ করে Firebase Firestore Rules আপডেট করুন যাতে admin ইমেইল থেকে gallery তে write করা যায়।'
        : (error?.message || 'গ্যালারি আইটেম যোগ করতে ব্যর্থ হয়েছে');
      alert(message);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">লগইন প্রয়োজন</h2>
        <p className="text-emerald-200/70">অ্যাডমিন প্যানেল দেখতে লগইন করুন</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-200/70">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-16 h-16 text-red-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-100 mb-2">অ্যাক্সেস অনুমতি নেই</h2>
        <p className="text-red-200/70">শুধুমাত্র অ্যাডমিনরা এই পেজ দেখতে পারবেন</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-800/40 to-yellow-700/40 rounded-2xl p-6 border border-yellow-600/40">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-yellow-300" />
          <h1 className="text-2xl font-bold text-yellow-100">অ্যাডমিন প্যানেল</h1>
        </div>
        <p className="text-yellow-200/70">সিস্টেম ব্যবস্থাপনা ও নিয়ন্ত্রণ</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'overview', name: 'ওভারভিউ', icon: Eye },
          { key: 'members', name: 'সদস্য ব্যবস্থাপনা', icon: Users },
          { key: 'events', name: 'ইভেন্ট ব্যবস্থাপনা', icon: Calendar },
          { key: 'activities', name: 'কার্যক্রম ব্যবস্থাপনা', icon: Activity },
          { key: 'gallery', name: 'গ্যালারি ব্যবস্থাপনা', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/50 text-emerald-200/70 hover:bg-slate-700/50 border border-emerald-800/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 text-center">
            <Users className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-1">মোট সদস্য</h3>
            <p className="text-3xl font-bold text-emerald-300">{members.length}</p>
            <p className="text-sm text-emerald-200/70 mt-2">
              সক্রিয়: {members.filter(m => m.is_active).length}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 text-center">
            <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-1">মোট ইভেন্ট</h3>
            <p className="text-3xl font-bold text-blue-300">{events.length}</p>
            <p className="text-sm text-emerald-200/70 mt-2">
              সক্রিয়: {events.filter(e => e.is_active).length}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 text-center">
            <Activity className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-1">মোট কার্যক্রম</h3>
            <p className="text-3xl font-bold text-purple-300">{activities.length}</p>
            <p className="text-sm text-emerald-200/70 mt-2">
              সম্পন্ন: {activities.filter(a => a.status === 'completed').length}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 text-center">
            <Settings className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-1">মোট গ্যালারি</h3>
            <p className="text-3xl font-bold text-orange-300">{galleryItems.length}</p>
            <p className="text-sm text-emerald-200/70 mt-2">
              ফিচার্ড: {galleryItems.filter(g => g.is_featured).length}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-emerald-100">সদস্য ব্যবস্থাপনা</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-emerald-200/70">
                মোট সদস্য: {members.length}
              </span>
              <button 
                onClick={() => setShowAddMemberForm(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="font-semibold text-emerald-100 flex items-center space-x-2">
                        <span>{member.name}</span>
                        {member.is_admin && (
                          <Shield className="w-4 h-4 text-yellow-400" />
                        )}
                      </h3>
                      <p className="text-sm text-emerald-200/70">{member.email}</p>
                      {member.phone && (
                        <p className="text-sm text-emerald-200/70">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleMemberAdmin(member.id, member.is_admin)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        member.is_admin 
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                      }`}
                    >
                      {member.is_admin ? 'অ্যাডমিন' : 'অ্যাডমিন করুন'}
                    </button>
                    
                    <button
                      onClick={() => toggleMemberActive(member.id, member.is_active)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        member.is_active 
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                      }`}
                    >
                      {member.is_active ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-emerald-200/60">
                  যোগদান: {member.joined_date ? new Date(member.joined_date).toLocaleDateString('bn-BD') : 'তারিখ নেই'}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-emerald-100">ইভেন্ট ব্যবস্থাপনা</h2>
            <button 
              onClick={() => setShowAddEventForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ইভেন্ট</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-100 mb-1">{event.title}</h3>
                    <p className="text-sm text-emerald-200/70 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-emerald-300">
                      <span>📅 {new Date(event.event_date).toLocaleDateString('bn-BD')}</span>
                      {event.event_time && <span>🕐 {event.event_time}</span>}
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.is_active 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {event.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                  <span className="text-xs text-emerald-200/60">
                    তৈরি: {new Date(event.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-emerald-100">কার্যক্রম ব্যবস্থাপনা</h2>
            <button 
              onClick={() => setShowAddActivityForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কার্যক্রম</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-100 mb-1">{activity.title}</h3>
                    <p className="text-sm text-emerald-200/70 mb-2">{activity.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-emerald-300">
                      <span>📋 {activity.activity_type}</span>
                      {activity.scheduled_date && (
                        <span>📅 {new Date(activity.scheduled_date).toLocaleDateString('bn-BD')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : activity.status === 'in_progress'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {activity.status === 'completed' ? 'সম্পন্ন' : 
                       activity.status === 'in_progress' ? 'চলমান' : 'পরিকল্পিত'}
                    </span>
                    <button className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-emerald-100">গ্যালারি ব্যবস্থাপনা</h2>
            <button 
              onClick={() => setShowAddGalleryForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ছবি</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Gallery Image'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  {item.title && (
                    <h3 className="font-semibold text-emerald-100">{item.title}</h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-emerald-200/70">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_featured 
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {item.is_featured ? 'ফিচার্ড' : 'সাধারণ'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-emerald-100">নতুন সদস্য যোগ করুন</h3>
              <button
                onClick={() => setShowAddMemberForm(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addMember({
                user_id: formData.get('email') as string,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string || undefined,
                address: formData.get('address') as string || undefined,
                is_admin: formData.get('is_admin') === 'true',
                is_active: true,
                joined_date: new Date().toISOString().split('T')[0]
              });
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">নাম</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                    placeholder="সদস্যের নাম"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">ইমেইল</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                    placeholder="ইমেইল ঠিকানা"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">ফোন</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                    placeholder="ফোন নম্বর"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">ঠিকানা</label>
                  <input
                    type="text"
                    name="address"
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                    placeholder="ঠিকানা"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_admin"
                    value="true"
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-emerald-600/30 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-emerald-200">অ্যাডমিন হিসেবে যোগ করুন</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg transition-all"
                >
                  যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-emerald-100">নতুন ইভেন্ট যোগ করুন</h3>
              <button
                onClick={() => setShowAddEventForm(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addEvent({
                title: formData.get('title') as string,
                description: formData.get('description') as string || undefined,
                event_date: formData.get('event_date') as string,
                event_time: formData.get('event_time') as string || undefined,
                location: formData.get('location') as string || undefined,
                image_url: undefined,
                is_active: true
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">ইভেন্টের নাম</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="ইভেন্টের নাম"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">বিবরণ</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="ইভেন্টের বিবরণ"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">তারিখ</label>
                  <input
                    type="date"
                    name="event_date"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">সময়</label>
                  <input
                    type="time"
                    name="event_time"
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">স্থান</label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="ইভেন্টের স্থান"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg transition-all"
                >
                  যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEventForm(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivityForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-emerald-100">নতুন কার্যক্রম যোগ করুন</h3>
              <button
                onClick={() => setShowAddActivityForm(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              addActivity({
                title: formData.get('title') as string,
                description: formData.get('description') as string || undefined,
                activity_type: formData.get('activity_type') as string,
                scheduled_date: formData.get('scheduled_date') as string || undefined,
                status: formData.get('status') as 'planned' | 'in_progress' | 'completed'
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">কার্যক্রমের নাম</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="কার্যক্রমের নাম"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">বিবরণ</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="কার্যক্রমের বিবরণ"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">কার্যক্রমের ধরন</label>
                  <select
                    name="activity_type"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="mosque_cleaning">মসজিদ পরিষ্কার</option>
                    <option value="madrasa_teaching">মাদ্রাসা শিক্ষা</option>
                    <option value="community_service">সমাজসেবা</option>
                    <option value="religious_education">ধর্মীয় শিক্ষা</option>
                    <option value="charity_work">দান কাজ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">তারিখ</label>
                  <input
                    type="date"
                    name="scheduled_date"
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">অবস্থা</label>
                <select
                  name="status"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="planned">পরিকল্পিত</option>
                  <option value="in_progress">চলমান</option>
                  <option value="completed">সম্পন্ন</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg transition-all"
                >
                  যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddActivityForm(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Gallery Modal */}
      {showAddGalleryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-800/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-emerald-100">নতুন ছবি যোগ করুন</h3>
              <button
                onClick={() => setShowAddGalleryForm(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-emerald-300" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const fileInput = (e.currentTarget as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
              const file = fileInput?.files?.[0];
              
              try {
                if (!file) return;
                const base64String = await compressImageToBase64(file, {
                  maxWidth: 1600,
                  maxHeight: 1600,
                  quality: 0.8,
                  maxBytes: 900_000,
                  mimeType: 'image/jpeg'
                });
                await addGalleryItem({
                  title: formData.get('title') as string || undefined,
                  description: formData.get('description') as string || undefined,
                  image_url: base64String,
                  media_type: 'image',
                  event_id: formData.get('event_id') as string || undefined,
                  is_featured: formData.get('is_featured') === 'true'
                });
              } catch (err) {
                console.error(err);
                alert('ছবিটি অনেক বড়। অনুগ্রহ করে ছোট সাইজের ছবি নির্বাচন করুন বা কম রেজোলিউশনের ছবি ব্যবহার করুন।');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">ছবি নির্বাচন করুন</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">শিরোনাম</label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="ছবির শিরোনাম"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">বিবরণ</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                  placeholder="ছবির বিবরণ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-2">ইভেন্ট (ঐচ্ছিক)</label>
                <select
                  name="event_id"
                  className="w-full px-3 py-2 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">কোনো ইভেন্টের সাথে যুক্ত নয়</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    value="true"
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-emerald-600/30 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-emerald-200">ফিচার্ড ছবি হিসেবে চিহ্নিত করুন</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg transition-all"
                >
                  যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGalleryForm(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
