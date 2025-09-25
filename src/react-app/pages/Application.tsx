import { useState } from "react";
import { User, Mail, Phone, MapPin, FileText, Send, CheckCircle } from "lucide-react";
import { db } from "@/react-app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface ApplicationData {
  name: string;
  email: string;
  phone: string;
  address: string;
  reason: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
}

export default function ApplicationPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const applicationData: ApplicationData = {
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-800/40 to-green-700/40 rounded-2xl p-8 border border-green-600/40 text-center">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-100 mb-4">
            আবেদন সফলভাবে জমা হয়েছে!
          </h2>
          <p className="text-green-200/70 mb-6">
            আপনার আবেদন আমাদের কাছে পৌঁছেছে। অ্যাডমিন আপনার আবেদন পর্যালোচনা করে আপনাকে জানাবেন।
          </p>
          <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/30">
            <p className="text-green-200 text-sm">
              <strong>পরবর্তী ধাপ:</strong> অ্যাডমিন আপনার আবেদন পর্যালোচনা করবেন এবং আপনাকে ইমেইলের মাধ্যমে জানাবেন।
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-100 mb-4">
          সদস্য হওয়ার আবেদন
        </h1>
        <p className="text-emerald-200/70">
          মসজিদ কমিউনিটির সদস্য হতে চান? নিচের ফর্মটি পূরণ করে আবেদন করুন।
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-emerald-800/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-100 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>ব্যক্তিগত তথ্য</span>
            </h3>
            
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
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="গ্রাম/মহল্লা, থানা, জেলা"
                />
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-100 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>আবেদনের বিবরণ</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                কেন সদস্য হতে চান? *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder="মসজিদ কমিউনিটির সদস্য হওয়ার কারণ লিখুন..."
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
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-emerald-600/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder="যদি কোনো ধর্মীয় কাজে অভিজ্ঞতা থাকে তাহলে লিখুন..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>জমা দেওয়া হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>আবেদন জমা দিন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-blue-900/30 rounded-lg p-4 border border-blue-700/30">
        <h4 className="text-blue-200 font-medium mb-2">জানুন:</h4>
        <ul className="text-blue-200/70 text-sm space-y-1">
          <li>• আবেদন জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করবেন</li>
          <li>• অনুমোদিত হলে আপনাকে ইমেইলের মাধ্যমে জানানো হবে</li>
          <li>• সদস্য হওয়ার পর আপনি নামাজের হিসাব, ইভেন্ট এবং অন্যান্য সুবিধা পাবেন</li>
        </ul>
      </div>
    </div>
  );
}
