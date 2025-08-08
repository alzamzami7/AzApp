// ==== إعدادات أساسية ====

const userId = generateUserId();
document.getElementById("user-id").textContent = userId;

function generateUserId() {
  // معرف بسيط عشوائي يربط البيانات بالمستخدم الحالي في LocalStorage
  const key = "billing-app-user-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "user-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

// ==== تخزين البيانات ====

function getStorageKey() {
  return `billing-app-data-${userId}`;
}

function loadData() {
  const raw = localStorage.getItem(getStorageKey());
  if (!raw) return { clients: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { clients: [] };
  }
}

function saveData(data) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

// ==== إدارة الواجهات ====

const screens = {
  home: document.getElementById("home-screen"),
  clients: document.getElementById("clients-screen"),
  clientDetails: document.getElementById("client-details-screen"),
  editClientName: document.getElementById("edit-client-name-screen"),
  editTransaction: document.getElementById("edit-transaction-screen"),
  addClient: document.getElementById("add-client-screen"),
  about: document.getElementById("about-screen"),
};

function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
}

// ==== بيانات في الذاكرة ====

let data = loadData();
let selectedClientId = null;
let editingTransactionId = null;

// ==== مساعدة العرض ====

function formatDateISO(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateDisplay(date) {
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG");
}

// ==== إدارة العملاء ====

function renderClientsList(filter = "") {
  const container = document.getElementById("clients-list-container");
  container.innerHTML = "";
  const filtered = data.clients.filter(c =>
    c.name.includes(filter)
  );
  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "لا يوجد عملاء مطابقون.";
    container.appendChild(li);
    return;
  }
  filtered.forEach(client => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = client.name;
    nameSpan.classList.add("client-name");
    nameSpan.tabIndex = 0;
    nameSpan.addEventListener("click", () => openClientDetails(client.id));
    nameSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openClientDetails(client.id);
      }
    });
    li.appendChild(nameSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.classList.add("delete-client");
    deleteBtn.title = "حذف العميل";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmModal(`هل تريد حذف العميل "${client.name}" وجميع معاملاته؟`, () => {
        deleteClient(client.id);
      });
    });
    li.appendChild(deleteBtn);

    container.appendChild(li);
  });
}

function addClient(name, initialDebt = 0, initialDesc = "") {
  const id = "client-" + Date.now() + "-" + Math.random().toString(36).slice(2,6);
  const newClient = {
    id,
    name,
    transactions: [],
  };
  if (initialDebt > 0) {
    newClient.transactions.push({
      id: "txn-" + Date.now(),
      date: new Date().toISOString(),
      type: "purchase",
      amount: Number(initialDebt),
      description: initialDesc || "دين مبدئي",
      notes: "",
    });
  }
  data.clients.push(newClient);
  saveData(data);
  renderClientsList();
  return id;
}

function deleteClient(clientId) {
  data.clients = data.clients.filter(c => c.id !== clientId);
  saveData(data);
  renderClientsList();
  showScreen("clients");
}

function editClientName(clientId, newName) {
  const client = data.clients.find(c => c.id === clientId);
  if (client) {
    client.name = newName;
    saveData(data);
  }
}

// ==== فتح شاشة تفاصيل العميل ====

function openClientDetails(clientId) {
  selectedClientId = clientId;
  renderClientDetails();
  showScreen("clientDetails");
  clearFilterDates();
  clearTotalDebt();
}

function renderClientDetails() {
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;

  document.getElementById("client-details-name").textContent = client.name;

  renderTransactionsList(client.transactions);
}

function renderTransactionsList(transactions, filterFrom = null, filterTo = null) {
  const list = document.getElementById("transactions-list");
  list.innerHTML = "";

  let filteredTxns = transactions;

  if (filterFrom) {
    filteredTxns = filteredTxns.filter(txn => new Date(txn.date) >= new Date(filterFrom));
  }
  if (filterTo) {
    filteredTxns = filteredTxns.filter(txn => new Date(txn.date) <= new Date(filterTo));
  }

  if (filteredTxns.length === 0) {
    const li = document.createElement("li");
    li.textContent = "لا توجد معاملات في النطاق الزمني المحدد.";
    list.appendChild(li);
    return;
  }

  filteredTxns.sort((a,b) => new Date(b.date) - new Date(a.date));

  filteredTxns.forEach(txn => {
    const li = document.createElement("li");

    const descSpan = document.createElement("span");
    descSpan.textContent = txn.description;
    descSpan.classList.add("transaction-desc");

    const dateSpan = document.createElement("span");
    dateSpan.textContent = formatDateDisplay(txn.date);
    dateSpan.classList.add("transaction-date");

    const amountSpan = document.createElement("span");
    amountSpan.textContent = (txn.type === "payment" ? "-" : "+") + txn.amount.toFixed(2);
    amountSpan.classList.add("transaction-amount");
    amountSpan.classList.add(txn.type === "purchase" ? "transaction-type-purchase" : "transaction-type-payment");

    const notesSpan = document.createElement("span");
    notesSpan.textContent = txn.notes || "";
    notesSpan.classList.add("transaction-notes");

    const actionsSpan = document.createElement("span");
    actionsSpan.classList.add("transaction-actions");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "تعديل المعاملة";
    editBtn.addEventListener("click", () => openEditTransaction(txn.id));
    actionsSpan.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.title = "حذف المعاملة";
    delBtn.addEventListener("click", () => {
      confirmModal("هل تريد حذف هذه المعاملة؟", () => {
        deleteTransaction(txn.id);
      });
    });
    actionsSpan.appendChild(delBtn);

    li.appendChild(descSpan);
    li.appendChild(dateSpan);
    li.appendChild(amountSpan);
    li.appendChild(notesSpan);
    li.appendChild(actionsSpan);

    list.appendChild(li);
  });
}

