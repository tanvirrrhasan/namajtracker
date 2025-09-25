import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { Activity, Calendar, Clock } from "lucide-react";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

interface ActivityType {
  id: string;
  title: string;
  description?: string;
  activity_type: string;
  scheduled_date?: string;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  is_hidden?: boolean;
}

const activityTypeMap: Record<string, { name: string, name_en: string, icon: string, color: string }> = {
  'mosque_cleaning': { name: 'মসজিদ পরিষ্কার', name_en: 'Mosque Cleaning', icon: '🕌', color: 'from-green-600 to-green-700' },
  'madrasa_teaching': { name: 'মাদ্রাসা শিক্ষাদান', name_en: 'Madrasa Teaching', icon: '📚', color: 'from-blue-600 to-blue-700' },
  'community_service': { name: 'সমাজসেবা', name_en: 'Community Service', icon: '🤝', color: 'from-purple-600 to-purple-700' },
  'food_distribution': { name: 'খাদ্য বিতরণ', name_en: 'Food Distribution', icon: '🍽️', color: 'from-orange-600 to-orange-700' },
  'fundraising': { name: 'অর্থ সংগ্রহ', name_en: 'Fundraising', icon: '💰', color: 'from-yellow-600 to-yellow-700' },
};

const statusMap: Record<string, { name: string, name_en: string, color: string }> = {
  'planned': { name: 'পরিকল্পিত', name_en: 'Planned', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'in_progress': { name: 'চলমান', name_en: 'In Progress', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  'completed': { name: 'সম্পন্ন', name_en: 'Completed', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

export default function ActivitiesPage() {
  const { user } = useFirebaseAuth();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const activitiesCol = collection(db, "activities");
      const activitiesQuery = query(activitiesCol, orderBy("created_at", "desc"));
      const snapshot = await getDocs(activitiesQuery);
      const activitiesData: ActivityType[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ActivityType));
      
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (activity.is_hidden) return false;
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Activity className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">
          লগইন প্রয়োজন
        </h2>
        <p className="text-emerald-200/70">
          কার্যক্রমের তালিকা দেখতে লগইন করুন
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-emerald-800/30 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-emerald-800/20 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-emerald-800/20 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-emerald-100 mb-2">
          কমিউনিটি কার্যক্রম
        </h1>
        <p className="text-emerald-200/70">
          আমাদের সমাজসেবার কার্যক্রমসমূহ
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'all', name: 'সব', name_en: 'All' },
          { key: 'planned', name: 'পরিকল্পিত', name_en: 'Planned' },
          { key: 'in_progress', name: 'চলমান', name_en: 'Active' },
          { key: 'completed', name: 'সম্পন্ন', name_en: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/50 text-emerald-200/70 hover:bg-slate-700/50 border border-emerald-800/30'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30 text-center">
          <div className="text-2xl font-bold text-emerald-300">
            {activities.filter(a => !a.is_hidden && a.status === 'planned').length}
          </div>
          <div className="text-sm text-emerald-200/70">পরিকল্পিত</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30 text-center">
          <div className="text-2xl font-bold text-yellow-300">
            {activities.filter(a => !a.is_hidden && a.status === 'in_progress').length}
          </div>
          <div className="text-sm text-emerald-200/70">চলমান</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30 text-center">
          <div className="text-2xl font-bold text-green-300">
            {activities.filter(a => !a.is_hidden && a.status === 'completed').length}
          </div>
          <div className="text-sm text-emerald-200/70">সম্পন্ন</div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => {
            const activityInfo = activityTypeMap[activity.activity_type] || {
              name: activity.activity_type,
              name_en: activity.activity_type,
              icon: '📋',
              color: 'from-gray-600 to-gray-700'
            };
            
            const statusInfo = statusMap[activity.status];

            return (
              <div key={activity.id} className="bg-slate-800/50 rounded-xl p-5 border border-emerald-800/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`bg-gradient-to-br ${activityInfo.color} p-3 rounded-lg`}>
                      <span className="text-xl">{activityInfo.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-100 text-lg">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-emerald-200/70">
                        {activityInfo.name} ({activityInfo.name_en})
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                    {statusInfo.name}
                  </span>
                </div>

                {activity.description && (
                  <p className="text-emerald-200/80 mb-4 leading-relaxed">
                    {activity.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-emerald-200/70">
                  <div className="flex items-center space-x-4">
                    {activity.scheduled_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(activity.scheduled_date).toLocaleDateString('bn-BD')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(activity.created_at).toLocaleDateString('bn-BD')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-2">
              কোন কার্যক্রম পাওয়া যায়নি
            </h3>
            <p className="text-emerald-200/70">
              {filter === 'all' ? 'এখনও কোন কার্যক্রম যোগ করা হয়নি' : `${statusMap[filter]?.name} কার্যক্রম পাওয়া যায়নি`}
            </p>
          </div>
        )}
      </div>

      {/* Add Activity Button removed */}
    </div>
  );
}
