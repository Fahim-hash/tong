// app/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBNSOFRQCtq9MlanH4-l4QgTwCotHdq0n8",
  authDomain: "tong-75462.firebaseapp.com",
  projectId: "tong-75462",
  storageBucket: "tong-75462.firebasestorage.app",
  messagingSenderId: "730086123445",
  appId: "1:730086123445:web:35aa30eba442aa363c9bfc"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
