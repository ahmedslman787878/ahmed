import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { logOut } from '../firebase';
import { LogOut, User as UserIcon, Mail, Calendar, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Profile({ user }: { user: User | null }) {
  const [copied, setCopied] = useState(false);

  if (!user) {
    return <div className="p-8 text-center text-gray-500">يرجى تسجيل الدخول لعرض حسابك</div>;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">حسابي</h1>
      
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 right-0 h-24 bg-purple-800 opacity-10"></div>
        
        <div className="relative z-10">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-md object-cover" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white text-purple-800 flex items-center justify-center mx-auto mb-4 border-4 border-purple-100 shadow-md text-3xl font-bold">
              {user.displayName?.charAt(0) || <UserIcon className="w-10 h-10" />}
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.displayName}</h2>
          
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{user.email}</span>
          </div>
          
          {user.metadata.creationTime && (
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                عضو منذ {format(new Date(user.metadata.creationTime), 'MMMM yyyy', { locale: ar })}
              </span>
            </div>
          )}

          {/* User ID Section */}
          <div className="bg-gray-50 rounded-xl p-3 mb-8 border border-gray-200 flex items-center justify-between text-right">
            <div className="text-sm font-bold text-gray-700">معرف الحساب (ID)</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono" dir="ltr">{user.uid}</span>
              <button 
                onClick={handleCopyId}
                className="p-1.5 bg-white rounded-md text-gray-600 hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                title="نسخ المعرف"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button 
            onClick={logOut} 
            className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