// ==== إدارة المعاملات ====

function addTransaction(clientId, type, description, amount, notes = "") {
  const client = data.clients.find(c => c.id === clientId);
  if (!client) return false;
  const newTxn = {
    id: "txn-" + Date.now() + "-" + Math.random().toString(36).slice(2,6),
    date: new Date().toISOString(),
    type,
    description,
    amount: Number(amount),
    notes,
  };
  client.transactions.push(newTxn);
  saveData(data);
  return true;
}

function deleteTransaction(txnId) {
  if (!selectedClientId) return;
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;
  client.transactions = client.transactions.filter(t => t.id !== txnId);
  saveData(data);
  renderClientDetails();
  clearTotalDebt();
}

function openEditTransaction(txnId) {
  if (!selectedClientId) return;
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;
  const txn = client.transactions.find(t => t.id === txnId);
  if (!txn) return;

  editingTransactionId = txnId;

  document.getElementById("edit-transaction-desc").value = txn.description;
  document.getElementById("edit-transaction-amount").value = txn.amount.toFixed(2);
  document.getElementById("edit-transaction-type").value = txn.type;
  document.getElementById("edit-transaction-notes").value = txn.notes;

  showScreen("editTransaction");
}

function saveEditedTransaction() {
  if (!selectedClientId || !editingTransactionId) return;
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;
  const txn = client.transactions.find(t => t.id === editingTransactionId);
  if (!txn) return;

  const desc = document.getElementById("edit-transaction-desc").value.trim();
  const amount = parseFloat(document.getElementById("edit-transaction-amount").value);
  const type = document.getElementById("edit-transaction-type").value;
  const notes = document.getElementById("edit-transaction-notes").value.trim();

  if (!desc || isNaN(amount) || amount <= 0) {
    alertModal("الرجاء إدخال تفاصيل وقيمة صحيحة.");
    return;
  }

  txn.description = desc;
  txn.amount = amount;
  txn.type = type;
  txn.notes = notes;

  saveData(data);
  editingTransactionId = null;
  renderClientDetails();
  showScreen("clientDetails");
  clearTotalDebt();
}

// ==== الفلترة حسب التاريخ ====

function getFilterDates() {
  const from = document.getElementById("filter-from-date").value;
  const to = document.getElementById("filter-to-date").value;
  return {
    from: from ? from : null,
    to: to ? to : null,
  };
}

function applyFilterDates() {
  if (!selectedClientId) return;
  const { from, to } = getFilterDates();
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;
  renderTransactionsList(client.transactions, from, to);
  clearTotalDebt();
}

function clearFilterDates() {
  document.getElementById("filter-from-date").value = "";
  document.getElementById("filter-to-date").value = "";
}

// ==== حساب إجمالي الدين ====

function calculateTotalDebt() {
  if (!selectedClientId) return;
  const { from, to } = getFilterDates();
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;

  let txns = client.transactions;
  if (from) txns = txns.filter(t => new Date(t.date) >= new Date(from));
  if (to) txns = txns.filter(t => new Date(t.date) <= new Date(to));

  let total = 0;
  txns.forEach(t => {
    if (t.type === "purchase") total += t.amount;
    else if (t.type === "payment") total -= t.amount;
  });

  return total;
}

function showTotalDebt() {
  const total = calculateTotalDebt();
  const display = document.getElementById("total-debt-display");
  if (total === undefined || total === null) {
    display.textContent = "";
    return;
  }
  display.textContent = `إجمالي الدين الحالي: ${total.toFixed(2)} ريال`;
}

// ==== تصدير CSV ====

function exportTransactionsCSV() {
  if (!selectedClientId) return;
  const { from, to } = getFilterDates();
  const client = data.clients.find(c => c.id === selectedClientId);
  if (!client) return;

  let txns = client.transactions;
  if (from) txns = txns.filter(t => new Date(t.date) >= new Date(from));
  if (to) txns = txns.filter(t => new Date(t.date) <= new Date(to));

  if (txns.length === 0) {
    alertModal("لا توجد معاملات لتصديرها.");
    return;
  }

  // CSV Header
  let csvContent = "التاريخ,نوع المعاملة,الوصف,القيمة,الملاحظات\n";

  txns.forEach(t => {
    const date = formatDateISO(t.date);
    const type = t.type === "purchase" ? "شراء (دين)" : "دفع (تسديد)";
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    const amount = t.amount.toFixed(2);
    const notes = `"${(t.notes || "").replace(/"/g, '""')}"`;
    csvContent += `${date},${type},${desc},${amount},${notes}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${client.name.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==== النوافذ المنبثقة (Modals) ====

const modalOverlay = document.getElementById("modal-overlay");
const modalMessage = document.getElementById("modal-message");
const modalOkBtn = document.getElementById("modal-ok-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

let modalConfirmCallback = null;

function confirmModal(message, onConfirm) {
  modalMessage.textContent = message;
  modalOkBtn.textContent = "نعم";
  modalCancelBtn.textContent = "إلغاء";
  modalCancelBtn.classList.remove("hidden");
  modalConfirmCallback = onConfirm;
  modalOverlay.classList.remove("hidden");
}

function alertModal(message) {
  modalMessage.textContent = message;
  modalOkBtn.textContent = "حسناً";
  modalCancelBtn.classList.add("hidden");
  modal
