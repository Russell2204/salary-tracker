const STORAGE_KEY = "salary-tracker-transactions";
const THEME_KEY = "salary-tracker-theme";
const LANG_KEY = "salary-tracker-lang";

const CATEGORIES = {
  income: ["salary", "bonus", "freelance", "otherIncome"],
  expense: ["food", "transport", "housing", "leisure", "health", "otherExpense"],
};

const LEGACY_CATEGORIES = {
  "Зарплата": "salary",
  "Премия": "bonus",
  "Подработка": "freelance",
  "Еда": "food",
  "Транспорт": "transport",
  "Жильё": "housing",
  "Жилье": "housing",
  "Развлечения": "leisure",
  "Здоровье": "health",
};

const I18N = {
  ru: {
    title: "Трекер доходов и расходов",
    eyebrow: "Личные финансы",
    period: "Период",
    allTime: "Все время",
    language: "Язык",
    sections: "Разделы",
    themeDark: "Тёмная",
    themeLight: "Светлая",
    tabStats: "Итоги",
    tabCharts: "Графики",
    tabForm: "Операция",
    tabList: "Список",
    periodTotals: "Итоги периода",
    incomePlural: "Доходы",
    expensePlural: "Расходы",
    balance: "Баланс",
    barByDay: "Доходы и расходы по дням",
    barByMonth: "Доходы и расходы по месяцам",
    barChart: "Столбчатая диаграмма доходов и расходов",
    byCategory: "Расходы по категориям",
    noData: "Нет данных",
    newTransaction: "Новая операция",
    editing: "Редактирование",
    type: "Тип",
    income: "Доход",
    expense: "Расход",
    amount: "Сумма, ₽",
    category: "Категория",
    date: "Дата",
    note: "Комментарий",
    optional: "Необязательно",
    add: "Добавить",
    save: "Сохранить",
    cancel: "Отмена",
    operations: "Операции",
    edit: "Изменить",
    delete: "Удалить",
    emptyList: "За выбранный период операций нет",
    errorAmount: "Укажите сумму больше нуля",
    errorCategory: "Выберите категорию",
    errorDate: "Укажите дату",
    deleteConfirm: "Удалить эту операцию?",
    months: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    salary: "Зарплата",
    bonus: "Премия",
    freelance: "Подработка",
    otherIncome: "Другое",
    food: "Еда",
    transport: "Транспорт",
    housing: "Жильё",
    leisure: "Развлечения",
    health: "Здоровье",
    otherExpense: "Другое",
  },
  uz: {
    title: "Daromad va xarajatlar kuzatuvi",
    eyebrow: "Shaxsiy moliya",
    period: "Davr",
    allTime: "Butun davr",
    language: "Til",
    sections: "Bo'limlar",
    themeDark: "Qorong'i",
    themeLight: "Yorug'",
    tabStats: "Natijalar",
    tabCharts: "Grafiklar",
    tabForm: "Amaliyot",
    tabList: "Ro'yxat",
    periodTotals: "Davr natijalari",
    incomePlural: "Daromadlar",
    expensePlural: "Xarajatlar",
    balance: "Balans",
    barByDay: "Kunlar bo'yicha daromad va xarajatlar",
    barByMonth: "Oylar bo'yicha daromad va xarajatlar",
    barChart: "Daromad va xarajatlar ustunli diagrammasi",
    byCategory: "Toifalar bo'yicha xarajatlar",
    noData: "Ma'lumot yo'q",
    newTransaction: "Yangi amaliyot",
    editing: "Tahrirlash",
    type: "Tur",
    income: "Daromad",
    expense: "Xarajat",
    amount: "Summa, ₽",
    category: "Toifa",
    date: "Sana",
    note: "Izoh",
    optional: "Ixtiyoriy",
    add: "Qo'shish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    operations: "Amaliyotlar",
    edit: "O'zgartirish",
    delete: "O'chirish",
    emptyList: "Tanlangan davrda amaliyotlar yo'q",
    errorAmount: "Noldan katta summa kiriting",
    errorCategory: "Toifani tanlang",
    errorDate: "Sanani kiriting",
    deleteConfirm: "Bu amaliyot o'chirilsinmi?",
    months: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
    salary: "Maosh",
    bonus: "Mukofot",
    freelance: "Qo'shimcha ish",
    otherIncome: "Boshqa",
    food: "Oziq-ovqat",
    transport: "Transport",
    housing: "Uy-joy",
    leisure: "Ko'ngilochar",
    health: "Sog'liq",
    otherExpense: "Boshqa",
  },
};

