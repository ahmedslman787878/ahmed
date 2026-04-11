/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AlertCircle } from 'lucide-react';
import Home from './pages/Home';
import AdDetails from './pages/AdDetails';
import AddAd from './pages/AddAd';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [banner, setBanner] = useState<{image: string, isActive: boolean} | null>(null);

  useEffect(() => {
    // Fetch Banner
    const fetchBanner = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'banner'));
        if (docSnap.exists()) {
          setBanner(docSnap.data() as {image: string, isActive: boolean});
        }
      } catch (error) {
        console.error("Error fetching banner", error);
      }
    };
    fetchBanner();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'مستخدم',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20 font-sans" dir="rtl">
        <Header user={user} />
        
        {/* Global Banner */}
        {banner?.isActive && banner.image && (
          <a 
            href="https://wa.me/201080379299"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-md mx-auto bg-white border-b border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src={banner.image} alt="إعلان" className="w-full h-20 object-cover" />
          </a>
        )}

        <main className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/ad/:id" element={<AdDetails user={user} />} />
            <Route path="/add" element={<AddAd user={user} />} />
            <Route path="/my-ads" element={<MyAds user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <BottomNav user={user} />
      </div>
    </BrowserRouter>
  );
}
