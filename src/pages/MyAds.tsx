import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Trash2, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User } from 'firebase/auth';

interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  transactionType?: string;
  createdAt: string;
  image?: string;
}

export default function MyAds({ user }: { user: User | null }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'ads'),
      where('authorId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ad[];
      
      adsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAds(adsData);
    });
    
    return () => unsubscribe();
  }, [user]);

  const confirmDelete = async () => {
    if (!adToDelete) return;
    try {
      await deleteDoc(doc(db, 'ads', adToDelete));
      setActionMessage({ type: 'success', text: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
      console.error("Error deleting ad", error);
      setActionMessage({ type: 'error', text: 'حدث خطأ أثناء الحذف' });
    }
    setAdToDelete(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  if (!user) {
    return <div className="p-8 text-center text-gray-500">يرجى تسجيل الدخول لعرض إعلاناتك</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-900">إعلاناتي</h1>
        <a 
          href="https://wa.me/201080379299" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-yellow-400 text-purple-900 text-[10px] sm:text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 hover:bg-yellow-500 transition-colors"
        >
          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-purple-900" />
          اضغط هنا لعمل إعلان مميز لمدة 7 أيام
        </a>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {ads.map(ad => (
          <div key={ad.id} className="border border-gray-200 bg-white rounded-xl overflow-hidden flex flex-col relative">
            <div className="absolute top-2 left-2 flex gap-1 z-20">
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
            
            <Link to={`/ad/${ad.id}`} className="flex-1 flex flex-col">
              <div className="h-28 bg-gray-100 relative">
                {ad.image ? (
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <MapPin className="w-8 h-8 opacity-20" />
                  </div>
                )}
              </div>

              <div className="p-2 flex-1 flex flex-col">
                <h2 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{ad.title}</h2>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 mt-auto">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(ad.createdAt), { locale: ar })}</span>
                </div>
                <div className="text-purple-800 font-bold text-sm">
                  {ad.price} <span className="text-xs">{ad.transactionType === 'إيجار' ? 'ألف ج.م' : 'مليون ج.م'}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {ads.length === 0 && (
        <div className="text-center text-gray-500 py-10">لا توجد إعلانات خاصة بك حتى الآن</div>
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
  );
}
