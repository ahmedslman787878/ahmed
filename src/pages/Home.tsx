import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Trash2, Filter, ChevronDown, Maximize, AlertCircle, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User } from 'firebase/auth';

interface Ad {
  id: string;
  title: string;
  price: number;
  area: number;
  propertyType: string;
  transactionType: string;
  activityType: string;
  location: string;
  createdAt: string;
  isFeatured?: boolean;
  featuredAt?: string;
  image?: string;
}

export default function Home({ user }: { user: User | null }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(localStorage.getItem('isAdmin') === 'true');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('الكل');
  const [filterTransactionType, setFilterTransactionType] = useState('الكل');
  const [filterActivityType, setFilterActivityType] = useState('الكل');
  
  // Pagination state
  const [visibleCount, setVisibleCount] = useState(10);

  // Modal & Toast state
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const handleAdminChange = () => setIsAdminMode(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('adminStatusChanged', handleAdminChange);
    
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ad[];
      
      const now = Date.now();
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      
      // Filter out ads older than 15 days for display, and compute active feature status
      const validAds = adsData.filter(ad => {
        const adDate = new Date(ad.createdAt).getTime();
        return (now - adDate) <= fifteenDaysMs;
      }).map(ad => {
        let activeFeature = ad.isFeatured;
        if (ad.isFeatured && ad.featuredAt) {
          if ((now - new Date(ad.featuredAt).getTime()) > sevenDaysMs) {
            activeFeature = false;
          }
        }
        return { ...ad, isFeatured: activeFeature };
      });
      
      // Sort: Featured first, then by createdAt desc
      validAds.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setAds(validAds);

      // Auto-delete expired ads from database if admin
      if (localStorage.getItem('isAdmin') === 'true') {
        const expiredAds = adsData.filter(ad => {
          const adDate = new Date(ad.createdAt).getTime();
          return (now - adDate) > fifteenDaysMs;
        });
        
        expiredAds.forEach(async (ad) => {
          try {
            await deleteDoc(doc(db, 'ads', ad.id));
            console.log(`Auto-deleted expired ad: ${ad.id}`);
          } catch (e) {
            console.error("Failed to auto-delete ad", e);
          }
        });

        // Auto-remove expired features
        const expiredFeatures = adsData.filter(ad => {
          if (!ad.isFeatured || !ad.featuredAt) return false;
          return (now - new Date(ad.featuredAt).getTime()) > sevenDaysMs;
        });

        expiredFeatures.forEach(async (ad) => {
          try {
            await updateDoc(doc(db, 'ads', ad.id), { isFeatured: false, featuredAt: null });
          } catch (e) {
            console.error("Failed to remove expired feature", e);
          }
        });
      }
    });
    
    return () => {
      window.removeEventListener('adminStatusChanged', handleAdminChange);
      unsubscribe();
    };
  }, []);

  const toggleFeature = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { 
        isFeatured: !currentStatus,
        featuredAt: !currentStatus ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error("Error updating ad", error);
    }
  };

  const confirmDelete = async () => {
    if (!adToDelete) return;
    try {
      await deleteDoc(doc(db, 'ads', adToDelete));
      setActionMessage({ type: 'success', text: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
      console.error("Error deleting ad", error);
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من الحذف' });
    }
    setAdToDelete(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProp = filterPropertyType === 'الكل' || ad.propertyType === filterPropertyType;
    const matchesTrans = filterTransactionType === 'الكل' || ad.transactionType === filterTransactionType;
    const matchesAct = filterActivityType === 'الكل' || ad.activityType === filterActivityType;
    return matchesSearch && matchesProp && matchesTrans && matchesAct;
  });

  const visibleAds = filteredAds.slice(0, visibleCount);

  return (
    <div className="flex flex-col">
      <div className="p-4">
        {/* Contact Banner */}
        <div className="bg-purple-900 text-white text-[10px] sm:text-xs py-2 px-3 rounded-xl flex justify-between items-center mb-4 shadow-sm">
          <span className="font-medium">تواصل مع مكتب عقارات المتخصص في مصانع اكتوبر</span>
          <a href="tel:01080379299" className="flex items-center gap-1 font-bold hover:text-purple-200 transition-colors bg-purple-800 px-2 py-1 rounded-lg">
            <Phone className="w-3 h-3" />
            <span dir="ltr">01080379299</span>
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="ابحث عن مصنع أو أرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-2.5 pr-10 pl-4 outline-none focus:ring-2 focus:ring-purple-800 transition-all text-sm font-medium"
          />
          <Search className="absolute right-3 top-2.5 text-gray-500 w-4 h-4" />
        </div>

        {/* Advanced Filters (Always Visible & Smaller) */}
        <div className="mb-5 space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {['الكل', 'مصنع', 'أرض'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterPropertyType(type)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-colors ${filterPropertyType === type ? 'bg-white text-purple-800 shadow-sm' : 'text-gray-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {['الكل', 'بيع', 'إيجار'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterTransactionType(type)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-colors ${filterTransactionType === type ? 'bg-white text-purple-800 shadow-sm' : 'text-gray-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={filterActivityType}
              onChange={(e) => setFilterActivityType(e.target.value)}
              className="flex-1 bg-gray-100 border-none rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-purple-800 outline-none"
            >
              <option value="الكل">كل الأنشطة</option>
              <option value="غذائي">غذائي</option>
              <option value="هندسي">هندسي</option>
              <option value="كيماوي">كيماوي</option>
              <option value="غزل ونسيج">غزل ونسيج</option>
              <option value="بلاستيك">بلاستيك</option>
              <option value="أخرى">أخرى</option>
            </select>

            {(filterPropertyType !== 'الكل' || filterTransactionType !== 'الكل' || filterActivityType !== 'الكل') && (
              <button 
                onClick={() => { 
                  setFilterPropertyType('الكل'); 
                  setFilterTransactionType('الكل'); 
                  setFilterActivityType('الكل'); 
                }}
                className="text-[10px] text-red-500 font-bold px-2 py-1.5 bg-red-50 rounded-lg whitespace-nowrap"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Ads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {visibleAds.map(ad => (
          <div key={ad.id} className={`border rounded-xl overflow-hidden flex flex-col relative ${ad.isFeatured ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200 bg-white'}`}>
            {isAdminMode && (
              <div className="absolute top-2 left-2 flex gap-1 z-20">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFeature(ad.id, !!ad.isFeatured);
                  }} 
                  className={`p-1.5 rounded-full shadow-sm ${ad.isFeatured ? 'bg-yellow-400 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Star className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAdToDelete(ad.id);
                  }} 
                  className="p-1.5 rounded-full bg-red-100 text-red-600 shadow-sm hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <Link to={`/ad/${ad.id}`} className="flex-1 flex flex-col">
              {/* Image Thumbnail */}
              <div className="h-20 w-full bg-gray-100 relative">
                {ad.image ? (
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <MapPin className="w-8 h-8 opacity-20" />
                  </div>
                )}
                {ad.isFeatured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    مميز
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  موثق
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                  {ad.transactionType}
                </div>
              </div>

              <div className="p-2 flex-1 flex flex-col">
                <h2 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{ad.title}</h2>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                  {ad.area && (
                    <div className="flex items-center gap-0.5">
                      <Maximize className="w-3 h-3" />
                      <span>{ad.area.toLocaleString('en-US')} م²</span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(ad.createdAt), { locale: ar })}</span>
                  </div>
                </div>

                <div className="text-purple-800 font-bold text-sm mt-auto">
                  {ad.price} <span className="text-xs">مليون ج.م</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {filteredAds.length === 0 && (
        <div className="text-center text-gray-500 py-10">لا توجد إعلانات مطابقة</div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredAds.length && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 10)}
          className="w-full mt-6 bg-white border-2 border-purple-800 text-purple-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
        >
          عرض المزيد
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {adToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors">
                نعم، احذف
              </button>
              <button onClick={() => setAdToDelete(null)} className="flex-1 bg-gray-100 text-gray-800 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Message Toast */}
      {actionMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold text-sm whitespace-nowrap transition-all ${actionMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {actionMessage.text}
        </div>
      )}
      </div>
    </div>
  );
}
