// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // ← ДОБАВИТЬ ЭТУ СТРОКУ!

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_V2gK9Af-Ib1kOU-0fbCMmG6Nn9fWIZw",
  authDomain: "kosmetolog-de6c1.firebaseapp.com",
  projectId: "kosmetolog-de6c1",
  storageBucket: "kosmetolog-de6c1.firebasestorage.app",
  messagingSenderId: "478127236524",
  appId: "1:478127236524:web:c156c1c3a43351b5560609",
  measurementId: "G-WR1ZH25S73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // ← ДОБАВИТЬ ЭТУ СТРОКУ!

// Экспортируем для использования в других файлах
export { app, db };
