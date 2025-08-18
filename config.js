// التكوين الآمن لـ Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAGdh40AO3JvX1WQ3IfMFgSoDzTixmnCCA",
    authDomain: "azapp-61227.firebaseapp.com",
    projectId: "azapp-61227",
    storageBucket: "azapp-61227.appspot.com",
    messagingSenderId: "1023006420463",
    appId: "1:1023006420463:web:0e3b09aed5473efd381a1a"
};

// تهيئة Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// إعدادات الأداء
const firestoreSettings = { /* cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED */ };
db.settings(firestoreSettings);

// تصدير الكائنات للاستخدام في ملف app.js
export { auth, db };
