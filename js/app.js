const App = {
  init() {
    I18n.init();
    Storage.seedIfNeeded();
    this.initTheme();
    this.initLang();
    this.bindTabs();
    this.bindDashboard();
    this.bindTransactionsUI();
    this.bindCategoriesUI();
    this.refreshAll();
  },

  refreshAll() {
    this.renderDashboard();
    this.renderTransactions();
    this.renderCategories();
    this.populateCategoryFilters();
  },

  /* ----- Theme ----- */
  initTheme() {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    this.applyTheme(current, false);

    document.getElementById("theme-toggle").addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      this.applyTheme(next, true);
    });
  },

  applyTheme(theme, redraw) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("st_theme", theme);
    this.updateThemeLabel(theme);
    if (redraw) this.renderDashboard();
  },

  updateThemeLabel(theme) {
    const current = theme || document.documentElement.getAttribute("data-theme") || "light";
    const label = document.getElementById("theme-toggle-label");
    if (label) {
      label.textContent = current === "dark" ? I18n.t("theme.light") : I18n.t("theme.dark");
    }
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        current === "dark" ? I18n.t("theme.toLight") : I18n.t("theme.toDark")
      );
      btn.setAttribute("title", I18n.t("theme.title"));
    }
  },

  /* ----- Language ----- */
  initLang() {
    document.getElementById("lang-toggle").addEventListener("click", () => {
      I18n.toggle();
      this.updateThemeLabel();
      this.refreshAll();
    });
  },

  /* ----- Tabs ----- */
  bindTabs() {
    document.querySelectorAll(".tabs__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll(".tabs__btn").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        document.querySelectorAll(".tab-panel").forEach((panel) => {
          const active = panel.id === `tab-${tab}`;
          panel.classList.toggle("is-active", active);
          panel.hidden = !active;
        });
        if (tab === "dashboard") this.renderDashboard();
      });
    });
  },

  /* ----- Dashboard ----- */
  bindDashboard() {
    document.getElementById("dashboard-period").addEventListener("change", () => {
      this.renderDashboard();
    });
  },

  renderDashboard() {
    const period = document.getElementById("dashboard-period").value;
    const totals = Transactions.getTotals(period);

    document.getElementById("stat-income").textContent = Utils.formatSum(totals.income);
    document.getElementById("stat-expense").textContent = Utils.formatSum(totals.expense);

    const balanceEl = document.getElementById("stat-balance");
    balanceEl.textContent = Utils.formatSum(totals.balance);
    balanceEl.classList.toggle("is-negative", totals.balance < 0);

    const monthly = Transactions.getMonthlySeries(6);
    Charts.drawMonthlyBars(document.getElementById("chart-monthly"), monthly);

    const byCat = Transactions.getExpenseByCategory(period);
    Charts.drawDoughnut(
      document.getElementById("chart-categories"),
      byCat,
      document.getElementById("chart-legend")
    );

    const recent = Transactions.getAll().slice(0, 5);
    const tbody = document.getElementById("recent-transactions");
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">${I18n.t("recent.empty")}</td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map((t) => this.transactionRowHtml(t, false)).join("");
  },

  /* ----- Transactions ----- */
  bindTransactionsUI() {
    const modal = document.getElementById("modal-transaction");
    const form = document.getElementById("form-transaction");

    document.getElementById("btn-add-transaction").addEventListener("click", () => {
      this.openTransactionModal();
    });

    document.getElementById("btn-cancel-transaction").addEventListener("click", () => {
      modal.close();
    });

    document.getElementById("tx-type").addEventListener("change", () => {
      this.fillTxCategorySelect(document.getElementById("tx-type").value);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById("tx-id").value;
        const payload = {
          type: document.getElementById("tx-type").value,
          amount: document.getElementById("tx-amount").value,
          categoryId: document.getElementById("tx-category").value,
          date: document.getElementById("tx-date").value,
          description: document.getElementById("tx-description").value,
        };
        if (id) Transactions.update(id, payload);
        else Transactions.create(payload);
        modal.close();
        this.refreshAll();
      } catch (err) {
        alert(Utils.errMessage(err));
      }
    });

    document.getElementById("filter-tx-type").addEventListener("change", () => {
      this.populateCategoryFilters();
      this.renderTransactions();
    });

    ["filter-tx-category", "filter-tx-from", "filter-tx-to"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        this.renderTransactions();
      });
    });

    document.getElementById("btn-reset-filters").addEventListener("click", () => {
      document.getElementById("filter-tx-type").value = "all";
      document.getElementById("filter-tx-category").value = "all";
      document.getElementById("filter-tx-from").value = "";
      document.getElementById("filter-tx-to").value = "";
      this.populateCategoryFilters();
      this.renderTransactions();
    });

    document.getElementById("transactions-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") {
        const tx = Transactions.getById(id);
        if (tx) this.openTransactionModal(tx);
      }
      if (btn.dataset.action === "delete") {
        if (!confirm(I18n.t("confirm.deleteTx"))) return;
        try {
          Transactions.remove(id);
          this.refreshAll();
        } catch (err) {
          alert(Utils.errMessage(err));
        }
      }
    });
  },

  openTransactionModal(tx = null) {
    const modal = document.getElementById("modal-transaction");
    document.getElementById("modal-transaction-title").textContent = tx
      ? I18n.t("modal.tx.edit")
      : I18n.t("modal.tx.new");
    document.getElementById("tx-id").value = tx ? tx.id : "";
    document.getElementById("tx-type").value = tx ? tx.type : "expense";
    document.getElementById("tx-amount").value = tx ? tx.amount : "";
    document.getElementById("tx-date").value = tx ? tx.date : Utils.todayISO();
    document.getElementById("tx-description").value = tx ? tx.description : "";
    this.fillTxCategorySelect(
      document.getElementById("tx-type").value,
      tx ? tx.categoryId : null
    );
    modal.showModal();
  },

  fillTxCategorySelect(type, selectedId = null) {
    const select = document.getElementById("tx-category");
    const cats = Categories.getByType(type);
    if (!cats.length) {
      select.innerHTML = `<option value="">${I18n.t("select.noCategories")}</option>`;
      return;
    }
    select.innerHTML = cats
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${I18n.categoryName(c)}</option>`
      )
      .join("");
  },

  populateCategoryFilters() {
    const type = document.getElementById("filter-tx-type").value;
    const select = document.getElementById("filter-tx-category");
    const prev = select.value;
    const cats =
      type === "all" ? Categories.getAll() : Categories.getByType(type);

    select.innerHTML =
      `<option value="all">${I18n.t("filter.all")}</option>` +
      cats
        .map((c) => `<option value="${c.id}">${I18n.categoryName(c)}</option>`)
        .join("");

    if ([...select.options].some((o) => o.value === prev)) {
      select.value = prev;
    } else {
      select.value = "all";
    }
  },

  renderTransactions() {
    const filters = {
      type: document.getElementById("filter-tx-type").value,
      categoryId: document.getElementById("filter-tx-category").value,
      from: document.getElementById("filter-tx-from").value,
      to: document.getElementById("filter-tx-to").value,
    };
    const list = Transactions.filter(filters);
    const tbody = document.getElementById("transactions-list");
    const empty = document.getElementById("transactions-empty");

    if (!list.length) {
      tbody.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    tbody.innerHTML = list.map((t) => this.transactionRowHtml(t, true)).join("");
  },

  transactionRowHtml(t, withActions) {
    const cat = Categories.getById(t.categoryId);
    const catName = cat
      ? `<span class="cat-dot" style="background:${cat.color}"></span>${I18n.categoryName(cat)}`
      : "—";
    const amountClass = t.type === "income" ? "amount--income" : "amount--expense";
    const prefix = t.type === "income" ? "+" : "−";
    const actions = withActions
      ? `<td>
          <div class="btn-row">
            <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-id="${t.id}">${I18n.t("btn.edit")}</button>
            <button type="button" class="btn btn--danger btn--sm" data-action="delete" data-id="${t.id}">${I18n.t("btn.delete")}</button>
          </div>
        </td>`
      : "";

    return `
      <tr>
        <td>${Utils.formatDate(t.date)}</td>
        <td><span class="badge badge--${t.type}">${Utils.typeLabel(t.type)}</span></td>
        <td>${catName}</td>
        <td>${t.description || "—"}</td>
        <td class="${amountClass}">${prefix}${Utils.formatSum(t.amount)}</td>
        ${actions}
      </tr>`;
  },

  /* ----- Categories ----- */
  bindCategoriesUI() {
    const modal = document.getElementById("modal-category");
    const form = document.getElementById("form-category");

    document.getElementById("btn-add-category").addEventListener("click", () => {
      this.openCategoryModal();
    });

    document.getElementById("btn-cancel-category").addEventListener("click", () => {
      modal.close();
    });

    document.getElementById("filter-cat-type").addEventListener("change", () => {
      this.renderCategories();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById("cat-id").value;
        const payload = {
          name: document.getElementById("cat-name").value,
          type: document.getElementById("cat-type").value,
          color: document.getElementById("cat-color").value,
        };
        if (id) Categories.update(id, payload);
        else Categories.create(payload);
        modal.close();
        this.refreshAll();
      } catch (err) {
        alert(Utils.errMessage(err));
      }
    });

    document.getElementById("categories-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") {
        const cat = Categories.getById(id);
        if (cat) this.openCategoryModal(cat);
      }
      if (btn.dataset.action === "delete") {
        if (!confirm(I18n.t("confirm.deleteCat"))) return;
        try {
          Categories.remove(id);
          this.refreshAll();
        } catch (err) {
          alert(Utils.errMessage(err));
        }
      }
    });
  },

  openCategoryModal(cat = null) {
    const modal = document.getElementById("modal-category");
    document.getElementById("modal-category-title").textContent = cat
      ? I18n.t("modal.cat.edit")
      : I18n.t("modal.cat.new");
    document.getElementById("cat-id").value = cat ? cat.id : "";
    document.getElementById("cat-name").value = cat ? I18n.categoryName(cat) : "";
    document.getElementById("cat-type").value = cat ? cat.type : "expense";
    document.getElementById("cat-color").value = cat ? cat.color : "#2a9d8f";
    document.getElementById("cat-type").disabled = false;
    modal.showModal();
  },

  renderCategories() {
    const type = document.getElementById("filter-cat-type").value;
    let list = Categories.getAll();
    if (type !== "all") list = list.filter((c) => c.type === type);

    const container = document.getElementById("categories-list");
    const empty = document.getElementById("categories-empty");

    if (!list.length) {
      container.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    container.innerHTML = list
      .map(
        (c) => `
        <article class="category-card">
          <div class="category-card__color" style="background:${c.color}"></div>
          <div class="category-card__info">
            <p class="category-card__name">${I18n.categoryName(c)}</p>
            <p class="category-card__type">${Utils.typeLabel(c.type)}</p>
          </div>
          <div class="btn-row">
            <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-id="${c.id}">${I18n.t("btn.edit")}</button>
            <button type="button" class="btn btn--danger btn--sm" data-action="delete" data-id="${c.id}">${I18n.t("btn.delete")}</button>
          </div>
        </article>`
      )
      .join("");
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
