import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/react-app/lib/firebase";
import { ImageIcon, Calendar, User } from "lucide-react";

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

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      const galleryQuery = query(collection(db, 'gallery'), orderBy('created_at', 'desc'));
      const gallerySnapshot = await getDocs(galleryQuery);
      const galleryData = gallerySnapshot.docs.map((doc, index) => ({
        id: doc.id || `gallery_${index}`,
        ...doc.data()
      })) as GalleryItem[];
      setGalleryItems(galleryData);
    } catch (error) {
      console.error("Failed to fetch gallery items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'featured' 
    ? galleryItems.filter(item => item.is_featured)
    : galleryItems;

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-200/70">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/40 to-emerald-700/40 rounded-2xl p-6 border border-emerald-600/40">
        <div className="flex items-center space-x-3 mb-2">
          <ImageIcon className="w-8 h-8 text-emerald-300" />
          <h1 className="text-2xl font-bold text-emerald-100">গ্যালারি</h1>
        </div>
        <p className="text-emerald-200/70">মসজিদের স্মৃতিচারণ ও গুরুত্বপূর্ণ মুহূর্ত</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-800/50 text-emerald-200/70 hover:bg-slate-700/50 border border-emerald-800/30'
          }`}
        >
          সব ছবি ({galleryItems.length})
        </button>
        <button
          onClick={() => setFilter('featured')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'featured'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-800/50 text-emerald-200/70 hover:bg-slate-700/50 border border-emerald-800/30'
          }`}
        >
          ফিচার্ড ({galleryItems.filter(item => item.is_featured).length})
        </button>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-emerald-100 mb-2">কোনো ছবি নেই</h3>
          <p className="text-emerald-200/70">এখনো কোনো ছবি আপলোড করা হয়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-emerald-800/30 hover:border-emerald-600/50 transition-all group">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title || 'Gallery Image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.is_featured && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                      ফিচার্ড
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                {item.title && (
                  <h3 className="font-semibold text-emerald-100 mb-2 line-clamp-2">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-sm text-emerald-200/70 mb-3 line-clamp-3">{item.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-emerald-300/60">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{item.uploaded_by_user_id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
