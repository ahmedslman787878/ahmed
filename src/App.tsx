/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AlertCircle, Phone } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 pb-20 font-sans relative" dir="rtl">
        <Header user={user} />
        
        {/* Global Banner */}
        {banner?.isActive && banner.image && (
          <a 
            href="https://wa.me/201033667481"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mx-auto bg-white border-b border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src={banner.image} alt="إعلان" className="w-full h-20 sm:h-32 md:h-40 object-cover" />
          </a>
        )}

        <main className="w-full mx-auto bg-white min-h-screen shadow-sm">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/properties/:type/:action" element={<Home user={user} />} />
            <Route path="/properties/:type" element={<Home user={user} />} />
            <Route path="/ad/:id" element={<AdDetails user={user} />} />
            <Route path="/add" element={<AddAd user={user} />} />
            <Route path="/my-ads" element={<MyAds user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <BottomNav user={user} />

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/201080379299"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-4 bg-green-500 text-white p-3.5 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-105 z-50 flex items-center justify-center"
          aria-label="تواصل معنا عبر واتساب"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </a>
      </div>
    </BrowserRouter>
  );
}
