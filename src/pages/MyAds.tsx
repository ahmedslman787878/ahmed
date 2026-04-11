import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User } from 'firebase/auth';

interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  createdAt: string;
  image?: string;
}

export default function MyAds({ user }: { user: User | null }) {
  const [ads, setAds] = useState<Ad[]>([]);

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

  const deleteAd = async (adId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      try {
        await deleteDoc(doc(db, 'ads', adId));
      } catch (error) {
        console.error("Error deleting ad", error);
      }
    }
  };

  if (!user) {
    return <div className="p-8 text-center text-gray-500">يرجى تسجيل الدخول لعرض إعلاناتك</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">إعلاناتي</h1>
      
      <div className="grid grid-cols-2 gap-3">
        {ads.map(ad => (
          <div key={ad.id} className="border border-gray-200 bg-white rounded-xl overflow-hidden flex flex-col relative">
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <button onClick={() => deleteAd(ad.id)} className="p-1.5 rounded-full bg-red-100 text-red-600 shadow-sm">
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
                  {ad.price} <span className="text-xs">مليون ج.م</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {ads.length === 0 && (
        <div className="text-center text-gray-500 py-10">لا توجد إعلانات خاصة بك حتى الآن</div>
      )}
    </div>
  );
}
