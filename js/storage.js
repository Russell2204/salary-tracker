const Storage = {
  KEYS: {
    categories: "st_categories",
    transactions: "st_transactions",
    seeded: "st_seeded",
  },

  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getCategories() {
    return this.get(this.KEYS.categories, []);
  },

  setCategories(categories) {
    this.set(this.KEYS.categories, categories);
  },

  getTransactions() {
    return this.get(this.KEYS.transactions, []);
  },

  setTransactions(transactions) {
    this.set(this.KEYS.transactions, transactions);
  },

  seedIfNeeded() {
    if (localStorage.getItem(this.KEYS.seeded) === "1") return;

    const seed = [
      { id: Utils.generateId(), name: "Зарплата", type: "income", color: "#1b7f5a" },
      { id: Utils.generateId(), name: "Фриланс", type: "income", color: "#2a9d8f" },
      { id: Utils.generateId(), name: "Инвестиции", type: "income", color: "#3d8b6e" },
      { id: Utils.generateId(), name: "Прочие доходы", type: "income", color: "#52b788" },
      { id: Utils.generateId(), name: "Еда", type: "expense", color: "#c44536" },
      { id: Utils.generateId(), name: "Транспорт", type: "expense", color: "#e76f51" },
      { id: Utils.generateId(), name: "Жильё", type: "expense", color: "#9b2226" },
      { id: Utils.generateId(), name: "Развлечения", type: "expense", color: "#f4a261" },
      { id: Utils.generateId(), name: "Здоровье", type: "expense", color: "#d62828" },
      { id: Utils.generateId(), name: "Прочие расходы", type: "expense", color: "#bc6c25" },
    ];

    this.setCategories(seed);
    this.setTransactions([]);
    localStorage.setItem(this.KEYS.seeded, "1");
  },
};
