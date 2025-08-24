// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC_V2gK9Af-Ib1kOU-0fbCMmG6Nn9fWIZw",
    authDomain: "kosmetolog-de6c1.firebaseapp.com",
    projectId: "kosmetolog-de6c1",
    storageBucket: "kosmetolog-de6c1.firebasestorage.app",
    messagingSenderId: "478127236524",
    appId: "1:478127236524:web:c156c1c3a43351b5560609",
    measurementId: "G-WR1ZH25S73"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Получение ссылок на базы данных
const db = firebase.firestore();
const auth = firebase.auth();

// Экспорт для использования в других файлах
window.db = db;
window.auth = auth;
