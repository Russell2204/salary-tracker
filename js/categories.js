const Categories = {
  getAll() {
    return Storage.getCategories();
  },

  getById(id) {
    return this.getAll().find((c) => c.id === id) || null;
  },

  getByType(type) {
    return this.getAll().filter((c) => c.type === type);
  },

  create({ name, type, color }) {
    const trimmed = String(name || "").trim();
    if (!trimmed) throw new Error("Укажите название категории");
    if (type !== "income" && type !== "expense") {
      throw new Error("Некорректный тип категории");
    }

    const categories = this.getAll();
    const duplicate = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw new Error("Такая категория уже существует");

    const category = {
      id: Utils.generateId(),
      name: trimmed,
      type,
      color: color || "#2a9d8f",
    };
    categories.push(category);
    Storage.setCategories(categories);
    return category;
  },

  update(id, { name, type, color }) {
    const categories = this.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Категория не найдена");

    const trimmed = String(name || "").trim();
    if (!trimmed) throw new Error("Укажите название категории");
    if (type !== "income" && type !== "expense") {
      throw new Error("Некорректный тип категории");
    }

    const duplicate = categories.some(
      (c) =>
        c.id !== id &&
        c.type === type &&
        c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw new Error("Такая категория уже существует");

    const linked = Storage.getTransactions().filter((t) => t.categoryId === id);
    if (linked.length > 0 && categories[index].type !== type) {
      throw new Error(
        "Нельзя сменить тип: у категории есть связанные транзакции"
      );
    }

    categories[index] = {
      ...categories[index],
      name: trimmed,
      type,
      color: color || categories[index].color,
    };
    Storage.setCategories(categories);
    return categories[index];
  },

  remove(id) {
    const linked = Storage.getTransactions().filter((t) => t.categoryId === id);
    if (linked.length > 0) {
      throw new Error(
        `Нельзя удалить: есть ${linked.length} связанн(ых) транзакций`
      );
    }

    const categories = this.getAll().filter((c) => c.id !== id);
    if (categories.length === Storage.getCategories().length) {
      throw new Error("Категория не найдена");
    }
    Storage.setCategories(categories);
  },
};
