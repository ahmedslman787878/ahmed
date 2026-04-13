import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Search, Star, Trash2, User as UserIcon, Image as ImageIcon, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  
  // Banner State
  const [bannerImage, setBannerImage] = useState('');
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Ad Search State
  const [adSearchId, setAdSearchId] = useState('');
  const [searchedAd, setSearchedAd] = useState<any>(null);
  const [adSearchLoading, setAdSearchLoading] = useState(false);

  // User Search State
  const [userSearchId, setUserSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  // Modal & Toast state
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Seeding State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [isUpdatingPhones, setIsUpdatingPhones] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [isFixingRentPrices, setIsFixingRentPrices] = useState(false);

  const handleFixRentPrices = async () => {
    setIsFixingRentPrices(true);
    try {
      const q = query(collection(db, 'ads'), where('transactionType', '==', 'إيجار'));
      const snapshot = await getDocs(q);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // If price is less than 10, it's likely still in millions (e.g., 0.05). Convert to thousands.
        if (data.price < 10) {
          const newPrice = Math.round(data.price * 1000);
          await updateDoc(doc(db, 'ads', docSnap.id), { price: newPrice });
          count++;
        }
      }
      alert(`تم تحويل أسعار ${count} إعلان إيجار من الملايين إلى الآلاف بنجاح!`);
    } catch (error) {
      console.error("Error fixing rent prices:", error);
      alert('حدث خطأ أثناء تعديل أسعار الإيجار');
    } finally {
      setIsFixingRentPrices(false);
    }
  };
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [compressProgress, setCompressProgress] = useState('');

  const handleCompressExistingImages = async () => {
    if (!auth.currentUser) {
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً' });
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في ضغط جميع الصور القديمة؟ قد تستغرق هذه العملية بعض الوقت.')) return;

    setIsCompressingImages(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'ads'));
      const adsToProcess = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        // Only process if it has an image and it's a base64 string
        return data.image && data.image.startsWith('data:image');
      });

      let processed = 0;
      for (const docSnap of adsToProcess) {
        const data = docSnap.data();
        if (!data.image) continue;

        setCompressProgress(`جاري ضغط صورة ${processed + 1} من ${adsToProcess.length}...`);

        try {
          const compressedBase64 = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.src = data.image;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 500;
              const MAX_HEIGHT = 500;
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
              resolve(canvas.toDataURL('image/webp', 0.5));
            };
            img.onerror = reject;
          });

          // Only update if the new size is smaller
          if (compressedBase64.length < data.image.length) {
            await updateDoc(doc(db, 'ads', docSnap.id), { image: compressedBase64 });
          }
          processed++;
        } catch (err) {
          console.error("Failed to compress image for ad", docSnap.id, err);
        }
      }
      setActionMessage({ type: 'success', text: `تم الانتهاء! تم ضغط ${processed} صورة بنجاح.` });
    } catch (error) {
      console.error("Error compressing images:", error);
      setActionMessage({ type: 'error', text: 'حدث خطأ أثناء ضغط الصور' });
    } finally {
      setIsCompressingImages(false);
      setCompressProgress('');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleUpdateMockImages = async () => {
    setIsUpdatingImages(true);
    try {
      const q = query(collection(db, 'ads'), where('authorId', '==', 'admin'));
      const snapshot = await getDocs(q);
      const imageUrls = [
        'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1605280263929-1c4efa3d409b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1587293852726-694b602784ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580982327559-c1202864ee05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1531053326607-9d349096d887?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563213126-a4273aed2016?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ];
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.image) {
          const randomImage = imageUrls[Math.floor(Math.random() * imageUrls.length)];
          await updateDoc(doc(db, 'ads', docSnap.id), { image: randomImage });
          count++;
        }
      }
      alert(`تم تحديث صور ${count} إعلان بنجاح!`);
    } catch (error) {
      console.error("Error updating images:", error);
      alert('حدث خطأ أثناء تحديث الصور');
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const handleUpdatePhones = async () => {
    setIsUpdatingPhones(true);
    try {
      const q = query(collection(db, 'ads'));
      const snapshot = await getDocs(q);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'ads', docSnap.id), { 
          phone: '01080379299',
          whatsapp: '201080379299' // WhatsApp format usually requires country code
        });
        count++;
      }
      alert(`تم تحديث أرقام الهواتف لـ ${count} إعلان بنجاح!`);
    } catch (error) {
      console.error("Error updating phones:", error);
      alert('حدث خطأ أثناء تحديث أرقام الهواتف');
    } finally {
      setIsUpdatingPhones(false);
    }
  };

  const handleUpdatePrices = async () => {
    setIsUpdatingPrices(true);
    try {
      const q = query(collection(db, 'ads'));
      const snapshot = await getDocs(q);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.area) {
          let newPrice = data.price;
          if (data.transactionType === 'بيع') {
            newPrice = data.area * 0.03; // 30,000 per meter
          } else if (data.transactionType === 'إيجار') {
            newPrice = (data.area / 300) * 50; // 50,000 per 300 meters (in thousands)
            newPrice = Math.round(newPrice);
          }
          
          await updateDoc(doc(db, 'ads', docSnap.id), { 
            price: newPrice
          });
          count++;
        }
      }
      alert(`تم تحديث أسعار ${count} إعلان بنجاح لتتناسب مع المساحة (بيع وإيجار)!`);
    } catch (error) {
      console.error("Error updating prices:", error);
      alert('حدث خطأ أثناء تحديث الأسعار');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Fetch current banner
    const fetchBanner = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'banner'));
        if (docSnap.exists()) {
          setBannerImage(docSnap.data().image || '');
          setBannerActive(docSnap.data().isActive || false);
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      }
    };
    fetchBanner();

    // Auto-seed check
    const hasSeeded = localStorage.getItem('hasSeededAds');
    if (!hasSeeded) {
      handleSeedAds();
    }
  }, [isAdmin, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 800; // Reduced from 1200 to ensure it fits in Firestore 1MB limit
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Reduced quality from 0.7 to 0.5
        setBannerImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async () => {
    setBannerLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'banner'), {
        image: bannerImage,
        isActive: bannerActive
      }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist, or create if it doesn't
      alert('تم حفظ البنر بنجاح');
    } catch (error) {
      console.error("Error saving banner:", error);
      alert('حدث خطأ أثناء حفظ البنر: ' + (error as Error).message);
    } finally {
      setBannerLoading(false);
    }
  };

  const handleSearchAd = async () => {
    if (!adSearchId) return;
    setAdSearchLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'ads', adSearchId));
      if (docSnap.exists()) {
        setSearchedAd({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSearchedAd(null);
        alert('لم يتم العثور على إعلان بهذا المعرف');
      }
    } catch (error) {
      console.error("Error searching ad:", error);
    } finally {
      setAdSearchLoading(false);
    }
  };

  const handleToggleFeatureAd = async () => {
    if (!searchedAd) return;
    if (!auth.currentUser) {
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من التعديل' });
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }
    try {
      const newStatus = !searchedAd.isFeatured;
      await updateDoc(doc(db, 'ads', searchedAd.id), {
        isFeatured: newStatus,
        featuredAt: newStatus ? new Date().toISOString() : null
      });
      setSearchedAd({ ...searchedAd, isFeatured: newStatus, featuredAt: newStatus ? new Date().toISOString() : null });
      setActionMessage({ type: 'success', text: newStatus ? 'تم تمييز الإعلان بنجاح' : 'تم إلغاء تمييز الإعلان' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error("Error updating ad:", error);
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من التعديل' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const confirmDelete = async () => {
    if (!adToDelete) return;
    if (!auth.currentUser) {
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من الحذف' });
      setTimeout(() => setActionMessage(null), 4000);
      setAdToDelete(null);
      return;
    }
    try {
      await deleteDoc(doc(db, 'ads', adToDelete));
      setSearchedAd(null);
      setAdSearchId('');
      setActionMessage({ type: 'success', text: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
      console.error("Error deleting ad:", error);
      setActionMessage({ type: 'error', text: 'يجب تسجيل الدخول بحساب جوجل أولاً لتتمكن من الحذف' });
    }
    setAdToDelete(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSearchUser = async () => {
    if (!userSearchId) return;
    setUserSearchLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'users', userSearchId));
      if (docSnap.exists()) {
        setSearchedUser({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSearchedUser(null);
        alert('لم يتم العثور على مستخدم بهذا المعرف');
      }
    } catch (error) {
      console.error("Error searching user:", error);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSeedAds = async () => {
    setIsSeeding(true);
    try {
      const mockAds = [
        { title: 'مصنع غذائي مجهز بالكامل', description: 'مصنع غذائي للبيع بالمنطقة الصناعية الثالثة، مجهز بأحدث المعدات والماكينات. رخصة تشغيل سارية.', price: 30, area: 1000, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'غذائي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date().toISOString(), isFeatured: true, image: 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض صناعية مميزة', description: 'أرض صناعية للبيع في التوسعات الشمالية، موقع استراتيجي قريب من المحاور الرئيسية.', price: 60, area: 2000, propertyType: 'أرض', transactionType: 'بيع', activityType: 'أخرى', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 86400000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع هندسي للإيجار', description: 'مصنع هندسي للإيجار الشهري، مساحة ممتازة وتجهيزات كاملة للتشغيل الفوري.', price: 0.083, area: 500, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'هندسي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 172800000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع بلاستيك شغال للبيع', description: 'مصنع بلاستيك يعمل بكامل طاقته للبيع لظروف السفر. يشمل خطوط الإنتاج والعملاء.', price: 45, area: 1500, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'بلاستيك', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 259200000).toISOString(), isFeatured: true, image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض نشاط كيماوي', description: 'أرض مخصصة لنشاط كيماوي بالمنطقة الصناعية الرابعة. مساحة كبيرة وتسهيلات في الدفع.', price: 90, area: 3000, propertyType: 'أرض', transactionType: 'بيع', activityType: 'كيماوي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 345600000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع غزل ونسيج', description: 'مصنع غزل ونسيج للإيجار، مبنى إداري منفصل وعنابر إنتاج واسعة.', price: 0.2, area: 1200, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'غزل ونسيج', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 432000000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1605280263929-1c4efa3d409b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'هنجر صناعي للإيجار', description: 'هنجر صناعي يصلح لجميع الأغراض، ارتفاع 8 متر، أرضية هليكوبتر.', price: 0.067, area: 400, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'أخرى', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 518400000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1587293852726-694b602784ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض مساحة صغيرة للبيع', description: 'أرض صناعية مساحة 300 متر للبيع، فرصة للمشاريع الصغيرة والمتوسطة.', price: 9, area: 300, propertyType: 'أرض', transactionType: 'بيع', activityType: 'أخرى', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 604800000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع تعبئة وتغليف', description: 'مصنع تعبئة وتغليف غذائي للبيع، مجهز بالكامل ومطابق لمواصفات سلامة الغذاء.', price: 24, area: 800, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'غذائي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 691200000).toISOString(), isFeatured: true, image: 'https://images.unsplash.com/photo-1580982327559-c1202864ee05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض نشاط هندسي', description: 'أرض مخصصة لنشاط هندسي، موقع متميز على ناصية شارعين.', price: 75, area: 2500, propertyType: 'أرض', transactionType: 'بيع', activityType: 'هندسي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 777600000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع كيماويات للإيجار', description: 'مصنع كيماويات للإيجار، مجهز بخزانات وأنظمة أمان متكاملة.', price: 0.167, area: 1000, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'كيماوي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 864000000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع ملابس جاهزة', description: 'مصنع ملابس جاهزة للبيع، يشمل ماكينات الخياطة والقص والكي.', price: 18, area: 600, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'غزل ونسيج', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 950400000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض صناعية كبيرة', description: 'أرض مساحة 10000 متر للبيع، تصلح لمجمع صناعي متكامل.', price: 300, area: 10000, propertyType: 'أرض', transactionType: 'بيع', activityType: 'أخرى', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1036800000).toISOString(), isFeatured: true, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع حقن بلاستيك', description: 'مصنع حقن بلاستيك للإيجار، يشمل 5 ماكينات حقن ومبردات.', price: 0.133, area: 800, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'بلاستيك', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1123200000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1531053326607-9d349096d887?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع أدوية للبيع', description: 'مصنع أدوية مرخص للبيع، غرف معقمة (Clean Rooms) وتجهيزات قياسية.', price: 60, area: 2000, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'كيماوي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1209600000).toISOString(), isFeatured: true, image: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض نشاط غذائي', description: 'أرض مخصصة لنشاط غذائي، قريبة من مصادر المياه والكهرباء الرئيسية.', price: 120, area: 4000, propertyType: 'أرض', transactionType: 'بيع', activityType: 'غذائي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1296000000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'ورشة هندسية للإيجار', description: 'ورشة هندسية مساحة صغيرة للإيجار، تصلح لأعمال الخراطة واللحام.', price: 0.033, area: 200, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'هندسي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1382400000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع تدوير بلاستيك', description: 'مصنع تدوير بلاستيك للبيع، خط غسيل وتخريز كامل.', price: 30, area: 1000, propertyType: 'مصنع', transactionType: 'بيع', activityType: 'بلاستيك', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1468800000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'أرض مخازن', description: 'أرض تصلح لإنشاء مخازن لوجستية، موقع ممتاز بالقرب من الطريق الدائري الإقليمي.', price: 150, area: 5000, propertyType: 'أرض', transactionType: 'بيع', activityType: 'أخرى', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1555200000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
        { title: 'مصنع أثاث للإيجار', description: 'مصنع أثاث خشبي للإيجار، مجهز بماكينات النجارة الأساسية.', price: 0.1, area: 600, propertyType: 'مصنع', transactionType: 'إيجار', activityType: 'هندسي', location: '6 أكتوبر', authorId: 'admin', authorName: 'الإدارة', createdAt: new Date(Date.now() - 1641600000).toISOString(), isFeatured: false, image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', phone: '01080379299', whatsapp: '201080379299' },
      ];

      for (const ad of mockAds) {
        await addDoc(collection(db, 'ads'), ad);
      }
      
      localStorage.setItem('hasSeededAds', 'true');
      alert('تم جلب 20 إعلان وإضافتها بنجاح!');
    } catch (error) {
      console.error("Error seeding ads:", error);
      alert('حدث خطأ أثناء جلب الإعلانات');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center gap-2 mb-6 text-purple-900">
        <ShieldAlert className="w-8 h-8" />
        <h1 className="text-2xl font-black">لوحة التحكم</h1>
      </div>

      {/* Banner Management */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-800" />
          إدارة البنر الإعلاني
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">صورة البنر</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 mb-3"
            />
            {bannerImage && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={bannerImage} alt="Banner Preview" className="w-full h-auto object-cover max-h-40" />
                <button 
                  onClick={() => setBannerImage('')}
                  className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bannerActive"
              checked={bannerActive}
              onChange={(e) => setBannerActive(e.target.checked)}
              className="w-5 h-5 text-purple-800 rounded focus:ring-purple-800"
            />
            <label htmlFor="bannerActive" className="font-bold text-gray-700">تفعيل البنر</label>
          </div>
          <button
            onClick={handleSaveBanner}
            disabled={bannerLoading}
            className="w-full bg-purple-800 text-white font-bold py-2.5 rounded-xl hover:bg-purple-900 transition-colors flex items-center justify-center gap-2"
          >
            {bannerLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ البنر'}
          </button>
        </div>
      </div>

      {/* Ad Management by ID */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-800" />
          البحث عن إعلان (ID)
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={adSearchId}
            onChange={(e) => setAdSearchId(e.target.value)}
            placeholder="أدخل ID الإعلان..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-800 outline-none"
            dir="ltr"
          />
          <button
            onClick={handleSearchAd}
            disabled={adSearchLoading || !adSearchId}
            className="bg-purple-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-900 transition-colors"
          >
            {adSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بحث'}
          </button>
        </div>

        {searchedAd && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <h3 className="font-bold text-gray-900 mb-1">{searchedAd.title}</h3>
            <p className="text-sm text-gray-500 mb-3">ID: {searchedAd.id}</p>
            <div className="flex gap-2">
              <button
                onClick={handleToggleFeatureAd}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${searchedAd.isFeatured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                <Star className="w-4 h-4" />
                {searchedAd.isFeatured ? 'إلغاء التمييز' : 'تمييز الإعلان'}
              </button>
              <button
                onClick={() => setAdToDelete(searchedAd.id)}
                className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Management by ID */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-purple-800" />
          البحث عن مستخدم (ID)
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={userSearchId}
            onChange={(e) => setUserSearchId(e.target.value)}
            placeholder="أدخل ID المستخدم..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-800 outline-none"
            dir="ltr"
          />
          <button
            onClick={handleSearchUser}
            disabled={userSearchLoading || !userSearchId}
            className="bg-purple-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-900 transition-colors"
          >
            {userSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بحث'}
          </button>
        </div>

        {searchedUser && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center gap-4">
            {searchedUser.photoURL ? (
              <img src={searchedUser.photoURL} alt={searchedUser.displayName} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-800">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{searchedUser.displayName}</h3>
              <p className="text-xs text-gray-500">{searchedUser.email}</p>
              <p className="text-xs text-gray-400 mt-1" dir="ltr">ID: {searchedUser.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Auto Seed Button */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">جلب إعلانات تلقائي</h2>
        <p className="text-sm text-gray-500 mb-4">جلب 20 إعلان من مواقع أخرى وإضافتها فوراً (تم التنفيذ تلقائياً مرة واحدة).</p>
        <button
          onClick={handleSeedAds}
          disabled={isSeeding}
          className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'جلب 20 إعلان الآن'}
        </button>
        
        <button
          onClick={handleUpdateMockImages}
          disabled={isUpdatingImages}
          className="w-full bg-purple-100 text-purple-800 font-bold py-3 rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {isUpdatingImages ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تحديث صور الإعلانات الموجودة'}
        </button>

        <button
          onClick={handleUpdatePhones}
          disabled={isUpdatingPhones}
          className="w-full bg-green-100 text-green-800 font-bold py-3 rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {isUpdatingPhones ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تحديث أرقام الهواتف لجميع الإعلانات'}
        </button>

        <button
          onClick={handleUpdatePrices}
          disabled={isUpdatingPrices}
          className="w-full bg-blue-100 text-blue-800 font-bold py-3 rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {isUpdatingPrices ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تحديث الأسعار حسب المساحة (بيع وإيجار)'}
        </button>

        <button
          onClick={handleFixRentPrices}
          disabled={isFixingRentPrices}
          className="w-full bg-orange-100 text-orange-800 font-bold py-3 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {isFixingRentPrices ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تحويل أسعار الإيجار الحالية من مليون إلى ألف'}
        </button>

        <button
          onClick={handleCompressExistingImages}
          disabled={isCompressingImages}
          className="w-full bg-yellow-100 text-yellow-800 font-bold py-3 rounded-xl hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
        >
          {isCompressingImages ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {compressProgress || 'جاري الضغط...'}
            </>
          ) : 'ضغط وتحسين صور الإعلانات القديمة (WebP)'}
        </button>
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
  );
}
