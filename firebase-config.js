// Firebase configuration
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
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firestore
  const db = firebase.firestore();
  // Improve connectivity in embedded webviews (e.g., Telegram) by using long polling
  try {
    db.settings({ experimentalAutoDetectLongPolling: true });
  } catch (e) {
    // ignore if settings already applied or unsupported
  }
  
  // Initialize Auth
  const auth = firebase.auth();
  
  // Make available globally
  window.firebase = firebase;
  window.db = db;
  window.auth = auth;