let lang = "ru";
const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

function t(key) {
  return I18N[lang][key] ?? I18N.ru[key] ?? key;
}

const periodSelect = document.getElementById("period");
const form = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const listBody = document.getElementById("transactions");
const emptyList = document.getElementById("empty-list");
const doughnutEmpty = document.getElementById("doughnut-empty");
const barTitle = document.getElementById("bar-title");
const themeToggle = document.getElementById("theme-toggle");

let transactions = loadTransactions();
let editingId = null;
let barChart = null;
let doughnutChart = null;

function normalizeCategory(type, category) {
  if (CATEGORIES[type]?.includes(category)) return category;
  if (LEGACY_CATEGORIES[category]) return LEGACY_CATEGORIES[category];
  if (category === "Другое") return type === "income" ? "otherIncome" : "otherExpense";
  return category;
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    let changed = false;
    const items = data.map((item) => {
      const category = normalizeCategory(item.type, item.category);
      if (category !== item.category) changed = true;
      return { ...item, category };
    });
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function getTransactions() {
  return transactions.slice();
}

function monthKey(date) {
  return date.slice(0, 7);
}

function currentMonthKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatMonth(key) {
  const [year, month] = key.split("-");
  return `${t("months")[Number(month) - 1]} ${year}`;
}

function categoryLabel(key) {
  return t(key);
}

function formatDate(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function selectedPeriod() {
  return periodSelect.value || currentMonthKey();
}

function filteredTransactions() {
  const period = selectedPeriod();
  const items = getTransactions();
  if (period === "all") return items;
  return items.filter((item) => monthKey(item.date) === period);
}

function fillCategories(type, selected) {
  categoryInput.innerHTML = "";
  CATEGORIES[type].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = categoryLabel(name);
    if (name === selected) option.selected = true;
    categoryInput.appendChild(option);
  });
}

function fillPeriods(prefer) {
  const keys = new Set([currentMonthKey()]);
  transactions.forEach((item) => keys.add(monthKey(item.date)));
  const previous = prefer || selectedPeriod();
  const months = [...keys].sort().reverse();

  periodSelect.innerHTML = "";
  months.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = formatMonth(key);
    periodSelect.appendChild(option);
  });
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = t("allTime");
  periodSelect.appendChild(all);

  if (previous && [...periodSelect.options].some((option) => option.value === previous)) {
    periodSelect.value = previous;
  } else {
    periodSelect.value = currentMonthKey();
  }
}

function showError(key) {
  formError.dataset.errorKey = key || "";
  formError.hidden = !key;
  formError.textContent = key ? t(key) : "";
}

function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = todayKey();
  fillCategories("income");
  formTitle.textContent = t("newTransaction");
  submitBtn.textContent = t("add");
  cancelBtn.hidden = true;
  showError("");
}

function readForm() {
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const category = categoryInput.value;
  if (!Number.isFinite(amount) || amount <= 0) {
    showError("errorAmount");
    return null;
  }
  if (!category) {
    showError("errorCategory");
    return null;
  }
  if (!date) {
    showError("errorDate");
    return null;
  }
  showError("");
  return {
    type: typeInput.value,
    amount,
    category,
    date,
    note: noteInput.value.trim(),
  };
}

