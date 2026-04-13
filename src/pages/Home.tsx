import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Trash2, Filter, ChevronDown, Maximize, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    const handleAdminChange = () => setIsAdminMode(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('adminStatusChanged', handleAdminChange);
    
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ad[];
      setAds(adsData);
    });
    
    return () => {
      window.removeEventListener('adminStatusChanged', handleAdminChange);
      unsubscribe();
    };
  }, []);

  const toggleFeature = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !currentStatus });
    } catch (error) {
      console.error("Error updating ad", error);
    }
  };

  const deleteAd = async (adId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      try {
        await deleteDoc(doc(db, 'ads', adId));
      } catch (error) {
        console.error("Error deleting ad", error);
      }
    }
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
      <div className="grid grid-cols-2 gap-3">
        {visibleAds.map(ad => (
          <div key={ad.id} className={`border rounded-xl overflow-hidden flex flex-col relative ${ad.isFeatured ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200 bg-white'}`}>
            {isAdminMode && (
              <div className="absolute top-2 left-2 flex gap-1 z-10">
                <button onClick={() => toggleFeature(ad.id, !!ad.isFeatured)} className={`p-1.5 rounded-full shadow-sm ${ad.isFeatured ? 'bg-yellow-400 text-white' : 'bg-white text-gray-600'}`}>
                  <Star className="w-3 h-3" />
                </button>
                <button onClick={() => deleteAd(ad.id)} className="p-1.5 rounded-full bg-red-100 text-red-600 shadow-sm">
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
      </div>
    </div>
  );
}
