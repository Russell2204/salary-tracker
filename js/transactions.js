const Transactions = {
  getAll() {
    return Storage.getTransactions().slice().sort((a, b) => {
      if (a.date === b.date) return b.id.localeCompare(a.id);
      return b.date.localeCompare(a.date);
    });
  },

  getById(id) {
    return Storage.getTransactions().find((t) => t.id === id) || null;
  },

  filter({ type = "all", categoryId = "all", from = "", to = "" } = {}) {
    return this.getAll().filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (categoryId !== "all" && t.categoryId !== categoryId) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  },

  create({ type, amount, categoryId, description, date }) {
    this._validate({ type, amount, categoryId, date });

    const category = Categories.getById(categoryId);
    if (!category) throw new Error("Категория не найдена");
    if (category.type !== type) {
      throw new Error("Тип категории не совпадает с типом транзакции");
    }

    const transaction = {
      id: Utils.generateId(),
      type,
      amount: Math.round(Number(amount)),
      categoryId,
      description: String(description || "").trim(),
      date,
    };

    const list = Storage.getTransactions();
    list.push(transaction);
    Storage.setTransactions(list);
    return transaction;
  },

  update(id, { type, amount, categoryId, description, date }) {
    this._validate({ type, amount, categoryId, date });

    const list = Storage.getTransactions();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Транзакция не найдена");

    const category = Categories.getById(categoryId);
    if (!category) throw new Error("Категория не найдена");
    if (category.type !== type) {
      throw new Error("Тип категории не совпадает с типом транзакции");
    }

    list[index] = {
      ...list[index],
      type,
      amount: Math.round(Number(amount)),
      categoryId,
      description: String(description || "").trim(),
      date,
    };
    Storage.setTransactions(list);
    return list[index];
  },

  remove(id) {
    const list = Storage.getTransactions();
    const next = list.filter((t) => t.id !== id);
    if (next.length === list.length) throw new Error("Транзакция не найдена");
    Storage.setTransactions(next);
  },

  getTotals(period = "all") {
    const items = this.getAll().filter((t) => Utils.isInPeriod(t.date, period));
    let income = 0;
    let expense = 0;
    for (const t of items) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  },

  getMonthlySeries(limit = 6) {
    const map = new Map();
    for (const t of this.getAll()) {
      const key = Utils.monthKey(t.date);
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const bucket = map.get(key);
      if (t.type === "income") bucket.income += t.amount;
      else bucket.expense += t.amount;
    }

    const keys = Array.from(map.keys()).sort();
    const sliced = keys.slice(-limit);
    return sliced.map((key) => ({
      key,
      label: Utils.monthLabel(key),
      income: map.get(key).income,
      expense: map.get(key).expense,
    }));
  },

  getExpenseByCategory(period = "all") {
    const totals = new Map();
    for (const t of this.getAll()) {
      if (t.type !== "expense") continue;
      if (!Utils.isInPeriod(t.date, period)) continue;
      totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount);
    }

    return Array.from(totals.entries())
      .map(([categoryId, amount]) => {
        const cat = Categories.getById(categoryId);
        return {
          categoryId,
          name: cat ? cat.name : "Удалена",
          color: cat ? cat.color : "#999999",
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },

  _validate({ type, amount, categoryId, date }) {
    if (type !== "income" && type !== "expense") {
      throw new Error("Некорректный тип транзакции");
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) {
      throw new Error("Сумма должна быть больше 0");
    }
    if (!categoryId) throw new Error("Выберите категорию");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Укажите корректную дату");
    }
  },
};