function addTransaction(data) {
  transactions.push({ id: crypto.randomUUID(), ...data });
  saveTransactions();
  render(monthKey(data.date));
}

function updateTransaction(id, data) {
  const index = transactions.findIndex((item) => item.id === id);
  if (index === -1) return;
  transactions[index] = { id, ...data };
  saveTransactions();
  render(monthKey(data.date));
}

function deleteTransaction(id) {
  transactions = transactions.filter((item) => item.id !== id);
  saveTransactions();
  render();
}

function startEdit(id) {
  const item = transactions.find((entry) => entry.id === id);
  if (!item) return;
  editingId = id;
  typeInput.value = item.type;
  fillCategories(item.type, item.category);
  amountInput.value = String(item.amount);
  dateInput.value = item.date;
  noteInput.value = item.note || "";
  formTitle.textContent = t("editing");
  submitBtn.textContent = t("save");
  cancelBtn.hidden = false;
  showError("");
  showTab("form");
}

function renderStats(items) {
  const income = items
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = items
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  document.getElementById("total-income").textContent = money.format(income);
  document.getElementById("total-expense").textContent = money.format(expense);
  const balance = document.getElementById("balance");
  const diff = income - expense;
  balance.textContent = money.format(diff);
  balance.style.color = diff < 0 ? "var(--expense)" : "var(--balance)";
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function applyTheme(theme, redraw) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  const dark = next === "dark";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.textContent = dark ? t("themeLight") : t("themeDark");
  if (typeof Chart !== "undefined") {
    Chart.defaults.color = cssVar("--muted");
    Chart.defaults.borderColor = cssVar("--chart-grid");
  }
  if (redraw) render();
}

function renderTable(items) {
  listBody.innerHTML = "";
  const sorted = items.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  emptyList.hidden = sorted.length > 0;

  sorted.forEach((item) => {
    const row = document.createElement("tr");
    const typeLabel = item.type === "income" ? t("income") : t("expense");
    const sign = item.type === "income" ? "+" : "−";

    row.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td><span class="badge ${item.type}">${typeLabel}</span></td>
      <td>${escapeHtml(categoryLabel(item.category))}</td>
      <td>${item.note ? escapeHtml(item.note) : "—"}</td>
      <td class="amount ${item.type}">${sign}${money.format(item.amount)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="edit-btn" data-edit="${item.id}">${t("edit")}</button>
          <button type="button" class="delete-btn" data-delete="${item.id}">${t("delete")}</button>
        </div>
      </td>
    `;
    listBody.appendChild(row);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function destroyCharts() {
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
  if (doughnutChart) {
    doughnutChart.destroy();
    doughnutChart = null;
  }
}

function shadeColor(hex, amount) {
  const value = hex.replace("#", "");
  const num = Number.parseInt(value, 16);
  const channel = (shift) => Math.min(255, Math.max(0, ((num >> shift) & 255) + amount));
  const mixed = (channel(16) << 16) + (channel(8) << 8) + channel(0);
  return `#${mixed.toString(16).padStart(6, "0")}`;
}

const bar3dPlugin = {
  id: "bar3d",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      meta.data.forEach((bar) => {
        const { x, y, base, width } = bar.getProps(["x", "y", "base", "width"], true);
        if (base - y < 1 || width < 1) return;
        const left = x - width / 2;
        const right = x + width / 2;
        const dx = 8;
        const dy = -7;
        const color = dataset.backgroundColor;

        ctx.save();
        const shine = ctx.createLinearGradient(left, y, left, base);
        shine.addColorStop(0, "rgba(255,255,255,0.34)");
        shine.addColorStop(0.4, "rgba(255,255,255,0)");
        shine.addColorStop(1, "rgba(0,0,0,0.16)");
        ctx.fillStyle = shine;
        ctx.fillRect(left, y, width, base - y);

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + dx, y + dy);
        ctx.lineTo(right + dx, y + dy);
        ctx.lineTo(right, y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(color, 52);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(right, y);
        ctx.lineTo(right + dx, y + dy);
        ctx.lineTo(right + dx, base + dy);
        ctx.lineTo(right, base);
        ctx.closePath();
        ctx.fillStyle = shadeColor(color, -48);
        ctx.fill();
        ctx.restore();
      });
    });
  },
};

