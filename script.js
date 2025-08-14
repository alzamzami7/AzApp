
// ===== Theme toggle (Light/Dark) =====
(function(){
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function applyTheme(t){
    if(!t){ return; }
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('az-theme', t); } catch(e){}
    if(btn){ btn.textContent = (t === 'dark') ? 'الوضع الفاتح' : 'الوضع الليلي'; }
  }

  function init(){
    let saved = null;
    try { saved = localStorage.getItem('az-theme'); } catch(e){}
    if(!saved){
      // fall back to system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      saved = prefersDark ? 'dark' : 'light';
    }
    applyTheme(saved);
    if(btn){
      btn.addEventListener('click', ()=>{
        const current = root.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAGdh40AO3JvX1WQ3IfMFgSoDzTixmnCCA",
    authDomain: "azapp-61227.firebaseapp.com",
    projectId: "azapp-61227",
    storageBucket: "azapp-61227.firebasestorage.app",
    messagingSenderId: "1023006420463",
    appId: "1:1023006420463:web:0e3b09aed5473efd381a1a"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // All your JavaScript logic goes here...
  const screens = {
    login: document.getElementById("login-screen"),
    register: document.getElementById("register-screen"),
    user: document.getElementById("user-screen"),
    clients: document.getElementById("clients-screen"),
    clientDetails: document.getElementById("client-details-screen"),
    admin: document.getElementById("admin-screen")
  };
  const modals = {
    confirm: document.getElementById("confirm-modal"),
    message: document.getElementById("message-modal"),
    editTransaction: document.getElementById("edit-transaction-modal"),
    addClient: document.getElementById("add-client-modal"),
    editClientName: document.getElementById("edit-client-name-modal"),
    addTransactionClient: document.getElementById("add-transaction-client-modal"),
    about: document.getElementById("about-modal"),
    userDetails: document.getElementById("user-details-modal"),
    setExpiry: document.getElementById("set-expiry-modal")
  };
  let currentClientId = null;
  let currentUser = null;
  let clientsData = [];
  let userRole = null;
  let allUsersData = []; // Store all users for filtering and stats
  let unsubscribeTransactions = null;

  function showScreen(screenName) {
    document.querySelector('main').classList.remove('home-active', 'clients-active', 'client-details-active');
    Object.values(screens).forEach(screen => screen.classList.remove("active"));
    screens[screenName].classList.add("active");
    const header = document.getElementById("app-header");
    if (screenName === 'user' || screenName === 'admin') {
      header.classList.remove("hidden");
    } else {
      header.classList.add("hidden");
    }
  }

  function updateHeader(loggedIn, screenName) {
      const header = document.getElementById("app-header");
      if (loggedIn && (screenName === 'user' || screenName === 'admin')) {
          header.classList.remove("hidden");
      } else {
          header.classList.add("hidden");
      }
  }

  function showModal(modalName) {
      Object.values(modals).forEach(modal => modal.classList.remove("active"));
      modals[modalName].classList.add("active");
  }

  function hideModal(modalName) {
      modals[modalName].classList.remove("active");
  }
  

  // Auth Logic
  auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userRole = userData.role;
            const now = new Date();

            // فحص تاريخ انتهاء الصلاحية
            if (userData.approved === true && userData.expiryDate && userData.expiryDate.toDate() < now) {
                await db.collection("users").doc(user.uid).update({ approved: false });
                messageModal("انتهت صلاحية حسابك. تم تقييده تلقائياً. يرجى التواصل مع المسؤول.", () => {
                    auth.signOut();
                });
                return;
            }

            if (userData.approved === true) {
                if (userRole === "admin") {
                    showAdminPanel();
                } else {
                    showUserPanel();
                }
            } else {
                messageModal("حسابك قيد المراجعة. يرجى الانتظار حتى يوافق المسؤول.", () => {
                    auth.signOut();
                });
            }
        } else {
            messageModal("حدث خطأ. يرجى المحاولة مرة أخرى.", () => {
                auth.signOut();
            });
        }
    } else {
        currentUser = null;
        userRole = null;
        updateHeader(false);
        showScreen("login");
    }
  });

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        messageModal(`خطأ في تسجيل الدخول: ${error.message}`);
    }
  });

  document.getElementById("register-auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email-input").value;
    const password = document.getElementById("register-password-input").value;
    const notes = document.getElementById("user-notes").value.trim();
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection("users").doc(userCredential.user.uid).set({
            email: email,
            role: 'user',
            approved: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiryDate: null,
            notes: notes
        });
        messageModal("تم إنشاء الحساب بنجاح. سيقوم المسؤول بمراجعته وتفعيله.", () => {
            showScreen("login");
        });
    } catch (error) {
        messageModal(`خطأ في إنشاء الحساب: ${error.message}`);
    }
  });
  
  document.getElementById("logout-btn").addEventListener("click", () => {
    confirmModal("هل أنت متأكد من أنك تريد تسجيل الخروج؟", () => {
        auth.signOut();
    });
  });
  document.getElementById("switch-to-register").addEventListener("click", () => {
    showScreen("register");
  });
  document.getElementById("switch-to-login").addEventListener("click", () => {
    showScreen("login");
  });
  
  // Admin Panel Logic
  function showAdminPanel() {
    showScreen("admin");
    fetchUsersAndRender();

    document.querySelectorAll('.admin-filters .filter-btn-group button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-filters .filter-btn-group button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderUsersList(e.target.dataset.filter);
        });
    });
    document.getElementById('search-user-input').addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.admin-filters .filter-btn-group button.active').dataset.filter;
        renderUsersList(activeFilter, e.target.value.trim());
    });
    document.getElementById('link-to-pending').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.admin-filters .filter-btn-group button').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-filter="pending"]').classList.add('active');
        renderUsersList('pending');
    });
  }

  async function fetchUsersAndRender() {
    const snapshot = await db.collection("users").get();
    allUsersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateAdminStats();
    renderUsersList('all');
  }

  function updateAdminStats() {
    let totalUsers = 0;
    let pendingUsers = 0;
    let approvedUsers = 0;
    let expiredUsers = 0;
    const now = new Date();

    allUsersData.forEach(user => {
      totalUsers++;
      if (user.approved === true) {
        if (user.expiryDate && user.expiryDate.toDate() < now) {
          expiredUsers++;
        } else {
          approvedUsers++;
        }
      } else {
        pendingUsers++;
      }
    });

    document.getElementById('total-users-count').textContent = totalUsers;
    document.getElementById('pending-users-count').textContent = pendingUsers;
    document.getElementById('approved-users-count').textContent = approvedUsers;
    document.getElementById('expired-users-count').textContent = expiredUsers;

    const notificationBanner = document.getElementById('pending-users-notification');
    if (pendingUsers > 0) {
      notificationBanner.classList.remove('hidden');
      notificationBanner.querySelector('a').textContent = `عرض (${pendingUsers})`;
    } else {
      notificationBanner.classList.add('hidden');
    }
  }

  function renderUsersList(filter = 'all', searchTerm = '') {
    const ul = document.getElementById("users-list-container");
    ul.innerHTML = "";
    
    let filteredUsers = allUsersData.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const now = new Date();
        
        let matchesFilter = false;
        if (filter === 'all') {
            matchesFilter = true;
        } else if (filter === 'pending' && user.approved === false) {
            matchesFilter = true;
        } else if (filter === 'approved' && user.approved === true && (!user.expiryDate || user.expiryDate.toDate() >= now)) {
            matchesFilter = true;
        } else if (filter === 'expired' && user.approved === true && user.expiryDate && user.expiryDate.toDate() < now) {
            matchesFilter = true;
        }
        return matchesSearch && matchesFilter;
    });

    if (filteredUsers.length === 0) {
        ul.innerHTML = "<p style='text-align: center; color: #888; padding-top: 20px;'>لا يوجد مستخدمون حاليًا يطابقون هذا الفلتر أو البحث.</p>";
        return;
    }
    
    filteredUsers.forEach(userData => {
        const li = document.createElement("li");
        li.classList.add("admin-user-card");
        let statusClass = "approval-status-pending";
        let statusText = "قيد المراجعة";
        if (userData.approved === true) {
            const now = new Date();
            if (userData.expiryDate && userData.expiryDate.toDate() < now) {
                statusClass = "approval-status-expired";
                statusText = "منتهي الصلاحية";
            } else {
                statusClass = "approval-status-approved";
                statusText = "موافق عليه";
            }
        }
        
        li.innerHTML = `
            <div class="admin-user-info">
                <h4>${userData.email}</h4>
                <span class="${statusClass}">${statusText}</span>
            </div>
            <div class="admin-user-actions">
                <button class="details-btn" data-uid="${userData.id}">التفاصيل</button>
            </div>
        `;
        ul.appendChild(li);
    });
    
    document.querySelectorAll(".details-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const uid = e.target.dataset.uid;
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          showUserDetailsModal(uid, userData);
        }
      });
    });
  }

  function showUserDetailsModal(uid, userData) {
    const modal = modals.userDetails;
    document.getElementById("user-details-title").textContent = `تفاصيل المستخدم: ${userData.email}`;
    document.getElementById("user-details-email").textContent = userData.email;
    document.getElementById("user-details-creation-date").textContent = userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'غير متوفر';

    const now = new Date();
    let statusText = "قيد المراجعة";
    let statusClass = "approval-status-pending";
    if (userData.approved === true) {
        if (userData.expiryDate && userData.expiryDate.toDate() < now) {
            statusText = "منتهي الصلاحية";
            statusClass = "approval-status-expired";
        } else {
            statusText = "موافق عليه";
            statusClass = "approval-status-approved";
        }
    }
    document.getElementById("user-details-status").textContent = statusText;
    document.getElementById("user-details-status").className = statusClass;
    document.getElementById("user-details-expiry-date").textContent = userData.expiryDate ? userData.expiryDate.toDate().toLocaleDateString() : 'لا يوجد';
    document.getElementById("user-details-notes").textContent = userData.notes || 'لا يوجد';
    
    document.getElementById("btn-approve-user").classList.toggle("hidden", userData.approved === true);
    document.getElementById("btn-update-user-expiry").classList.toggle("hidden", userData.approved !== true);
    document.getElementById("btn-restrict-user").classList.toggle("hidden", userData.approved !== true);
    document.getElementById("btn-delete-user").classList.remove("hidden");

    document.getElementById("btn-approve-user").onclick = () => {
        hideModal("userDetails");
        confirmModal("هل أنت متأكد من تفعيل هذا المستخدم؟", () => {
            showSetExpiryModal(uid);
        });
    };
    document.getElementById("btn-update-user-expiry").onclick = () => {
        hideModal("userDetails");
        showSetExpiryModal(uid);
    };
    document.getElementById("btn-restrict-user").onclick = () => {
        hideModal("userDetails");
        confirmModal("هل أنت متأكد من تقييد هذا المستخدم؟", async () => {
            await db.collection("users").doc(uid).update({ approved: false, expiryDate: null });
            messageModal("تم تقييد المستخدم بنجاح.", () => {
                fetchUsersAndRender();
            });
        });
    };
    document.getElementById("btn-delete-user").onclick = () => {
      hideModal("userDetails");
      confirmModal("هل أنت متأكد من حذف هذا المستخدم وجميع بياناته؟", async () => {
        // ابدأ عملية batch لحذف البيانات المرتبطة
        const batch = db.batch();
        
        // ابحث عن جميع العملاء التابعين لهذا المستخدم
        const clientsSnapshot = await db.collection("clients").where("userId", "==", uid).get();
        
        // لكل عميل، احذف جميع معاملاته
        const clientDeletePromises = clientsSnapshot.docs.map(async clientDoc => {
          const transactionsSnapshot = await db.collection("clients").doc(clientDoc.id).collection("transactions").get();
          transactionsSnapshot.docs.forEach(transactionDoc => {
            batch.delete(transactionDoc.ref);
          });
          // ثم احذف وثيقة العميل نفسه
          batch.delete(clientDoc.ref);
        });
        
        // انتظر حتى يتم تجميع جميع عمليات حذف المعاملات والعملاء
        await Promise.all(clientDeletePromises);
        
        // احذف وثيقة المستخدم
        batch.delete(db.collection("users").doc(uid));

        // نفّذ جميع العمليات المجمّعة
        await batch.commit();

        messageModal("تم حذف المستخدم وجميع بياناته بنجاح.", () => {
            fetchUsersAndRender();
        });
      });
    };
    document.getElementById("btn-close-user-details").onclick = () => hideModal("userDetails");
    
    showModal("userDetails");
  }

  function showSetExpiryModal(uid) {
    const modal = modals.setExpiry;
    document.getElementById("expiry-date-input").value = "";
    document.getElementById("set-expiry-form").onsubmit = async (e) => {
        e.preventDefault();
        const expiryDate = document.getElementById("expiry-date-input").value;
        const expiryDateObj = new Date(expiryDate);
        expiryDateObj.setHours(23, 59, 59, 999);
        await db.collection("users").doc(uid).update({ 
            approved: true,
            expiryDate: firebase.firestore.Timestamp.fromDate(expiryDateObj)
        });
        hideModal("setExpiry");
        messageModal("تم تفعيل المستخدم وتحديد تاريخ الانتهاء بنجاح.", () => {
            fetchUsersAndRender();
        });
    };
    document.getElementById("btn-cancel-expiry").onclick = () => hideModal("setExpiry");
    showModal("setExpiry");
  }
  
  // User Panel Logic
  function showUserPanel() {
    showScreen("user");
    updateClientSuggestions();
    fetchClients();
    
    document.getElementById("transaction-type").addEventListener("change", (e) => {
      const descInput = document.getElementById("transaction-desc");
      if (e.target.value === "payment") {
        descInput.removeAttribute("required");
        descInput.parentNode.querySelector('label').classList.remove('required');
      } else {
        descInput.setAttribute("required", true);
        descInput.parentNode.querySelector('label').classList.add('required');
      }
    });
  }
  
  async function fetchClients() {
    const clientsCollection = db.collection("clients").where("userId", "==", currentUser.uid);
    clientsCollection.onSnapshot(snapshot => {
      clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      clientsData.sort((a, b) => {
          const aDate = a.lastTransactionAt ? a.lastTransactionAt.toDate() : new Date(0);
          const bDate = b.lastTransactionAt ? b.lastTransactionAt.toDate() : new Date(0);
          return bDate - aDate;
      });

      renderClientsList();
      updateClientSuggestions();
      if (currentClientId) {
        showClientDetails();
      }
    });
  }

  async function updateClientSuggestions() {
    const datalist = document.getElementById("clients-datalist");
    datalist.innerHTML = "";
    clientsData.forEach(client => {
      const option = document.createElement("option");
      option.value = client.name;
      datalist.appendChild(option);
    });
  }

  async function renderClientsList(filter = "") {
    const ul = document.getElementById("clients-list-container");
    ul.innerHTML = "";
    const filteredClients = clientsData.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    
    if (filteredClients.length === 0) {
      ul.innerHTML = "<p style='text-align: center; color: #888; padding-top: 20px;'>لا يوجد عملاء بهذا الاسم.</p>";
      return;
    }

    filteredClients.forEach(client => {
      const li = document.createElement("li");
      li.classList.add("client-item");
      const lastTxTime = client.lastTransactionAt ? `آخر معاملة: ${client.lastTransactionAt.toDate().toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}` : '';
      li.innerHTML = `
        <div class="client-info">
          <span class="client-name">${client.name}</span>
          <span class="client-last-tx">${lastTxTime}</span>
        </div>
        <div class="client-actions">
          <button title="حذف العميل" data-action="delete" data-client-id="${client.id}"><span class="trash-icon">🗑️</span></button>
        </div>
      `;
      li.onclick = async (e) => {
        if(e.target.closest('button')?.dataset.action === "delete") {
          e.stopPropagation();
          confirmModal(`هل أنت متأكد من حذف العميل "${client.name}"؟ سيؤدي هذا إلى حذف جميع معاملاته أيضاً.`, async () => {
            // ابدأ عملية batch لحذف المعاملات ثم العميل نفسه
            const batch = db.batch();
            const transactionsSnapshot = await db.collection("clients").doc(client.id).collection("transactions").get();
            transactionsSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            batch.delete(db.collection("clients").doc(client.id));
            await batch.commit();
            messageModal("تم حذف العميل ومعاملاته بنجاح.");
          });
        } else {
          currentClientId = client.id;
          showClientDetails();
          showScreen("clientDetails");
        }
      };
      ul.appendChild(li);
    });
  }

  function calculateTotalDebt(transactionsToCalculate) {
    let total = 0;
    transactionsToCalculate.forEach(tx => {
      if(tx.type === "purchase") total += tx.amount;
      else if(tx.type === "payment") total -= tx.amount;
    });
    return total;
  }
  
  function showClientDetails() {
      const client = clientsData.find(c => c.id === currentClientId);
      if (!client) return;
  
      document.getElementById("client-details-name").textContent = client.name;
      document.getElementById("add-transaction-form-client").reset();
      
      if (unsubscribeTransactions) {
          unsubscribeTransactions();
      }
      renderTransactions(client);
  }

  async function renderTransactions(client) {
    const ul = document.getElementById("transactions-list");
    
    const fromDateStr = document.getElementById("filter-from-date").value;
    const toDateStr = document.getElementById("filter-to-date").value;
    
    let transactionsRef = db.collection("clients").doc(client.id).collection("transactions");

    if(fromDateStr) {
      const fromDate = new Date(fromDateStr);
      transactionsRef = transactionsRef.where("createdAt", ">=", fromDate);
    }
    if(toDateStr) {
      const toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999);
      transactionsRef = transactionsRef.where("createdAt", "<=", toDate);
    }
    
    unsubscribeTransactions = transactionsRef.orderBy("createdAt", "desc").onSnapshot(snapshot => {
        ul.innerHTML = "";
        
        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(data.date)
            };
        });

        if (transactions.length === 0) {
            ul.innerHTML = "<p style='text-align: center; color: #888; padding-top: 20px;'>لا توجد معاملات في هذه الفترة.</p>";
        } else {
            transactions.forEach(tx => {
                const li = document.createElement("li");
                li.classList.add("transaction-item");

                const createdAtDate = tx.createdAt;
                const formattedDate = createdAtDate.toLocaleDateString('ar-SY', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                });
                const formattedTime = createdAtDate.toLocaleTimeString('ar-SY', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const descriptionContent = tx.description + (tx.notes ? ` <span style="font-size:0.9em;color:#777;">(${tx.notes})</span>` : "");
                
                li.innerHTML = `
                    <div class="transaction-desc">${descriptionContent}</div>
                    <div class="transaction-date">${formattedDate} <br> ${formattedTime}</div>
                    <div class="transaction-amount ${tx.type === "purchase" ? "transaction-type-purchase" : "transaction-type-payment"}">
                        ${tx.type === "purchase" ? "+" : "-"} ${tx.amount.toFixed(2)} ريال
                    </div>
                    <div class="transaction-actions">
                        <button title="تعديل" data-tx-id="${tx.id}" data-action="edit">✏️</button>
                        <button title="حذف" data-tx-id="${tx.id}" data-action="delete"><span class="trash-icon">🗑️</span></button>
                    </div>
                `;

                li.querySelector('[data-action="edit"]').onclick = (e) => {
                    e.stopPropagation();
                    openEditTransactionModal(client.id, tx);
                };
                li.querySelector('[data-action="delete"]').onclick = (e) => {
                    e.stopPropagation();
                    confirmModal(`هل تريد حذف هذه المعاملة؟`, async () => {
                        await db.collection("clients").doc(client.id).collection("transactions").doc(tx.id).delete();
                    });
                };
                ul.appendChild(li);
            });
        }
        updateTotalDebtDisplay(client.id);
    });
  }

  async function updateTotalDebtDisplay(clientId) {
    const transactionsSnapshot = await db.collection("clients").doc(clientId).collection("transactions").get();
    let total = 0;
    transactionsSnapshot.forEach(doc => {
        const tx = doc.data();
        if(tx.type === "purchase") total += tx.amount;
        else if(tx.type === "payment") total -= tx.amount;
    });
    document.getElementById("total-debt-display").textContent = `إجمالي الدين الحالي: ${total.toFixed(2)} ريال`;
  }

  function confirmModal(message, onConfirm, onCancel) {
    const overlay = modals.confirm;
    overlay.querySelector(".modal-message").innerHTML = message;
    
    const confirmBtn = overlay.querySelector(".confirm-btn");
    const cancelBtn = overlay.querySelector(".cancel-btn");

    confirmBtn.onclick = () => {
      hideModal("confirm");
      if(onConfirm) onConfirm();
    };
    cancelBtn.onclick = () => {
      hideModal("confirm");
      if(onCancel) onCancel();
    };

    showModal("confirm");
  }

  function messageModal(message, onConfirm) {
    const overlay = modals.message;
    overlay.querySelector(".modal-message").innerHTML = message;
    
    const confirmBtn = overlay.querySelector(".confirm-btn");

    confirmBtn.onclick = () => {
      hideModal("message");
      if(onConfirm) onConfirm();
    };

    showModal("message");
  }

  function openEditTransactionModal(clientId, transaction) {
    const editModal = modals.editTransaction;
    const form = document.getElementById("edit-transaction-form");
    
    document.getElementById("edit-tx-desc").value = transaction.description;
    document.getElementById("edit-tx-amount").value = transaction.amount;
    document.getElementById("edit-tx-type").value = transaction.type;
    document.getElementById("edit-tx-notes").value = transaction.notes;

    const editDescInput = document.getElementById("edit-tx-desc");
    const editTxType = document.getElementById("edit-tx-type");
    if (editTxType.value === "payment") {
        editDescInput.removeAttribute("required");
        editDescInput.parentNode.querySelector('label').classList.remove('required');
    } else {
        editDescInput.setAttribute("required", true);
        editDescInput.parentNode.querySelector('label').classList.add('required');
    }
    editTxType.addEventListener("change", (e) => {
        if (e.target.value === "payment") {
            editDescInput.removeAttribute("required");
            editDescInput.parentNode.querySelector('label').classList.remove('required');
        } else {
            editDescInput.setAttribute("required", true);
            editDescInput.parentNode.querySelector('label').classList.add('required');
        }
    });

    showModal("editTransaction");

    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const newDesc = document.getElementById("edit-tx-desc").value.trim();
      const newAmount = parseFloat(document.getElementById("edit-tx-amount").value);
      const newType = document.getElementById("edit-tx-type").value;
      const newNotes = document.getElementById("edit-tx-notes").value.trim();

      await db.collection("clients").doc(clientId).collection("transactions").doc(transaction.id).update({
          description: newDesc,
          amount: newAmount,
          type: newType,
          notes: newNotes,
      });

      hideModal("editTransaction");
    };
  }
  document.getElementById("cancel-edit-tx").onclick = () => {
    hideModal("editTransaction");
  };

  document.getElementById("btn-add-transaction").onclick = () => {
    document.getElementById("add-transaction-form-client").reset();
    showModal("addTransactionClient");
  };
  document.getElementById("cancel-add-tx-client").onclick = () => {
    hideModal("addTransactionClient");
  };

  document.getElementById("add-transaction-form-client").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    
    const desc = form.querySelector("#transaction-desc-client").value.trim();
    const amount = parseFloat(form.querySelector("#transaction-amount-client").value);
    const type = form.querySelector("#transaction-type-client").value;
    const notes = form.querySelector("#transaction-notes-client").value.trim();

    const confirmationMessage = `هل أنت متأكد من إضافة المعاملة التالية؟<br><br>
    الوصف: <strong>${desc || 'لا يوجد'}</strong><br>
    المبلغ: <strong>${amount}</strong><br>
    النوع: <strong>${type === 'purchase' ? 'شراء (دين)' : 'دفع'}</strong><br>`;

    confirmModal(confirmationMessage, async () => {
      const createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("clients").doc(currentClientId).collection("transactions").add({
        description: desc,
        amount,
        type,
        notes,
        createdAt
      });
      await db.collection("clients").doc(currentClientId).update({
        lastTransactionAt: createdAt,
      });
      
      hideModal("addTransactionClient");
      messageModal("تم إضافة المعاملة بنجاح!", () => {
      });
      form.reset();
    });
  });

  document.getElementById("transaction-type-client").addEventListener("change", (e) => {
    const descInput = document.getElementById("transaction-desc-client");
    if (e.target.value === "payment") {
      descInput.removeAttribute("required");
      descInput.parentNode.querySelector('label').classList.remove('required');
    } else {
      descInput.setAttribute("required", true);
      descInput.parentNode.querySelector('label').classList.add('required');
    }
  });

  document.getElementById("filter-from-date").addEventListener("change", () => {
    if (currentClientId) renderTransactions(clientsData.find(c => c.id === currentClientId));
  });
  document.getElementById("filter-to-date").addEventListener("change", () => {
    if (currentClientId) renderTransactions(clientsData.find(c => c.id === currentClientId));
  });

  document.getElementById("btn-export-csv").onclick = async () => {
    confirmModal(`هل أنت متأكد من تصدير البيانات؟`, async () => {
      const client = clientsData.find(c => c.id === currentClientId);
      if (!client) return;
      
      const fromDateStr = document.getElementById("filter-from-date").value;
      const toDateStr = document.getElementById("filter-to-date").value;
  
      let transactionsRef = db.collection("clients").doc(client.id).collection("transactions");
      
      if(fromDateStr) {
        const fromDate = new Date(fromDateStr);
        transactionsRef = transactionsRef.where("createdAt", ">=", fromDate);
      }
      if(toDateStr) {
        const toDate = new Date(toDateStr);
        toDate.setHours(23, 59, 59, 999);
        transactionsRef = transactionsRef.where("createdAt", "<=", toDate);
      }
      
      const snapshot = await transactionsRef.orderBy("createdAt", "desc").get();
      const transactions = snapshot.docs.map(doc => doc.data());
  
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "\ufeff";
      csvContent += "التاريخ,الوقت,الوصف,النوع,المبلغ,ملاحظات\n";
      transactions.forEach(t => {
        const createdAtDate = t.createdAt ? t.createdAt.toDate() : new Date();
        const formattedDate = createdAtDate.toLocaleDateString('ar-SY', { year: 'numeric', month: 'numeric', day: 'numeric' });
        const formattedTime = createdAtDate.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
        const row = [
          formattedDate,
          formattedTime,
          `"${t.description?.replace(/"/g, '""') || ""}"`,
          t.type === "purchase" ? "شراء (دين)" : "دفع",
          t.amount.toFixed(2),
          `"${t.notes?.replace(/"/g, '""') || ""}"`
        ].join(",");
        csvContent += row + "\n";
      });
  
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${client.name}_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  document.getElementById("btn-edit-client-name").onclick = () => {
    const client = clientsData.find(c => c.id === currentClientId);
    if (!client) return;
    document.getElementById("edit-client-name-input").value = client.name;
    showModal("editClientName");
  };

  document.getElementById("edit-client-name-form").addEventListener("submit", async e => {
    e.preventDefault();
    const newName = document.getElementById("edit-client-name-input").value.trim();
    if (!newName) {
      messageModal("الاسم الجديد لا يمكن أن يكون فارغًا.");
      return;
    }
    if(clientsData.some(c => c.name === newName && c.id !== currentClientId)) {
      messageModal("يوجد عميل آخر بنفس الاسم، يرجى اختيار اسم مختلف.");
      return;
    }
    await db.collection("clients").doc(currentClientId).update({ name: newName });
    hideModal("editClientName");
  });
  document.getElementById("btn-cancel-edit-client").onclick = () => {
    hideModal("editClientName");
  };

  document.getElementById("btn-to-clients").onclick = () => {
    showScreen("clients");
    if (unsubscribeTransactions) {
        unsubscribeTransactions();
        unsubscribeTransactions = null;
    }
  };
  document.getElementById("btn-back-to-home-from-clients").onclick = () => {
    showScreen("user");
  };
  document.getElementById("btn-back-to-clients-from-details").onclick = () => {
    showScreen("clients");
    if (unsubscribeTransactions) {
        unsubscribeTransactions();
        unsubscribeTransactions = null;
    }
  };

  document.getElementById("btn-to-about").onclick = () => {
    showModal("about");
  };
  document.getElementById("btn-close-about").onclick = () => {
    hideModal("about");
  };
  document.getElementById("btn-add-client").onclick = () => {
    document.getElementById("add-client-form").reset();
    showModal("addClient");
  };
  document.getElementById("btn-cancel-add-client").onclick = () => {
    hideModal("addClient");
  };

  document.getElementById("add-client-form").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("new-client-name").value.trim();
    if (!name) return;
    if(clientsData.some(c => c.name === name)) {
      messageModal("يوجد عميل بنفس الاسم، اختر اسمًا آخر.");
      return;
    }
    
    const newClientDoc = await db.collection("clients").add({
      name: name,
      userId: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastTransactionAt: null,
    });

    const initialDebt = parseFloat(document.getElementById("new-client-initial-debt").value) || 0;
    if (initialDebt > 0) {
      const initialDesc = document.getElementById("new-client-initial-desc").value.trim() || "دين مبدئي";
      const createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("clients").doc(newClientDoc.id).collection("transactions").add({
          description: initialDesc,
          amount: initialDebt,
          type: "purchase",
          notes: "",
          createdAt
      });
      await db.collection("clients").doc(newClientDoc.id).update({
        lastTransactionAt: createdAt,
      });
    }

    hideModal("addClient");
    messageModal("تمت إضافة العميل بنجاح.");
  });

  document.getElementById("add-transaction-form").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    const clientName = form.querySelector("#transaction-client").value.trim();
    
    if (!clientName) {
      messageModal("يرجى إدخال اسم العميل.");
      return;
    }

    const desc = form.querySelector("#transaction-desc").value.trim();
    const amount = parseFloat(form.querySelector("#transaction-amount").value);
    const type = form.querySelector("#transaction-type").value;
    const notes = form.querySelector("#transaction-notes").value.trim();

    const confirmationMessage = `هل أنت متأكد من إرسال المعاملة التالية؟<br><br>
    العميل: <strong>${clientName}</strong><br>
    الوصف: <strong>${desc || 'لا يوجد'}</strong><br>
    المبلغ: <strong>${amount}</strong><br>
    النوع: <strong>${type === 'purchase' ? 'شراء (دين)' : 'دفع'}</strong><br>`;

    confirmModal(confirmationMessage, async () => {
      let client = clientsData.find(c => c.name === clientName);
      if (!client) {
        confirmModal("العميل غير موجود. هل تريد إضافته تلقائيًا؟", async () => {
            const newClientDoc = await db.collection("clients").add({
                name: clientName,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastTransactionAt: null,
            });
            await processTransaction(newClientDoc.id, form);
        });
      } else {
        await processTransaction(client.id, form);
      }
    });
  });

  async function processTransaction(clientId, form) {
    const desc = form.querySelector("#transaction-desc").value.trim();
    const amount = parseFloat(form.querySelector("#transaction-amount").value);
    const type = form.querySelector("#transaction-type").value;
    const notes = form.querySelector("#transaction-notes").value.trim();
    const createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await db.collection("clients").doc(clientId).collection("transactions").add({
        description: desc,
        amount,
        type,
        notes,
        createdAt
    });

    await db.collection("clients").doc(clientId).update({
        lastTransactionAt: createdAt,
    });

    messageModal("تم حفظ المعاملة بنجاح!", () => {
      form.reset();
    });
  }

  document.getElementById("search-client-input").addEventListener("input", (e) => {
    renderClientsList(e.target.value);
  });
