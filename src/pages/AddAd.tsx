import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AddAd({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    propertyType: 'مصنع',
    transactionType: 'بيع',
    activityType: 'غذائي',
    phone: '',
    whatsapp: ''
  });

  if (!user) {
    return <div className="p-8 text-center">يرجى تسجيل الدخول لإضافة إعلان</div>;
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedBase64 = await compressImage(e.target.files[0]);
        setImagePreview(compressedBase64);
      } catch (error) {
        console.error("Error compressing image", error);
        alert('حدث خطأ أثناء معالجة الصورة');
      }
    }
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || !isNaN(Number(rawValue))) {
      setFormData({...formData, area: rawValue});
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || (Number(val) >= 0 && Number(val) <= 999)) {
      setFormData({...formData, price: val});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.price || !formData.area) {
      alert('يرجى تعبئة الحقول الأساسية');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'ads'), {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        area: Number(formData.area),
        propertyType: formData.propertyType,
        transactionType: formData.transactionType,
        activityType: formData.activityType,
        location: '6 أكتوبر',
        authorId: user.uid,
        authorName: user.displayName || 'مستخدم',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString(),
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        isFeatured: false,
        image: imagePreview || null
      });
      navigate('/');
    } catch (error) {
      console.error("Error adding ad", error);
      alert('حدث خطأ أثناء إضافة الإعلان');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">إضافة إعلان جديد</h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">صورة الإعلان (اختياري)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden bg-white">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <ImageIcon className="w-8 h-8 text-purple-800" />
                </div>
                <span className="font-medium">اضغط هنا لإضافة صورة</span>
                <span className="text-xs mt-1 text-gray-400">سيتم ضغط الصورة تلقائياً</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الإعلان *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors"
              placeholder="مثال: مصنع 500 متر للبيع"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">النوع *</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="مصنع">مصنع</option>
                <option value="أرض">أرض</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المعاملة *</label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="بيع">بيع</option>
                <option value="إيجار">إيجار</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">نوع النشاط *</label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({...formData, activityType: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="غذائي">غذائي</option>
              <option value="هندسي">هندسي</option>
              <option value="كيماوي">كيماوي</option>
              <option value="غزل ونسيج">غزل ونسيج</option>
              <option value="بلاستيك">بلاستيك</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المساحة (م²) *</label>
              <input
                type="text"
                value={formData.area ? Number(formData.area).toLocaleString('en-US') : ''}
                onChange={handleAreaChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors"
                placeholder="مثال: 1,000"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">السعر (بالملايين) *</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price}
                  onChange={handlePriceChange}
                  max="999"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none bg-gray-50 focus:bg-white transition-colors text-left"
                  dir="ltr"
                  placeholder="مثال: 1.5"
                />
                <span className="absolute right-3 top-3 text-gray-500 text-sm pointer-events-none">مليون</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">المدينة</label>
            <input
              type="text"
              value="6 أكتوبر"
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">التفاصيل *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-800 outline-none h-32 bg-gray-50 focus:bg-white transition-colors resize-none"
              placeholder="اكتب تفاصيل المصنع، المساحة، المرافق..."
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none text-left bg-gray-50 focus:bg-white transition-colors"
              dir="ltr"
              placeholder="01xxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الواتساب</label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-800 outline-none text-left bg-gray-50 focus:bg-white transition-colors"
              dir="ltr"
              placeholder="201xxxxxxxxx"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-800 text-white font-bold py-3.5 rounded-xl mt-6 hover:bg-purple-900 transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري النشر...
            </>
          ) : 'نشر الإعلان'}
        </button>
      </form>
    </div>
  );
}
