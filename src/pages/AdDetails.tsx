import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Clock, Home, BadgeCheck, Phone, MessageCircle, Tag, ArrowRight, Star, Maximize, Briefcase, Copy, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User } from 'firebase/auth';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  propertyType: string;
  transactionType: string;
  activityType: string;
  location: string;
  createdAt: string;
  authorName: string;
  authorPhoto: string;
  phone?: string;
  whatsapp?: string;
  image?: string;
}

export default function AdDetails({ user }: { user: User | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'ads', id), (docSnap) => {
      if (docSnap.exists()) {
        setAd({ id: docSnap.id, ...docSnap.data() } as Ad);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const handleCopyId = () => {
    if (ad?.id) {
      navigator.clipboard.writeText(ad.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!ad) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 truncate flex-1">تفاصيل الإعلان</h1>
      </div>

      {ad.image ? (
        <div className="w-full h-64 bg-gray-100 relative">
          <img src={ad.image} alt={ad.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-purple-800 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {ad.transactionType}
          </div>
        </div>
      ) : (
        <div className="w-full h-48 bg-purple-50 flex items-center justify-center relative">
          <MapPin className="w-16 h-16 text-purple-200" />
          <div className="absolute top-4 left-4 bg-purple-800 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {ad.transactionType}
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-1 text-xs text-purple-800 bg-purple-50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true, locale: ar })}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-800 bg-purple-50 px-2 py-1 rounded-md">
            <MapPin className="w-3 h-3" />
            <span>{ad.location}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{ad.title}</h1>
        
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <Home className="w-4 h-4 text-purple-800" />
          <span>{ad.propertyType || 'مصنع'} - {ad.transactionType || 'بيع'}</span>
        </div>

        <div className="inline-block bg-purple-800 text-white font-bold text-xl px-4 py-2 rounded-lg mb-6 shadow-sm">
          {ad.price} <span className="text-sm">مليون ج.م</span>
        </div>

        {/* Properties Grid */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-purple-800 shadow-sm">
              <Maximize className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">المساحة</div>
              <div className="font-bold text-gray-900">{ad.area ? ad.area.toLocaleString('en-US') : '---'} م²</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-purple-800 shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">النشاط</div>
              <div className="font-bold text-gray-900">{ad.activityType || 'غير محدد'}</div>
            </div>
          </div>
        </div>

        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-8 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
          {ad.description}
        </div>

        {/* Ad ID Section */}
        <div className="mb-6 bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-800" />
            <span className="text-sm font-bold text-purple-900">رقم الإعلان (ID)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-mono" dir="ltr">{ad.id}</span>
            <button 
              onClick={handleCopyId}
              className="p-1.5 bg-white rounded-md text-purple-800 hover:bg-purple-100 transition-colors shadow-sm"
              title="نسخ المعرف"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Seller Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="text-purple-800 text-sm font-bold flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              عرض الملف
            </Link>
            <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
              البائع
              <Home className="w-5 h-5" />
            </h3>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
            <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
              {ad.authorPhoto ? (
                <img src={ad.authorPhoto} alt={ad.authorName} loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-2xl text-purple-800 font-bold">{ad.authorName.charAt(0)}</div>
              )}
            </div>
            
            <div className="text-right flex-1 mr-4">
              <div className="flex items-center justify-end gap-1 mb-1">
                <BadgeCheck className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-lg">{ad.authorName}</span>
              </div>
              <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
                <span>0.0 | 0 التقييمات</span>
                <div className="flex text-yellow-400">
                  <Star className="w-3 h-3" />
                  <Star className="w-3 h-3" />
                  <Star className="w-3 h-3" />
                  <Star className="w-3 h-3" />
                  <Star className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 max-w-md mx-auto z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => ad.phone && window.open(`tel:${ad.phone}`)}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-purple-800 text-purple-800 rounded-xl py-3 font-bold hover:bg-purple-50 transition-colors"
        >
          <Phone className="w-5 h-5" />
          اتصال هاتفي
        </button>
        <button 
          onClick={() => ad.whatsapp && window.open(`https://wa.me/${ad.whatsapp}`)}
          className="flex-[1.5] flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-bold hover:bg-green-600 transition-colors shadow-md"
        >
          <MessageCircle className="w-5 h-5" />
          دردشة واتساب
        </button>
      </div>
    </div>
  );
}
