import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBhd-WdSzkOOsk3cd_0TrFA428IBrCzOzY",
  authDomain: "mckay-fbar.firebaseapp.com",
  projectId: "mckay-fbar",
  storageBucket: "mckay-fbar.firebasestorage.app",
  messagingSenderId: "511917520877",
  appId: "1:511917520877:web:79e396b41f5760d56a99e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);