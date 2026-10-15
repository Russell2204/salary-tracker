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
    if (!trimmed) throw Utils.err("err.categoryNameRequired");
    if (type !== "income" && type !== "expense") {
      throw Utils.err("err.invalidCategoryType");
    }

    const categories = this.getAll();
    const duplicate = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw Utils.err("err.categoryExists");

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
    if (index === -1) throw Utils.err("err.categoryNotFound");

    const trimmed = String(name || "").trim();
    if (!trimmed) throw Utils.err("err.categoryNameRequired");
    if (type !== "income" && type !== "expense") {
      throw Utils.err("err.invalidCategoryType");
    }

    const duplicate = categories.some(
      (c) =>
        c.id !== id &&
        c.type === type &&
        c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw Utils.err("err.categoryExists");

    const linked = Storage.getTransactions().filter((t) => t.categoryId === id);
    if (linked.length > 0 && categories[index].type !== type) {
      throw Utils.err("err.cannotChangeType");
    }

    const prev = categories[index];
    const translated = prev.key ? I18n.t(`cat.${prev.key}`) : null;
    const nameUnchanged =
      trimmed === prev.name || (translated !== null && trimmed === translated);

    const next = {
      ...prev,
      type,
      color: color || prev.color,
    };

    if (nameUnchanged && prev.key) {
      next.name = prev.name;
      next.key = prev.key;
    } else {
      next.name = trimmed;
      delete next.key;
    }

    categories[index] = next;
    Storage.setCategories(categories);
    return categories[index];
  },

  remove(id) {
    const linked = Storage.getTransactions().filter((t) => t.categoryId === id);
    if (linked.length > 0) {
      throw Utils.err("err.cannotDeleteCategory", { count: linked.length });
    }

    const categories = this.getAll().filter((c) => c.id !== id);
    if (categories.length === Storage.getCategories().length) {
      throw Utils.err("err.categoryNotFound");
    }
    Storage.setCategories(categories);
  },
};
