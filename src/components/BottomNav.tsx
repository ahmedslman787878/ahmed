import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User as UserIcon, List } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle } from '../firebase';

export default function BottomNav({ user }: { user: User | null }) {
  const location = useLocation();

  const handleAuthClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      signInWithGoogle();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-purple-800 pb-safe w-full mx-auto z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="flex justify-between items-center h-16 px-2">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${(location.pathname === '/' || location.pathname.startsWith('/properties')) ? 'text-yellow-400' : 'text-purple-200 hover:text-white'}`}>
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">الرئيسية</span>
        </Link>
        
        <Link 
          to="/my-ads" 
          onClick={handleAuthClick}
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/my-ads' ? 'text-yellow-400' : 'text-purple-200 hover:text-white'}`}
        >
          <List className="w-6 h-6" />
          <span className="text-xs mt-1">إعلاناتي</span>
        </Link>

        <Link 
          to="/add" 
          onClick={handleAuthClick}
          className="flex flex-col items-center justify-center w-full h-full relative -top-5"
        >
          <div className="bg-yellow-400 text-purple-900 rounded-full p-3 shadow-lg border-4 border-purple-800">
            <PlusCircle className="w-8 h-8" />
          </div>
          <span className="text-xs mt-1 text-white font-medium">إضافة</span>
        </Link>

        {user ? (
          <Link 
            to="/profile"
            className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/profile' ? 'text-yellow-400' : 'text-purple-200 hover:text-white'}`}
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs mt-1">حسابي</span>
          </Link>
        ) : (
          <button 
            onClick={() => signInWithGoogle()}
            className="flex flex-col items-center justify-center w-full h-full text-purple-200 hover:text-white"
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs mt-1">دخول</span>
          </button>
        )}
      </div>
    </nav>
  );
}