const pie3dPlugin = {
  id: "pie3d",
  beforeDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    if (!meta || meta.hidden || !dataset) return;
    const depth = 16;
    const slices = meta.data.map((arc, index) => ({ arc, index }));

    for (let layer = depth; layer >= 1; layer -= 1) {
      const ordered = slices.slice().sort((left, right) => {
        const angleA = (left.arc.startAngle + left.arc.endAngle) / 2;
        const angleB = (right.arc.startAngle + right.arc.endAngle) / 2;
        return Math.sin(angleA) - Math.sin(angleB);
      });
      ordered.forEach(({ arc, index }) => {
        const { x, y, startAngle, endAngle, outerRadius } = arc.getProps(
          ["x", "y", "startAngle", "endAngle", "outerRadius"],
          true,
        );
        if (endAngle - startAngle < 0.001) return;
        const color = Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[index]
          : dataset.backgroundColor;
        ctx.beginPath();
        ctx.moveTo(x, y + layer);
        ctx.arc(x, y + layer, outerRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = shadeColor(color, -20 - Math.round((layer / depth) * 30));
        ctx.fill();
      });
    }
  },
};

function renderBarChart(items) {
  const period = selectedPeriod();
  const labels = [];
  const income = [];
  const expense = [];

  if (period === "all") {
    barTitle.textContent = t("barByMonth");
    const keys = [...new Set(items.map((item) => monthKey(item.date)))].sort();
    keys.forEach((key) => {
      labels.push(formatMonth(key));
      income.push(sumBy(items, key, "income", true));
      expense.push(sumBy(items, key, "expense", true));
    });
  } else {
    barTitle.textContent = t("barByDay");
    const [year, month] = period.split("-").map(Number);
    const days = new Date(year, month, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const key = `${period}-${String(day).padStart(2, "0")}`;
      labels.push(String(day));
      income.push(sumBy(items, key, "income", false));
      expense.push(sumBy(items, key, "expense", false));
    }
  }

  barChart = new Chart(document.getElementById("bar-chart"), {
    type: "bar",
    plugins: [bar3dPlugin],
    data: {
      labels,
      datasets: [
        {
          label: t("incomePlural"),
          data: income,
          backgroundColor: "#1f7a4d",
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: t("expensePlural"),
          data: expense,
          backgroundColor: "#c2413a",
          borderRadius: 0,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      clip: false,
      layout: { padding: { top: 18, right: 20 } },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: cssVar("--muted") },
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: cssVar("--muted") },
        },
        y: {
          beginAtZero: true,
          ticks: { color: cssVar("--muted") },
          grid: { color: cssVar("--chart-grid") },
        },
      },
    },
  });
}

function sumBy(items, key, type, byMonth) {
  return items
    .filter((item) => item.type === type && (byMonth ? monthKey(item.date) : item.date) === key)
    .reduce((sum, item) => sum + item.amount, 0);
}

function renderDoughnut(items) {
  const totals = new Map();
  items
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
    });

  const canvas = document.getElementById("doughnut-chart");
  if (totals.size === 0) {
    canvas.hidden = true;
    doughnutEmpty.hidden = false;
    return;
  }

  canvas.hidden = false;
  doughnutEmpty.hidden = true;
  const colors = ["#c2413a", "#d97706", "#2b4c7e", "#7c5c3b", "#0f766e", "#9333ea"];

  doughnutChart = new Chart(canvas, {
    type: "pie",
    plugins: [pie3dPlugin],
    data: {
      labels: [...totals.keys()].map(categoryLabel),
      datasets: [{
        data: [...totals.values()],
        backgroundColor: colors.slice(0, totals.size),
        borderColor: cssVar("--card"),
        borderWidth: 2,
        hoverOffset: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      clip: false,
      radius: "72%",
      layout: { padding: { bottom: 6, top: 8 } },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: cssVar("--muted") },
        },
      },
    },
  });
}

