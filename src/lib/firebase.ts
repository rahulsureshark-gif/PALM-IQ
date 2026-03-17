import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA03GKgPw5ixLXiYB2Ei_xx0IeThXub4Hw",
  authDomain: "palm-iq-2004.firebaseapp.com",
  projectId: "palm-iq-2004",
  storageBucket: "palm-iq-2004.firebasestorage.app",
  messagingSenderId: "53336310332",
  appId: "1:53336310332:web:c08cf2343678dd55a33939",
  measurementId: "G-LY6F67TMKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (only in browser and if supported)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
