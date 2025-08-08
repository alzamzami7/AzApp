import React, { useState, useEffect, useCallback } from 'https://cdn.skypack.dev/react@17.0.2';
import ReactDOM from 'https://cdn.skypack.dev/react-dom@17.0.2';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCJaDmcFayuU1b4fOP14KKQHN12jrjJxD8",
  authDomain: "azapp-8b4a0.firebaseapp.com",
  projectId: "azapp-8b4a0",
  storageBucket: "azapp-8b4a0.firebasestorage.app",
  messagingSenderId: "279004422830",
  appId: "1:279004422830:web:432cc4bd1d60c3cbb3033f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Modal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
      <p className="text-gray-800 text-lg mb-4">{message}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
      >
        حسناً
      </button>
    </div>
  </div>
);
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
      <p className="text-gray-800 text-lg mb-4">{message}</p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
        >
          تأكيد
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
        >
          إلغاء
        </button>
      </div>
    </div>
  </div>
);
const AboutModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm transform transition-all scale-100 opacity-100 text-center">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">عن التطبيق</h3>
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
          هذا التطبيق تم تصميمه وتطويره بواسطة:
          <br />
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xl">عبدالله الزمزمي</span>
        </p>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
const AddCustomerModal = ({ show, onClose, onAddCustomer, newCustomerName, setNewCustomerName, initialDebtAmount, setInitialDebtAmount, initialDebtDescription, setInitialDebtDescription, isSubmitting }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100 opacity-100">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">إضافة عميل جديد</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="modalCustomerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العميل</label>
            <input
              type="text"
              id="modalCustomerName"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-base"
              placeholder="أدخل اسم العميل"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="modalInitialDebtAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ الدين المبدئي (اختياري)</label>
            <input
              type="number"
              id="modalInitialDebtAmount"
              value={initialDebtAmount}
              onChange={(e) => setInitialDebtAmount(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-base"
              placeholder="أدخل مبلغ الدين المبدئي"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="modalInitialDebtDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف الدين المبدئي (اختياري)</label>
            <textarea
              id="modalInitialDebtDescription"
              value={initialDebtDescription}
              onChange={(e) => setInitialDebtDescription(e.target.value)}
              rows="2"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-base resize-none"
              placeholder="مثال: دين مبدئي عند التسجيل"
              disabled={isSubmitting}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              onClick={onAddCustomer}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const EditCustomerNameModal = ({ show, onClose, onSave, currentName, setEditedName, isSubmitting }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100 opacity-100">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">تعديل اسم العميل</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="editCustomerNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الجديد</label>
            <input
              type="text"
              id="editCustomerNameInput"
              value={currentName}
              onChange={(e) => setEditedName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 text-base"
              placeholder="أدخل الاسم الجديد للعميل"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              onClick={onSave}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const AuthScreen = ({ onLogin, onRegister, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(email, password);
    } else {
      onLogin(email, password);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4" dir="rtl">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 text-lg"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isRegistering ? 'جاري التسجيل...' : 'جاري الدخول...') : (isRegistering ? 'تسجيل جديد' : 'تسجيل الدخول')}
          </button>
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 text-blue-600 hover:text-blue-800 text-md underline transition duration-200"
          disabled={isSubmitting}
        >
          {isRegistering ? 'لدي حساب بالفعل؟ تسجيل الدخول' : 'ليس لدي حساب؟ إنشاء حساب'}
        </button>
      </div>
    </div>
  );
};
const AdminPanel = ({ db, userId, showInfoModal, setView, isSubmitting, setIsSubmitting }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  useEffect(() => {
    if (!db || !userId) return;
    const usersCollectionRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(usersList.filter(user => !user.approved && !user.isAdmin));
      setApprovedUsers(usersList.filter(user => user.approved || user.isAdmin));
    }, (error) => {
      console.error("Error fetching users for admin panel:", error);
      showInfoModal(`خطأ في جلب المستخدمين: ${error.message}`);
    });
    return () => unsubscribe();
  }, [db, userId, showInfoModal]);
  const handleApproveUser = async (userToApproveId, userEmail) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', userToApproveId), {
        approved: true,
        approvedBy: userId,
        approvedAt: serverTimestamp()
      });
      showInfoModal(`تمت الموافقة على المستخدم ${userEmail} بنجاح.`);
    } catch (error) {
      console.error("Error approving user:", error);
      showInfoModal(`خطأ في الموافقة على المستخدم: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div dir="rtl" className="p-4 flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <button onClick={() => setView('main')} className="text-gray-600 hover:text-gray-800 transition duration-200" disabled={isSubmitting}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">لوحة تحكم المدير</h2>
          <div></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">المستخدمون بانتظار الموافقة ({pendingUsers.length})</h3>
        {pendingUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">لا يوجد مستخدمون بانتظار الموافقة.</p>
        ) : (
          <ul className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
            {pendingUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg shadow-sm border border-yellow-100">
                <span className="text-gray-800 font-medium">{user.email}</span>
                <button
                  onClick={() => handleApproveUser(user.id, user.email)}
                  className={`bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الموافقة...' : 'موافقة'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-xl font-semibold text-gray-700 mb-4 mt-6 border-t pt-4">المستخدمون الموافق عليهم ({approvedUsers.length})</h3>
        {approvedUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">لا يوجد مستخدمون موافق عليهم.</p>
        ) : (
          <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {approvedUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-100">
                <span className="text-gray-800 font-medium">{user.email} {user.isAdmin && <span className="text-purple-600 font-semibold">(مدير)</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
const MainInterface = ({
  newCustomerName, setNewCustomerName,
  newPurchaseDetails, setNewPurchaseDetails,
  newPurchaseValue, setNewPurchaseValue,
  newNotes, setNewNotes,
  newTransactionType, setNewTransactionType,
  handleAddTransaction,
  setView,
  userId,
  showInfoModal,
  isSubmitting,
  customers,
  setShowAboutModal,
  isAdmin,
  handleSignOut
}) => (
  <div dir="rtl" className="p-4 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">تسجيل معاملة جديدة</h2>
      <div className="mb-4">
        <label htmlFor="customerName" className="block text-gray-700 text-sm font-semibold mb-2">اسم العميل:</label>
        <input
          type="text"
          id="customerName"
          className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          value={newCustomerName}
          onChange={(e) => setNewCustomerName(e.target.value)}
          placeholder="أدخل اسم العميل"
          list="customer-names"
          disabled={isSubmitting}
        />
        <datalist id="customer-names">
          {customers.map(customer => (
            <option key={customer.id} value={customer.name} />
          ))}
        </datalist>
      </div>
      <div className="mb-4">
        <label htmlFor="purchaseDetails" className="block text-gray-700 text-sm font-semibold mb-2">التفاصيل:</label>
        <textarea
          id="purchaseDetails"
          className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 h-20 resize-none"
          value={newPurchaseDetails}
          onChange={(e) => setNewPurchaseDetails(e.target.value)}
          placeholder="مثال: 2 كجم أرز، 1 لتر زيت"
          disabled={isSubmitting}
        ></textarea>
      </div>
      <div className="mb-4">
        <label htmlFor="purchaseValue" className="block text-gray-700 text-sm font-semibold mb-2">القيمة:</label>
        <input
          type="number"
          id="purchaseValue"
          className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          value={newPurchaseValue}
          onChange={(e) => setNewPurchaseValue(e.target.value)}
          placeholder="مثال: 50.75"
          disabled={isSubmitting}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-semibold mb-2">نوع المعاملة:</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600 h-4 w-4"
              name="transactionType"
              value="purchase"
              checked={newTransactionType === 'purchase'}
              onChange={() => setNewTransactionType('purchase')}
              disabled={isSubmitting}
            />
            <span className="ml-2 text-gray-700">شراء (إضافة دين)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-green-600 h-4 w-4"
              name="transactionType"
              value="payment"
              checked={newTransactionType === 'payment'}
              onChange={() => setNewTransactionType('payment')}
              disabled={isSubmitting}
            />
            <span className="ml-2 text-gray-700">دفع (خصم من الدين)</span>
          </label>
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="notes" className="block text-gray-700 text-sm font-semibold mb-2">ملاحظات (اختياري):</label>
        <input
          type="text"
          id="notes"
          className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          placeholder="أضف أي ملاحظات إضافية"
          disabled={isSubmitting}
        />
      </div>
      <button
        onClick={() => handleAddTransaction()}
        className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال المعاملة'}
      </button>
      <button
        onClick={() => setView('customerList')}
        className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-md"
        disabled={isSubmitting}
      >
        قائمة العملاء
      </button>
      {isAdmin && (
        <button
          onClick={() => setView('adminPanel')}
          className="w-full mt-4 bg-purple-200 hover:bg-purple-300 text-purple-800 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-md"
          disabled={isSubmitting}
        >
          لوحة تحكم المدير
        </button>
      )}
    </div>
    {userId && (
      <div className="mt-6 text-center text-gray-600 text-sm">
        معرف المستخدم الخاص بك: <span className="font-mono text-gray-800">{userId}</span>
      </div>
    )}
    <button
      onClick={() => setShowAboutModal(true)}
      className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline transition duration-200"
      disabled={isSubmitting}
    >
      عن التطبيق والمصمم
    </button>
    <button
      onClick={handleSignOut}
      className="mt-2 text-red-500 hover:text-red-700 text-sm underline transition duration-200"
      disabled={isSubmitting}
    >
      تسجيل الخروج
    </button>
  </div>
);
const CustomerListInterface = ({
  setView,
  searchTerm, setSearchTerm,
  customers,
  handleSelectCustomer,
  handleDeleteCustomer,
  showInfoModal,
  setShowAddCustomerModal,
  isSubmitting
}) => (
  <div dir="rtl" className="p-4 flex flex-col items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <button onClick={() => setView('main')} className="text-gray-600 hover:text-gray-800 transition duration-200" disabled={isSubmitting}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800">العملاء</h2>
        <button
          onClick={() => setShowAddCustomerModal(true)}
          className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          إضافة عميل
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          placeholder="ابحث عن عميل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      {customers.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا يوجد عملاء مسجلين أو لا توجد نتائج للبحث.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="flex items-center justify-between bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:bg-blue-50 transition duration-200 cursor-pointer"
              onClick={() => handleSelectCustomer(customer)}
            >
              <span className="text-base sm:text-lg font-medium text-gray-800">{customer.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                className="p-1 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-200"
                title="حذف العميل"
                disabled={isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
const CustomerDetailInterface = ({
  setView,
  selectedCustomer,
  filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate,
  filteredTransactions,
  editingTransactionId, setEditingTransactionId,
  editPurchaseDetails, setEditPurchaseDetails,
  editPurchaseValue, setEditPurchaseValue,
  startEditingTransaction, saveEditedTransaction, handleDeleteTransaction,
  calculateTotalDebt,
  handleExport,
  newPurchaseDetails, setNewPurchaseDetails,
  newPurchaseValue, setNewPurchaseValue,
  newTransactionType, setNewTransactionType,
  handleAddTransaction,
  showInfoModal,
  setShowEditCustomerNameModal,
  isSubmitting
}) => (
  <div dir="rtl" className="p-4 flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-50 to-green-100">
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <button onClick={() => setView('customerList')} className="text-gray-600 hover:text-gray-800 transition duration-200" disabled={isSubmitting}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer?.name || 'العميل'}</h2>
        <button
          onClick={() => setShowEditCustomerNameModal(true)}
          className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          تعديل الاسم
        </button>
      </div>
      <div className="mb-4 p-3 bg-gray-50 rounded-lg shadow-inner">
        <label className="block text-gray-700 text-sm font-semibold mb-2">تصفية حسب التاريخ:</label>
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <input
            type="date"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            title="من تاريخ"
            disabled={isSubmitting}
          />
          <input
            type="date"
            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            title="إلى تاريخ"
            disabled={isSubmitting}
          />
        </div>
      </div>
      {filteredTransactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد معاملات لهذا العميل أو لا توجد نتائج للتصفية.</p>
      ) : (
        <div className="flex flex-col space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`p-4 rounded-lg shadow-sm border relative ${
                transaction.type === 'payment' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'
              }`}
            >
              {editingTransactionId === transaction.id ? (
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={editPurchaseDetails}
                    onChange={(e) => setEditPurchaseDetails(e.target.value)}
                    placeholder="تفاصيل المشتريات"
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={editPurchaseValue}
                    onChange={(e) => setEditPurchaseValue(e.target.value)}
                    placeholder="القيمة"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => saveEditedTransaction(transaction.id)}
                      className={`bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => setEditingTransactionId(null)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-bold py-2 px-3 rounded-lg transition duration-200"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800 font-semibold">{transaction.details}</p>
                  <p className={`font-bold text-lg mt-1 ${transaction.type === 'payment' ? 'text-green-700' : 'text-red-700'}`}>
                    {transaction.type === 'payment' ? 'دفع: ' : 'دين: '} {transaction.value?.toFixed(2)}
                  </p>
                  {transaction.notes && <p className="text-gray-600 text-sm mt-1">ملاحظات: {transaction.notes}</p>}
                  <p className="text-gray-500 text-xs mt-2">
                    {transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleString('ar-EG') : 'جارٍ التحميل...'}
                  </p>
                  <div className="absolute top-2 left-2 flex space-x-1 rtl:space-x-reverse">
                    <button
                      onClick={() => startEditingTransaction(transaction)}
                      className="p-1 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition duration-200"
                      title="تعديل"
                      disabled={isSubmitting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-200"
                      title="حذف"
                      disabled={isSubmitting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-col space-y-3">
        <div className="text-center text-2xl font-bold">
          <span className="text-gray-700">إجمالي الدين: </span>
          <span className={`
            ${calculateTotalDebt() > 0 ? 'text-red-700' : ''}
            ${calculateTotalDebt() < 0 ? 'text-green-700' : ''}
            ${calculateTotalDebt() === 0 ? 'text-gray-500' : ''}
          `}>
            {calculateTotalDebt()?.toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleExport}
          className={`w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition duration-300 ease-in-out shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          تصدير إلى CSV
        </button>
      </div>
    </div>
  </div>
);
const App = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('auth');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPurchaseDetails, setNewPurchaseDetails] = useState('');
  const [newPurchaseValue, setNewPurchaseValue] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newTransactionType, setNewTransactionType] = useState('purchase');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerNameModal, setShowEditCustomerNameModal] = useState(false);
  const [editedCustomerName, setEditedCustomerName] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editPurchaseDetails, setEditPurchaseDetails] = useState('');
  const [editPurchaseValue, setEditPurchaseValue] = useState('');
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
          if (!userDocSnapshot.empty) {
            const userData = userDocSnapshot.docs[0].data();
            setIsApproved(userData.approved);
            setIsAdmin(userData.isAdmin);
            if (userData.approved) {
              setView('main');
            } else {
              setInfoModalMessage('حسابك قيد المراجعة. سيتم إشعارك عند الموافقة عليه.');
              setShowInfoModal(true);
            }
          } else {
            setInfoModalMessage('بيانات المستخدم غير موجودة. يرجى التواصل مع الدعم.');
            setShowInfoModal(true);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setInfoModalMessage(`خطأ في جلب بيانات المستخدم: ${error.message}`);
          setShowInfoModal(true);
        }
      } else {
        setUser(null);
        setUserId(null);
        setIsApproved(false);
        setIsAdmin(false);
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (user && isApproved) {
      const unsubscribe = onSnapshot(collection(db, `users/${userId}/customers`), (snapshot) => {
        const customersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersList);
      }, (error) => {
        console.error("Error fetching customers:", error);
        setInfoModalMessage(`خطأ في جلب بيانات العملاء: ${error.message}`);
        setShowInfoModal(true);
      });
      return () => unsubscribe();
    }
  }, [user, isApproved, userId]);
  useEffect(() => {
    if (user && selectedCustomer) {
      const unsubscribe = onSnapshot(collection(db, `users/${userId}/customers/${selectedCustomer.id}/transactions`), (snapshot) => {
        const transactionsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp
        }));
        transactionsList.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(transactionsList);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setInfoModalMessage(`خطأ في جلب بيانات المعاملات: ${error.message}`);
        setShowInfoModal(true);
      });
      return () => unsubscribe();
    }
  }, [user, userId, selectedCustomer]);
  useEffect(() => {
    let tempTransactions = [...transactions];
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      tempTransactions = tempTransactions.filter(t => t.timestamp && t.timestamp.toDate() >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setDate(end.getDate() + 1);
      tempTransactions = tempTransactions.filter(t => t.timestamp && t.timestamp.toDate() < end);
    }
    setFilteredTransactions(tempTransactions);
  }, [transactions, filterStartDate, filterEndDate]);
  const handleLogin = async (email, password) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setInfoModalMessage('تم تسجيل الدخول بنجاح!');
      setShowInfoModal(true);
    } catch (error) {
      console.error("Error logging in:", error);
      setInfoModalMessage(`خطأ في تسجيل الدخول: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRegister = async (email, password) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: email,
        isAdmin: false,
        approved: false,
        createdAt: serverTimestamp()
      });
      setInfoModalMessage('تم إنشاء الحساب بنجاح. يرجى الانتظار حتى يوافق المدير على حسابك.');
      setShowInfoModal(true);
      await signOut(auth);
    } catch (error) {
      console.error("Error registering:", error);
      setInfoModalMessage(`خطأ في إنشاء الحساب: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await signOut(auth);
      setInfoModalMessage('تم تسجيل الخروج بنجاح!');
      setShowInfoModal(true);
    } catch (error) {
      console.error("Error signing out:", error);
      setInfoModalMessage(`خطأ في تسجيل الخروج: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAddTransaction = useCallback(async () => {
    if (isSubmitting) return;
    if (!newCustomerName || !newPurchaseValue) {
      setInfoModalMessage('يرجى إدخال اسم العميل والقيمة.');
      setShowInfoModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const customerDocRef = doc(db, `users/${userId}/customers/${newCustomerName}`);
      const transactionCollectionRef = collection(db, `users/${userId}/customers/${newCustomerName}/transactions`);
      const newTransaction = {
        details: newPurchaseDetails,
        value: parseFloat(newPurchaseValue),
        type: newTransactionType,
        notes: newNotes,
        timestamp: serverTimestamp()
      };
      const customersRef = collection(db, `users/${userId}/customers`);
      const q = query(customersRef, where('name', '==', newCustomerName));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const newCustomerDocRef = doc(customersRef);
        await setDoc(newCustomerDocRef, {
          name: newCustomerName,
          createdAt: serverTimestamp()
        });
        await addDoc(collection(newCustomerDocRef, 'transactions'), newTransaction);
        setSelectedCustomer({ id: newCustomerDocRef.id, name: newCustomerName });
      } else {
        const existingCustomerDocRef = querySnapshot.docs[0].ref;
        await addDoc(collection(existingCustomerDocRef, 'transactions'), newTransaction);
        setSelectedCustomer({ id: existingCustomerDocRef.id, name: newCustomerName });
      }
      setInfoModalMessage('تم تسجيل المعاملة بنجاح!');
      setShowInfoModal(true);
      setNewCustomerName('');
      setNewPurchaseDetails('');
      setNewPurchaseValue('');
      setNewNotes('');
      setNewTransactionType('purchase');
    } catch (error) {
      console.error("Error adding transaction:", error);
      setInfoModalMessage(`خطأ في إضافة المعاملة: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [newCustomerName, newPurchaseValue, newPurchaseDetails, newNotes, newTransactionType, userId, db, isSubmitting]);
  const handleAddCustomer = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const customersRef = collection(db, `users/${userId}/customers`);
    const newCustomerName = document.getElementById('modalCustomerName').value;
    const initialDebtAmount = parseFloat(document.getElementById('modalInitialDebtAmount').value) || 0;
    const initialDebtDescription = document.getElementById('modalInitialDebtDescription').value || '';
    if (!newCustomerName) {
      setInfoModalMessage('يرجى إدخال اسم العميل.');
      setShowInfoModal(true);
      setIsSubmitting(false);
      return;
    }
    try {
      const q = query(customersRef, where('name', '==', newCustomerName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setInfoModalMessage('هذا العميل موجود بالفعل.');
        setShowInfoModal(true);
        return;
      }
      const newCustomerDocRef = await addDoc(customersRef, {
        name: newCustomerName,
        createdAt: serverTimestamp()
      });
      if (initialDebtAmount > 0) {
        const initialTransaction = {
          details: initialDebtDescription || 'دين مبدئي',
          value: initialDebtAmount,
          type: 'purchase',
          timestamp: serverTimestamp()
        };
        await addDoc(collection(newCustomerDocRef, 'transactions'), initialTransaction);
      }
      setInfoModalMessage('تم إضافة العميل بنجاح!');
      setShowInfoModal(true);
      setShowAddCustomerModal(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      setInfoModalMessage(`خطأ في إضافة العميل: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCustomer = (customerId) => {
    setConfirmModalMessage('هل أنت متأكد من حذف هذا العميل وجميع معاملاته؟');
    setShowConfirmModal(true);
    setOnConfirmAction(async () => {
      setIsSubmitting(true);
      try {
        const transactionsRef = collection(db, `users/${userId}/customers/${customerId}/transactions`);
        const transactionsSnapshot = await getDocs(transactionsRef);
        const deletePromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        const customerDocRef = doc(db, `users/${userId}/customers`, customerId);
        await deleteDoc(customerDocRef);
        setInfoModalMessage('تم حذف العميل بنجاح.');
        setShowInfoModal(true);
      } catch (error) {
        console.error("Error deleting customer:", error);
        setInfoModalMessage(`خطأ في حذف العميل: ${error.message}`);
        setShowInfoModal(true);
      } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
      }
    });
  };
  const handleDeleteTransaction = (transactionId) => {
    setConfirmModalMessage('هل أنت متأكد من حذف هذه المعاملة؟');
    setShowConfirmModal(true);
    setOnConfirmAction(async () => {
      setIsSubmitting(true);
      try {
        const transactionDocRef = doc(db, `users/${userId}/customers/${selectedCustomer.id}/transactions`, transactionId);
        await deleteDoc(transactionDocRef);
        setInfoModalMessage('تم حذف المعاملة بنجاح.');
        setShowInfoModal(true);
      } catch (error) {
        console.error("Error deleting transaction:", error);
        setInfoModalMessage(`خطأ في حذف المعاملة: ${error.message}`);
        setShowInfoModal(true);
      } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
      }
    });
  };
  const startEditingTransaction = (transaction) => {
    setEditingTransactionId(transaction.id);
    setEditPurchaseDetails(transaction.details);
    setEditPurchaseValue(transaction.value);
  };
  const saveEditedTransaction = async (transactionId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const transactionDocRef = doc(db, `users/${userId}/customers/${selectedCustomer.id}/transactions`, transactionId);
      await updateDoc(transactionDocRef, {
        details: editPurchaseDetails,
        value: parseFloat(editPurchaseValue),
      });
      setInfoModalMessage('تم تعديل المعاملة بنجاح.');
      setShowInfoModal(true);
      setEditingTransactionId(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setInfoModalMessage(`خطأ في تعديل المعاملة: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEditCustomerName = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!editedCustomerName) {
      setInfoModalMessage('لا يمكن أن يكون اسم العميل فارغاً.');
      setShowInfoModal(true);
      setIsSubmitting(false);
      return;
    }
    try {
      const customerDocRef = doc(db, `users/${userId}/customers`, selectedCustomer.id);
      await updateDoc(customerDocRef, {
        name: editedCustomerName,
      });
      setInfoModalMessage('تم تعديل اسم العميل بنجاح.');
      setShowInfoModal(true);
      setShowEditCustomerNameModal(false);
    } catch (error) {
      console.error("Error updating customer name:", error);
      setInfoModalMessage(`خطأ في تعديل اسم العميل: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const calculateTotalDebt = () => {
    return transactions.reduce((total, transaction) => {
      const value = transaction.value;
      if (transaction.type === 'purchase') {
        return total + value;
      } else if (transaction.type === 'payment') {
        return total - value;
      }
      return total;
    }, 0);
  };
  const handleExport = () => {
    const header = ['التاريخ', 'التفاصيل', 'القيمة', 'النوع', 'الملاحظات'].join(',');
    const rows = filteredTransactions.map(t => {
      const date = t.timestamp ? new Date(t.timestamp.toDate()).toLocaleString('ar-EG') : '';
      const details = `"${t.details.replace(/"/g, '""')}"`;
      const value = t.value?.toFixed(2);
      const type = t.type === 'purchase' ? 'شراء' : 'دفع';
      const notes = `"${t.notes?.replace(/"/g, '""') || ''}"`;
      return [date, details, value, type, notes].join(',');
    });
    const csvContent = `${header}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${selectedCustomer.name}-transactions.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setInfoModalMessage('تم تصدير المعاملات بنجاح!');
    setShowInfoModal(true);
  };
  switch (view) {
    case 'auth':
      return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} isSubmitting={isSubmitting} />;
    case 'main':
      return (
        <MainInterface
          newCustomerName={newCustomerName} setNewCustomerName={setNewCustomerName}
          newPurchaseDetails={newPurchaseDetails} setNewPurchaseDetails={setNewPurchaseDetails}
          newPurchaseValue={newPurchaseValue} setNewPurchaseValue={setNewPurchaseValue}
          newNotes={newNotes} setNewNotes={setNewNotes}
          newTransactionType={newTransactionType} setNewTransactionType={setNewTransactionType}
          handleAddTransaction={handleAddTransaction}
          setView={setView}
          userId={userId}
          showInfoModal={setShowInfoModal}
          isSubmitting={isSubmitting}
          customers={customers}
          setShowAboutModal={setShowAboutModal}
          isAdmin={isAdmin}
          handleSignOut={handleSignOut}
        />
      );
    case 'customerList':
      const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return (
        <>
          {showAddCustomerModal && (
            <AddCustomerModal
              show={showAddCustomerModal}
              onClose={() => setShowAddCustomerModal(false)}
              onAddCustomer={handleAddCustomer}
              isSubmitting={isSubmitting}
            />
          )}
          <CustomerListInterface
            setView={setView}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            customers={filteredCustomers}
            handleSelectCustomer={(customer) => {
              setSelectedCustomer(customer);
              setFilterStartDate('');
              setFilterEndDate('');
              setView('customerDetail');
            }}
            handleDeleteCustomer={handleDeleteCustomer}
            showInfoModal={showInfoModal}
            setShowAddCustomerModal={setShowAddCustomerModal}
            isSubmitting={isSubmitting}
          />
        </>
      );
    case 'customerDetail':
      return (
        <>
          {showEditCustomerNameModal && (
            <EditCustomerNameModal
              show={showEditCustomerNameModal}
              onClose={() => setShowEditCustomerNameModal(false)}
              onSave={handleEditCustomerName}
              currentName={editedCustomerName}
              setEditedName={setEditedCustomerName}
              isSubmitting={isSubmitting}
            />
          )}
          <CustomerDetailInterface
            setView={setView}
            selectedCustomer={selectedCustomer}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            filteredTransactions={filteredTransactions}
            editingTransactionId={editingTransactionId}
            setEditingTransactionId={setEditingTransactionId}
            editPurchaseDetails={editPurchaseDetails}
            setEditPurchaseDetails={setEditPurchaseDetails}
            editPurchaseValue={editPurchaseValue}
            setEditPurchaseValue={setEditPurchaseValue}
            startEditingTransaction={startEditingTransaction}
            saveEditedTransaction={saveEditedTransaction}
            handleDeleteTransaction={handleDeleteTransaction}
            calculateTotalDebt={calculateTotalDebt}
            handleExport={handleExport}
            newPurchaseDetails={newPurchaseDetails}
            setNewPurchaseDetails={setNewPurchaseDetails}
            newPurchaseValue={newPurchaseValue}
            setNewPurchaseValue={setNewPurchaseValue}
            newTransactionType={newTransactionType}
            setNewTransactionType={setNewTransactionType}
            handleAddTransaction={handleAddTransaction}
            showInfoModal={showInfoModal}
            setShowEditCustomerNameModal={setShowEditCustomerNameModal}
            isSubmitting={isSubmitting}
          />
        </>
      );
    case 'adminPanel':
      return <AdminPanel db={db} userId={userId} showInfoModal={setInfoModalMessage} setView={setView} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />;
    default:
      return null;
  }
};
ReactDOM.render( /*#__PURE__*/React.createElement(App, null), document.getElementById('root'));
