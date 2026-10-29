(() => {
  "use strict";

  const STORAGE_KEY = "pocketwise-transactions-v1";
  const THEME_KEY = "pocketwise-theme-v1";

  const CATEGORY = {
    Food: { label: "Makanan", icon: "♨", className: "food", color: "#f0a34a" },
    Transport: { label: "Transportasi", icon: "↗", className: "transport", color: "#21ad88" },
    Fun: { label: "Hiburan", icon: "✦", className: "fun", color: "#9b72cf" }
  };

  const form = document.getElementById("expenseForm");
  const itemNameInput = document.getElementById("itemName");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const formError = document.getElementById("formError");
  const transactionList = document.getElementById("transactionList");
  const emptyState = document.getElementById("emptyState");
  const totalBalance = document.getElementById("totalBalance");
  const transactionCount = document.getElementById("transactionCount");
  const topCategory = document.getElementById("topCategory");
  const monthlyTotal = document.getElementById("monthlyTotal");
  const monthlyCount = document.getElementById("monthlyCount");
  const listCount = document.getElementById("listCount");
  const sortBy = document.getElementById("sortBy");
  const clearAllButton = document.getElementById("clearAll");
  const themeToggle = document.getElementById("themeToggle");
  const chartEmpty = document.getElementById("chartEmpty");
  const chartLegend = document.getElementById("chartLegend");
  const toast = document.getElementById("toast");

  let transactions = loadTransactions();
  let chart = null;
  let toastTimeout = null;

  function loadTransactions() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(item =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) > 0 &&
        CATEGORY[item.category] &&
        Number.isFinite(Number(item.createdAt))
      ).map(item => ({
        id: item.id,
        name: item.name.slice(0, 70),
        amount: Number(item.amount),
        category: item.category,
        createdAt: Number(item.createdAt)
      }));
    } catch (error) {
      console.warn("Data transaksi tidak dapat dibaca dari Local Storage.", error);
      return [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error("Data transaksi tidak dapat disimpan.", error);
      showToast("Data gagal disimpan. Periksa ruang penyimpanan browser.");
      return false;
    }
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatDate(timestamp, includeTime = false) {
    const options = { day: "numeric", month: "short", year: "numeric" };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return new Intl.DateTimeFormat("id-ID", options).format(new Date(timestamp));
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function getSortedTransactions() {
    const list = [...transactions];
    switch (sortBy.value) {
      case "amount-desc": return list.sort((a, b) => b.amount - a.amount);
      case "amount-asc": return list.sort((a, b) => a.amount - b.amount);
      case "category": return list.sort((a, b) =>
        CATEGORY[a.category].label.localeCompare(CATEGORY[b.category].label, "id")
      );
      case "newest":
      default: return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  function renderSummary() {
    const total = transactions.reduce((sum, item) => sum + item.amount, 0);
    totalBalance.textContent = formatRupiah(total);
    transactionCount.textContent = String(transactions.length);

    const totals = { Food: 0, Transport: 0, Fun: 0 };
    transactions.forEach(item => { totals[item.category] += item.amount; });
    const largest = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    topCategory.textContent = total === 0 || !largest || largest[1] === 0
      ? "—"
      : CATEGORY[largest[0]].label;

    const now = new Date();
    const thisMonthTransactions = transactions.filter(item => {
      const date = new Date(item.createdAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    const monthTotal = thisMonthTransactions.reduce((sum, item) => sum + item.amount, 0);
    monthlyTotal.textContent = formatRupiah(monthTotal);
    monthlyCount.textContent = `${thisMonthTransactions.length} transaksi bulan ini`;
  }

  function renderTransactions() {
    const sorted = getSortedTransactions();
    transactionList.innerHTML = sorted.map(item => {
      const category = CATEGORY[item.category];
      return `
        <div class="transaction-row">
          <div class="transaction-info">
            <span class="transaction-icon ${category.className}" aria-hidden="true">${category.icon}</span>
            <div class="transaction-name">
              <strong>${escapeHTML(item.name)}</strong>
              <small>${escapeHTML(formatDate(item.createdAt, true))}</small>
            </div>
          </div>
          <span class="category-pill ${category.className}">${category.label}</span>
          <span class="transaction-amount">${formatRupiah(item.amount)}</span>
          <button class="delete-button" type="button" data-delete-id="${escapeHTML(item.id)}" aria-label="Hapus transaksi ${escapeHTML(item.name)}" title="Hapus transaksi">×</button>
        </div>`;
    }).join("");

    const hasTransactions = transactions.length > 0;
    emptyState.hidden = hasTransactions;
    clearAllButton.hidden = !hasTransactions;
    listCount.textContent = `Menampilkan ${transactions.length} transaksi`;
  }

  function renderChart() {
    const totals = { Food: 0, Transport: 0, Fun: 0 };
    transactions.forEach(item => { totals[item.category] += item.amount; });
    const keys = Object.keys(CATEGORY).filter(key => totals[key] > 0);
    chartEmpty.hidden = keys.length > 0;
    chartLegend.innerHTML = keys.map(key => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${CATEGORY[key].color}"></span>
        ${CATEGORY[key].label} · ${formatRupiah(totals[key])}
      </span>`).join("");

    if (typeof window.Chart !== "function") {
      chartEmpty.hidden = false;
      chartEmpty.querySelector("strong").textContent = "Grafik tidak dapat dimuat";
      chartEmpty.querySelector("small").textContent = "Periksa koneksi internet untuk memuat Chart.js.";
      return;
    }

    const canvas = document.getElementById("expenseChart");
    if (chart) chart.destroy();
    chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: keys.map(key => CATEGORY[key].label),
        datasets: [{
          data: keys.map(key => totals[key]),
          backgroundColor: keys.map(key => CATEGORY[key].color),
          borderColor: getComputedStyle(document.body).getPropertyValue("--surface").trim() || "#ffffff",
          borderWidth: 4,
          hoverOffset: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `${context.label}: ${formatRupiah(context.parsed)}`
            }
          }
        }
      }
    });
  }

  function renderAll() {
    renderSummary();
    renderTransactions();
    renderChart();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    formError.textContent = "";

    const name = itemNameInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!name || !amountInput.value || !category) {
      formError.textContent = "Semua kolom wajib diisi.";
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      formError.textContent = "Jumlah harus berupa angka bulat lebih dari Rp0.";
      amountInput.focus();
      return;
    }
    if (!CATEGORY[category]) {
      formError.textContent = "Pilih kategori yang tersedia.";
      categoryInput.focus();
      return;
    }

    const transaction = {
      id: createId(),
      name: name.slice(0, 70),
      amount,
      category,
      createdAt: Date.now()
    };
    transactions.push(transaction);
    saveTransactions();
    form.reset();
    itemNameInput.focus();
    renderAll();
    showToast("Transaksi berhasil ditambahkan.");
  });

  transactionList.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;
    const id = button.dataset.deleteId;
    const item = transactions.find(transaction => transaction.id === id);
    if (!item) return;

    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderAll();
    showToast("Transaksi berhasil dihapus.");
  });

  clearAllButton.addEventListener("click", () => {
    if (!transactions.length) return;
    const confirmed = window.confirm("Hapus semua transaksi? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;
    transactions = [];
    saveTransactions();
    renderAll();
    showToast("Semua transaksi telah dihapus.");
  });

  sortBy.addEventListener("change", renderTransactions);

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* Tema tetap berjalan selama sesi ini. */ }
    renderChart();
  }

  let savedTheme = "light";
  try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch (_) { /* Gunakan mode terang. */ }
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });

  document.getElementById("todayDate").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date());

  renderAll();
})();
