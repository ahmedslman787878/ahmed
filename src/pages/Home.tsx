import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  const { type, action } = useParams<{ type?: string, action?: string }>();
  const navigate = useNavigate();

  const typeMapToAr: Record<string, string> = {
    'factory': 'مصنع',
    'land': 'أرض',
  };

  const actionMapToAr: Record<string, string> = {
    'sale': 'بيع',
    'rent': 'إيجار',
  };

  const typeMapToEn: Record<string, string> = {
    'مصنع': 'factory',
    'أرض': 'land',
  };

  const actionMapToEn: Record<string, string> = {
    'بيع': 'sale',
    'إيجار': 'rent',
  };

  const [ads, setAds] = useState<Ad[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(localStorage.getItem('isAdmin') === 'true');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState(typeMapToAr[type || ''] || 'الكل');
  const [filterTransactionType, setFilterTransactionType] = useState(actionMapToAr[action || ''] || 'الكل');
  const [filterActivityType, setFilterActivityType] = useState('الكل');

  useEffect(() => {
    setFilterPropertyType(typeMapToAr[type || ''] || 'الكل');
    setFilterTransactionType(actionMapToAr[action || ''] || 'الكل');
  }, [type, action]);

  const updateUrl = (newArType: string, newArAction: string) => {
    const tEn = typeMapToEn[newArType] || 'all';
    const aEn = actionMapToEn[newArAction] || 'all';
    if (tEn === 'all' && aEn === 'all') {
      navigate('/');
    } else if (aEn === 'all') {
      navigate(`/properties/${tEn}`);
    } else {
      navigate(`/properties/${tEn}/${aEn}`);
    }
  };
  
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
      setActionMessage({ type: 'success', text: !currentStatus ? 'تم تمييز الإعلان بنجاح' : 'تم إلغاء تمييز الإعلان' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error("Error updating ad", error);
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من التعديل' });
      setTimeout(() => setActionMessage(null), 4000);
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

  // Generate dynamic metadata
  useEffect(() => {
    let newTitle = '';
    
    let titleProp = 'مصانع وأراضي صناعية';
    if (filterPropertyType === 'مصنع') titleProp = 'مصانع';
    else if (filterPropertyType === 'أرض') titleProp = 'أراضي صناعية';

    let titleTrans = 'للاستثمار';
    if (filterTransactionType === 'بيع') titleTrans = 'للبيع';
    else if (filterTransactionType === 'إيجار') titleTrans = 'للإيجار';

    // Exact mapping for the home page (no filters) to match the exact requested title
    if (filterPropertyType === 'الكل' && filterTransactionType === 'الكل') {
      newTitle = 'مصانع للبيع في 6 أكتوبر | أراضي صناعية ومخازن للاستثمار';
    } else {
      newTitle = `${titleProp} ${titleTrans} في 6 أكتوبر | ومخازن للاستثمار`;
    }
    
    document.title = newTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      if (filterPropertyType === 'الكل' && filterTransactionType === 'الكل') {
        metaDescription.setAttribute('content', `نقدم خدمات متكاملة للمستثمرين في مدينة 6 أكتوبر: بيع وشراء المصانع، أراضي صناعية جاهزة للتراخيص، ومخازن للإيجار في المنطقة الصناعية السادسة وامتداد المنطقة الصناعية الثالثة. بوابتك للاستثمار الصناعي الناجح. تواصل معنا الآن: 01080379299`);
      } else {
        metaDescription.setAttribute('content', `اكتشف أفضل فرص الاستثمار العقاري الصناعي. متوفر حالياً ${filteredAds.length} عرض مميز لـ ${titleProp} ${titleTrans} في المنطقة الصناعية السادسة وامتداد المنطقة الصناعية الثالثة بمدينة 6 أكتوبر. تواصل معنا الآن: 01080379299`);
      }
    }

    // Dynamic canonical URL to prevent duplicate content warnings from Google
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    // Include search parameters so that parameterized URLs sent in sitemap can be fully indexed by Google
    canonicalTag.setAttribute('href', window.location.origin + window.location.pathname + window.location.search);

  }, [filterPropertyType, filterTransactionType, filteredAds.length]);

  const visibleAds = filteredAds.slice(0, visibleCount);

  return (
    <div className="flex flex-col">
      <div className="p-4">
        {/* SEO Main Heading H1 */}
        <h1 className="text-xl font-bold text-gray-900 mb-4 px-1 leading-snug">
          مصانع للبيع في 6 أكتوبر وأراضي صناعية للاستثمار
        </h1>

        {/* Contact Banner */}
        <div className="relative rounded-xl overflow-hidden mb-4 p-[2px]">
          <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_160deg,#fbbf24_180deg,transparent_180deg_340deg,#fbbf24_360deg)]"></div>
          <div className="relative bg-purple-900 text-white text-[10px] sm:text-xs py-2 px-3 rounded-xl flex justify-between items-center shadow-sm h-full">
            <span className="font-medium">تواصل مع مكتب عقارات المتخصص في مصانع اكتوبر</span>
            <a href="tel:01080379299" className="flex items-center gap-1 font-bold hover:text-purple-200 transition-colors bg-purple-800 px-2 py-1 rounded-lg z-10">
              <Phone className="w-3 h-3" />
              <span dir="ltr">01080379299</span>
            </a>
          </div>
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
              <div className="flex bg-purple-50 rounded-lg p-1 border border-purple-100">
                {['الكل', 'مصنع', 'أرض'].map(type => (
                  <button
                    key={type}
                    onClick={() => updateUrl(type, filterTransactionType)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${filterPropertyType === type ? 'bg-purple-800 text-white shadow-md transform scale-[1.02]' : 'text-purple-700 hover:bg-purple-100'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex bg-purple-50 rounded-lg p-1 border border-purple-100">
                {['الكل', 'بيع', 'إيجار'].map(type => (
                  <button
                    key={type}
                    onClick={() => updateUrl(filterPropertyType, type)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${filterTransactionType === type ? 'bg-purple-800 text-white shadow-md transform scale-[1.02]' : 'text-purple-700 hover:bg-purple-100'}`}
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
              className="flex-1 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-800 outline-none transition-colors"
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
                  setFilterActivityType('الكل'); 
                  navigate('/');
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
                    if (!user) {
                      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل (زر دخول بالأسفل) لتتمكن من التعديل' });
                      setTimeout(() => setActionMessage(null), 4000);
                      return;
                    }
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
                    if (!user) {
                      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل (زر دخول بالأسفل) لتتمكن من الحذف' });
                      setTimeout(() => setActionMessage(null), 4000);
                      return;
                    }
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
                  <img src={ad.image} alt={`${ad.propertyType} ${ad.transactionType} في ${ad.location} - ${ad.title}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
                  {ad.price} <span className="text-xs">{ad.transactionType === 'إيجار' ? 'ألف ج.م' : 'مليون ج.م'}</span>
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

      {/* SEO Text Block */}
      <div className="mt-12 mb-6 bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
        <h1 className="text-xl font-black text-purple-900 mb-4 leading-tight">
          مصانع للبيع في 6 أكتوبر وأراضي صناعية للاستثمار
        </h1>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            إذا كنت تبحث عن <strong>مصانع للبيع في 6 أكتوبر</strong> أو <strong>أراضي صناعية للبيع 6 أكتوبر</strong>، فأنت في المكان الصحيح. نوفر لك أفضل <strong>فرص استثمار عقاري صناعي في مدينة 6 أكتوبر</strong>. سواء كنت تبحث عن <strong>مصانع للايجار في اكتوبر</strong> أو <strong>مخازن للبيع في 6اكتوبر</strong>، لدينا خيارات تناسب جميع الأنشطة.
          </p>
          <p>
            كما يتوفر لدينا <strong>في 6 اكتوبر مخازن للايجار</strong> بمساحات متعددة، وعروض مميزة مثل <strong>مصنع غذائي للبيع في المنطقة الصناعية السادسة</strong>. نساعدك في معرفة <strong>سعر المتر الصناعي في 6 أكتوبر 2026</strong> بدقة، ونوفر لك <strong>مصانع جاهزة للتراخيص في أكتوبر</strong> لتبدأ إنتاجك فوراً.
          </p>
          <p>
            نقدم خدمات متكاملة لأصحاب المصانع والمستثمرين تشمل استشارات <strong>تراخيص مصانع 6 أكتوبر</strong>، وخدمات <strong>مقاولات بناء مصانع في أكتوبر</strong>، بالإضافة إلى تخليص أوراق <strong>هيئة التنمية الصناعية 6 أكتوبر</strong>. استثمر الآن في أفضل <strong>أراضي استثمار صناعي في الجيزة</strong>.
          </p>
        </div>
      </div>

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