const tabStage = document.querySelector(".tab-stage");
let activeTab = "stats";

function showTab(name) {
  if (!name || name === activeTab) return;
  const current = document.querySelector(".tab-panel.is-active");
  const next = document.querySelector(`[data-panel="${name}"]`);
  if (!next) return;

  document.querySelectorAll("[data-tab]").forEach((button) => {
    const selected = button.dataset.tab === name;
    button.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.setAttribute("aria-hidden", String(panel.dataset.panel !== name));
  });

  if (current) {
    tabStage.style.height = `${current.offsetHeight}px`;
    current.classList.remove("is-active");
    current.classList.add("is-leaving");
    current.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "opacity") return;
      current.classList.remove("is-leaving");
    }, { once: true });
  }

  next.classList.add("is-active");
  activeTab = name;

  requestAnimationFrame(() => {
    tabStage.style.height = `${next.offsetHeight}px`;
    if (name === "charts") {
      barChart?.resize();
      doughnutChart?.resize();
    }
  });

  const releaseHeight = (event) => {
    if (event && (event.propertyName !== "height" || event.target !== tabStage)) return;
    tabStage.style.height = "";
    if (activeTab === "charts") {
      barChart?.resize();
      doughnutChart?.resize();
    }
    tabStage.removeEventListener("transitionend", releaseHeight);
  };
  tabStage.addEventListener("transitionend", releaseHeight);
  window.setTimeout(releaseHeight, 450);
}

function applyLanguage(next, redraw) {
  lang = next === "uz" ? "uz" : "ru";
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.title = t("title");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });

  fillCategories(typeInput.value, categoryInput.value);
  formTitle.textContent = editingId ? t("editing") : t("newTransaction");
  submitBtn.textContent = editingId ? t("save") : t("add");
  if (formError.dataset.errorKey) showError(formError.dataset.errorKey);
  const dark = document.documentElement.dataset.theme === "dark";
  themeToggle.textContent = dark ? t("themeLight") : t("themeDark");
  if (redraw) render();
}

function render(preferPeriod) {
  const prefer = typeof preferPeriod === "string" ? preferPeriod : undefined;
  fillPeriods(prefer);
  const items = filteredTransactions();
  renderStats(items);
  renderTable(items);
  destroyCharts();
  renderBarChart(items);
  renderDoughnut(items);
}

typeInput.addEventListener("change", () => {
  const current = categoryInput.value;
  fillCategories(typeInput.value, CATEGORIES[typeInput.value].includes(current) ? current : undefined);
});

periodSelect.addEventListener("change", () => render());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readForm();
  if (!data) return;
  if (editingId) updateTransaction(editingId, data);
  else addTransaction(data);
  resetForm();
});

cancelBtn.addEventListener("click", resetForm);

listBody.addEventListener("click", (event) => {
  const editId = event.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;
  if (editId) startEdit(editId);
  if (deleteId && window.confirm(t("deleteConfirm"))) {
    if (editingId === deleteId) resetForm();
    deleteTransaction(deleteId);
  }
});

document.querySelector(".tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (button) showTab(button.dataset.tab);
});

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, true);
});

document.querySelector(".lang-switch").addEventListener("click", (event) => {
  const button = event.target.closest("[data-lang]");
  if (button) applyLanguage(button.dataset.lang, true);
});

applyLanguage(localStorage.getItem(LANG_KEY) === "uz" ? "uz" : "ru");
applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
resetForm();
render();
