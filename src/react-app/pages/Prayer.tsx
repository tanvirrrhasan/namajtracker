import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/react-app/context/FirebaseAuthContext";
import { Check, X, Sun, Sunrise, Sunset, Moon, Clock, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/react-app/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";

interface Member {
  id: string;
  name: string;
  user_id: string;
  is_admin?: boolean;
  is_active?: boolean;
}

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface PrayerRecord {
  id: string;
  member_id: string;
  member_name: string;
  prayer_date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  updated_by_user_id: string;
  is_self_updated: boolean;
  fajr_locked: boolean;
  dhuhr_locked: boolean;
  asr_locked: boolean;
  maghrib_locked: boolean;
  isha_locked: boolean;
  fajr_updated: boolean;
  dhuhr_updated: boolean;
  asr_updated: boolean;
  maghrib_updated: boolean;
  isha_updated: boolean;
}

const prayerTimes: Array<{ key: PrayerKey; name: string; name_en: string; icon: typeof Sun; time: string; color: string }> = [
  { key: 'fajr', name: 'ফজর', name_en: 'Fajr', icon: Sunrise, time: '৫:১৫', color: 'from-blue-600 to-blue-700' },
  { key: 'dhuhr', name: 'যুহর', name_en: 'Dhuhr', icon: Sun, time: '১২:৩০', color: 'from-yellow-600 to-yellow-700' },
  { key: 'asr', name: 'আসর', name_en: 'Asr', icon: Sun, time: '৪:৪৫', color: 'from-orange-600 to-orange-700' },
  { key: 'maghrib', name: 'মাগরিব', name_en: 'Maghrib', icon: Sunset, time: '৬:২০', color: 'from-red-600 to-red-700' },
  { key: 'isha', name: 'ইশা', name_en: 'Isha', icon: Moon, time: '৭:৪৫', color: 'from-purple-600 to-purple-700' },
];

export default function PrayerPage() {
  const { user } = useFirebaseAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [prayerRecords, setPrayerRecords] = useState<PrayerRecord[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate]);

  const fetchData = async () => {
    try {
      // Fetch members from Firestore
      const membersCol = collection(db, "members");
      const membersSnapshot = await getDocs(membersCol);
      const allMembers: Member[] = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Member));
      
      setMembers(allMembers);
      
      // Find current user's member record
      let userMember = allMembers.find((member: Member) => member.user_id === user?.id);
      
      // If user doesn't have a member record, create one
      if (!userMember && user) {
        const newMemberData = {
          name: user.name || user.email || "নাম নেই",
          user_id: user.id,
          email: user.email,
          is_admin: false,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, "members"), newMemberData);
        userMember = {
          id: docRef.id,
          ...newMemberData
        };
        
        // Add to members list
        setMembers(prev => [...prev, userMember!]);
      }
      
      setCurrentMember(userMember || null);

      // Fetch prayer records for selected date
      const prayersCol = collection(db, "prayer_records");
      const prayersQuery = query(prayersCol, where("prayer_date", "==", selectedDate));
      const prayersSnapshot = await getDocs(prayersQuery);
      const prayerRecords: PrayerRecord[] = prayersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PrayerRecord));
      
      setPrayerRecords(prayerRecords);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrayer = async (memberId: string, prayerType: PrayerKey, completed: boolean) => {
    if (!user) return;

    const updateKey = `${memberId}-${prayerType}`;
    setUpdating(updateKey);

    try {
      // Find existing prayer record for selected date
      const existingRecord = prayerRecords.find(record => 
        record.member_id === memberId && record.prayer_date === selectedDate
      );

      const isSelfUpdate = currentMember?.id === memberId;
      const member = members.find(m => m.id === memberId);

      // Create history record for every update
      const historyRecord = {
        member_id: memberId,
        member_name: member?.name || 'Unknown',
        prayer_type: prayerType,
        prayer_name: prayerTimes.find(p => p.key === prayerType)?.name || prayerType,
        completed: completed,
        updated_by_user_id: user.id,
        updated_by_user_name: currentMember?.name || 'Unknown',
        prayer_date: selectedDate,
        is_self_update: isSelfUpdate,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Store history record
      await addDoc(collection(db, "prayer_history"), historyRecord);

      if (existingRecord) {
        // Update existing record
        const recordRef = doc(db, "prayer_records", existingRecord.id);
        await updateDoc(recordRef, {
          [prayerType]: completed,
          [`${prayerType}_updated`]: true,
          // Lock only if self-updated
          [`${prayerType}_locked`]: isSelfUpdate,
          updated_by_user_id: user.id,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new record
        const newRecord: any = {
          member_id: memberId,
          prayer_date: selectedDate,
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
          fajr_updated: false,
          dhuhr_updated: false,
          asr_updated: false,
          maghrib_updated: false,
          isha_updated: false,
          fajr_locked: false,
          dhuhr_locked: false,
          asr_locked: false,
          maghrib_locked: false,
          isha_locked: false,
          updated_by_user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        newRecord[prayerType] = completed;
        newRecord[`${prayerType}_updated`] = true;
        // Lock only if self-updated
        newRecord[`${prayerType}_locked`] = isSelfUpdate;
        
        await addDoc(collection(db, "prayer_records"), newRecord);
      }

      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to update prayer:", error);
      alert("নেটওয়ার্ক এরর হয়েছে");
    } finally {
      setUpdating(null);
    }
  };

  const getMemberPrayerRecord = (memberId: string): PrayerRecord | null => {
    return prayerRecords.find(record => record.member_id === memberId) || null;
  };

  const isPrayerLocked = (memberId: string, prayerType: PrayerKey): boolean => {
    if (!currentMember) return false;
    
    const record = getMemberPrayerRecord(memberId);
    if (!record) return false;
    
    const lockColumn = `${prayerType}_locked` as keyof PrayerRecord;
    return Boolean(record[lockColumn]) && currentMember.id !== memberId;
  };

  const isPrayerSelfLocked = (memberId: string, prayerType: PrayerKey): boolean => {
    const record = getMemberPrayerRecord(memberId);
    if (!record) return false;
    
    const lockColumn = `${prayerType}_locked` as keyof PrayerRecord;
    return Boolean(record[lockColumn]);
  };

  const handleSelfPrayerClick = (prayerType: PrayerKey, completed: boolean) => {
    if (!currentMember) return;
    updatePrayer(currentMember.id, prayerType, completed);
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const newDate = previousDate.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    const newDate = nextDate.toISOString().split('T')[0];
    
    // Don't allow going to future dates
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const isPreviousDayDisabled = () => {
    // Allow going back to any past date
    return false;
  };

  const isNextDayDisabled = () => {
    const currentDate = new Date(selectedDate);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    const nextDateString = nextDate.toISOString().split('T')[0];
    
    // Disable if next day is in the future
    return nextDateString > today;
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Clock className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100 mb-2">
          লগইন প্রয়োজন
        </h2>
        <p className="text-emerald-200/70">
          নামাজের হিসাব দেখতে লগইন করুন
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-emerald-800/30 rounded w-1/3 mb-3"></div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-10 bg-emerald-800/20 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out current user from other members list
  const otherMembers = members.filter(member => member.id !== currentMember?.id);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-emerald-100 mb-1">
          নামাজের হিসাব
        </h1>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-center space-x-4 mb-2">
          <button
            onClick={goToPreviousDay}
            disabled={isPreviousDayDisabled()}
            className={`p-1 rounded transition-colors ${
              isPreviousDayDisabled() 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-800/40 hover:bg-emerald-700/40 text-emerald-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="text-sm text-emerald-200/70">
            {new Date(selectedDate).toLocaleDateString('bn-BD', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <button
            onClick={goToNextDay}
            disabled={isNextDayDisabled()}
            className={`p-1 rounded transition-colors ${
              isNextDayDisabled() 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-800/40 hover:bg-emerald-700/40 text-emerald-300'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current User's Prayer Status */}
      {currentMember && (
        <div className="bg-gradient-to-br from-emerald-800/40 to-emerald-700/40 rounded-2xl p-3 sm:p-6 border border-emerald-600/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-emerald-100">{currentMember.name}</h3>
              <p className="text-emerald-200/70 text-sm">আপনার আজকের নামাজ</p>
            </div>
            <div className="text-emerald-200/70">
              {(() => {
                const record = getMemberPrayerRecord(currentMember.id);
                const completedCount = record ? 
                  // Count only the five prayer booleans
                  (Number(record.fajr) + Number(record.dhuhr) + Number(record.asr) + Number(record.maghrib) + Number(record.isha))
                  : 0;
                return `${completedCount}/৫`;
              })()}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {prayerTimes.map((prayer) => {
              const record = getMemberPrayerRecord(currentMember.id);
              const isCompleted = record ? record[prayer.key as keyof PrayerRecord] as boolean : false;
              const isSelfLocked = isPrayerSelfLocked(currentMember.id, prayer.key);
              
              const updateKey = `${currentMember.id}-${prayer.key}`;
              const isUpdating = updating === updateKey;
              
              
              
              // Check if this specific prayer has been updated (not just any prayer)
              const updatedColumn = `${prayer.key}_updated` as keyof PrayerRecord;
              const hasThisPrayerUpdate = record && record[updatedColumn] as boolean;
              
              // If this specific prayer has been updated and is self-locked, show status with edit button
              if (hasThisPrayerUpdate && isSelfLocked) {
                return (
                  <div key={prayer.key} className={`relative p-2 sm:p-3 rounded-xl transition-all duration-200 min-h-[80px] ${
                    isCompleted 
                      ? 'bg-green-600 shadow-lg' 
                      : 'bg-red-600 shadow-lg'
                  } ${isUpdating ? 'opacity-50' : ''}`}>
                    <div className="text-center absolute bottom-2 left-0 right-0">
                      <div className="text-xs sm:text-sm font-medium text-white">
                        {prayer.name}
                      </div>
                      <div className="text-xs text-white/70">
                        {prayer.name_en}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const newCompleted = !isCompleted;
                        handleSelfPrayerClick(prayer.key, newCompleted);
                      }}
                      disabled={isUpdating}
                      className={`absolute -top-1 -right-1 w-6 h-6 ${
                        isCompleted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                      } rounded-full text-white text-xs transition-colors flex items-center justify-center`}
                    >
                      ✎
                    </button>
                    
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // If this specific prayer has been updated by others (but not self-locked), show colorful status with edit buttons  
              if (hasThisPrayerUpdate) {
                return (
                  <div key={prayer.key} className={`relative p-2 sm:p-3 rounded-xl transition-all duration-200 min-h-[80px] ${
                    isCompleted 
                      ? 'bg-green-800 shadow-lg' 
                      : 'bg-red-800 shadow-lg'
                  } ${isUpdating ? 'opacity-50' : ''}`}>
                    <div className="text-center absolute bottom-2 left-0 right-0">
                      <div className="text-xs sm:text-sm font-medium text-white">
                        {prayer.name}
                      </div>
                      <div className="text-xs text-white/70">
                        {prayer.name_en}
                      </div>
                    </div>
                    
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <button
                        onClick={() => handleSelfPrayerClick(prayer.key, false)}
                        disabled={isUpdating}
                        className="w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center text-white text-xs transition-colors shadow-lg"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => handleSelfPrayerClick(prayer.key, true)}
                        disabled={isUpdating}
                        className="w-6 h-6 bg-green-600 hover:bg-green-700 rounded flex items-center justify-center text-white text-xs transition-colors shadow-lg"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Default state - show black box with tick/cross buttons for direct confirmation
              return (
                <div key={prayer.key} className="relative p-3 rounded-xl bg-black border border-slate-600 transition-all duration-200 min-h-[80px]">
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                    <button
                      onClick={() => handleSelfPrayerClick(prayer.key, false)}
                      disabled={isUpdating}
                      className="w-6 h-6 bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => handleSelfPrayerClick(prayer.key, true)}
                      disabled={isUpdating}
                      className="w-6 h-6 bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="text-center absolute bottom-2 left-0 right-0">
                    <div className="text-xs sm:text-sm font-medium text-white">{prayer.name}</div>
                    <div className="text-xs text-slate-400">{prayer.name_en}</div>
                  </div>
                  
                  {isUpdating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Members Prayer Status */}
      {otherMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-emerald-100">অন্যান্য সদস্যদের নামাজের অবস্থা</h3>
          
          {otherMembers.map((member) => {
            const record = getMemberPrayerRecord(member.id);
            
            return (
              <div key={member.id} className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-emerald-100">{member.name}</h4>
                  </div>
                  <div className="text-xs text-emerald-200/70">
                    {record ? `${(Number(record.fajr) + Number(record.dhuhr) + Number(record.asr) + Number(record.maghrib) + Number(record.isha))}/৫` : '০/৫'}
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {prayerTimes.map((prayer) => {
                    const isCompleted = record ? record[prayer.key as keyof PrayerRecord] as boolean : false;
                    const updateKey = `${member.id}-${prayer.key}`;
                    const isUpdating = updating === updateKey;
                    const isLocked = isPrayerLocked(member.id, prayer.key);
                    
                    // Check if this specific prayer has been updated (not just any prayer)
                    const updatedColumn = `${prayer.key}_updated` as keyof PrayerRecord;
                    const hasThisPrayerSpecificUpdate = record && record[updatedColumn] as boolean;
                    
                    // Determine background color based on state
                    let bgClass = 'bg-black border border-slate-600'; // Default black for no update
                    if (hasThisPrayerSpecificUpdate) {
                      bgClass = isCompleted ? 'bg-green-600 shadow-lg' : 'bg-red-600 shadow-lg';
                    }
                    
                    return (
                      <button
                        key={prayer.key}
                        onClick={() => !isLocked ? updatePrayer(member.id, prayer.key, !isCompleted) : null}
                        disabled={isUpdating || isLocked}
                        className={`relative p-2 rounded-lg transition-all duration-200 min-h-[64px] ${bgClass} ${
                          isLocked ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                      >
                        <div className="text-center">
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                          ) : !hasThisPrayerSpecificUpdate ? (
                            // No icon for black/no update state
                            <div className="w-4 h-4 mx-auto mb-1"></div>
                          ) : isCompleted ? (
                            <Check className="w-4 h-4 text-white mx-auto mb-1" />
                          ) : (
                            <X className="w-4 h-4 text-white mx-auto mb-1" />
                          )}
                          <div className={`text-xs font-medium ${
                            hasThisPrayerSpecificUpdate ? 'text-white' : isLocked ? 'text-slate-500' : 'text-white'
                          }`}>
                            {prayer.name}
                          </div>
                        </div>
                        
                        {isUpdating && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {members.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-16 h-16 text-emerald-300/50 mx-auto mb-4" />
          <p className="text-emerald-200/70">কোন সদস্য পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
