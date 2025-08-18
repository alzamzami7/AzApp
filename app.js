import { auth, db } from './config.js';

// أدوار المستخدمين
const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// حالة التطبيق
const state = {
    currentUser: null,
    userRole: null,
    clients: [],
    transactions: [],
    currentClientId: null
};

// تهيئة التطبيق
function initApp() {
    setupEventListeners();
    checkAuthState();
    initDarkMode();
}

// التحقق من حالة المصادقة
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                handleUserAuth(user, userData);
            }
        } else {
            handleUserLogout();
        }
    });
}

// معالجة تسجيل الدخول
async function handleUserAuth(user, userData) {
    state.currentUser = user;
    state.userRole = userData.role;
    
    if (userData.approved !== true) {
        showMessage("حسابك قيد المراجعة", () => auth.signOut());
        return;
    }

    if (state.userRole === ROLES.ADMIN) {
        showAdminPanel();
    } else {
        showUserPanel();
    }
}

// معالجة تسجيل الخروج
function handleUserLogout() {
    state.currentUser = null;
    state.userRole = null;
    showScreen("login");
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    document.getElementById("logout-btn").addEventListener("click", confirmLogout);
    document.getElementById("toggle-dark-mode").addEventListener("click", toggleDarkMode);
    
    // باقي المستمعين للأحداث
}

// تأكيد تسجيل الخروج
function confirmLogout() {
    showConfirmModal("هل أنت متأكد من تسجيل الخروج؟", () => {
        auth.signOut();
    });
}

// تبديل الوضع الليلي
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDarkMode ? "on" : "off");
    updateDarkModeIcon(isDarkMode);
}

// تحديث أيقونة الوضع الليلي
function updateDarkModeIcon(isDarkMode) {
    const icon = document.getElementById("toggle-dark-mode").querySelector("i");
    icon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon";
}

// تهيئة الوضع الليلي
function initDarkMode() {
    if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark-mode");
        updateDarkModeIcon(true);
    }
}

// عرض لوحة المسؤول
async function showAdminPanel() {
    showScreen("admin");
    await fetchUsers();
    setupAdminEventListeners();
}

// عرض لوحة المستخدم
async function showUserPanel() {
    showScreen("user");
    await fetchClients();
    setupUserEventListeners();
}

// باقي الوظائف كما هي مع تحسينات في الأداء والأمان

// بدء التطبيق
document.addEventListener("DOMContentLoaded", initApp);
