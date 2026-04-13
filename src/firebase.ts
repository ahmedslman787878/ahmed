import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User cancelled the login, ignore the error
      return;
    }
    if (error.code === 'auth/unauthorized-domain') {
      alert("عذراً، هذا الرابط (النطاق) غير مصرح له بتسجيل الدخول. يجب إضافته في إعدادات Firebase (Authorized domains).");
      return;
    }
    if (error.code === 'auth/network-request-failed') {
      alert("فشل الاتصال بالإنترنت أو تم حظر نافذة تسجيل الدخول. يرجى التأكد من اتصالك بالإنترنت وإيقاف أي إضافات لحظر الإعلانات (AdBlocker) والمحاولة مرة أخرى.");
      return;
    }
    console.error("Error signing in with Google", error);
    alert("حدث خطأ أثناء تسجيل الدخول: " + (error.message || "يرجى المحاولة مرة أخرى."));
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
