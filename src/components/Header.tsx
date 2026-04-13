import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Shield, Settings } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logOut } from '../firebase';

export default function Header({ user }: { user: User | null }) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAdminChange = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('adminStatusChanged', handleAdminChange);
    return () => window.removeEventListener('adminStatusChanged', handleAdminChange);
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === '787878') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      window.dispatchEvent(new Event('adminStatusChanged'));
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    window.dispatchEvent(new Event('adminStatusChanged'));
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-purple-800 px-4 py-3 flex items-center justify-between w-full mx-auto shadow-md rounded-b-2xl">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 bg-white text-purple-900 px-3 py-1.5 rounded-lg font-black text-lg shadow-sm border-2 border-yellow-400 hover:bg-gray-50 transition-colors">
            <img src="https://i.ibb.co/LzXf9n7/logo.png" alt="مصانع 6 أكتوبر" className="h-7 w-auto object-contain" />
            <span className="hidden sm:inline">مصانع 6 اكتوبر</span>
            <span className="sm:hidden text-base">مصانع 6 اكتوبر</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Link to="/admin" className="p-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
              <button onClick={handleAdminLogout} className="text-xs bg-red-500 text-white px-2 py-1.5 rounded font-bold flex items-center gap-1">
                خروج الإدارة
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAdminModal(true)} className="text-xs bg-purple-700 text-white px-2 py-1.5 rounded font-bold flex items-center gap-1 hover:bg-purple-600 transition-colors">
              <Shield className="w-3 h-3" />
              الإدارة
            </button>
          )}

          {user ? (
            <button onClick={logOut} className="text-sm font-medium text-purple-100 hover:text-white flex items-center gap-1">
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          ) : (
            <button onClick={signInWithGoogle} className="text-sm font-medium text-purple-100 hover:text-white flex items-center gap-1">
              <LogIn className="w-4 h-4" />
              دخول
            </button>
          )}
        </div>
      </header>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-800" />
              تسجيل دخول الإدارة
            </h3>
            <input
              type="password"
              placeholder="كلمة المرور"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-purple-800 outline-none text-left"
              dir="ltr"
            />
            <div className="flex gap-2">
              <button onClick={handleAdminLogin} className="flex-1 bg-purple-800 text-white py-2 rounded-lg font-bold">
                دخول
              </button>
              <button onClick={() => setShowAdminModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
