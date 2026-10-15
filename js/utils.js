const Utils = {
  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  },

  formatSum(amount) {
    const n = Number(amount) || 0;
    const formatted = Math.round(Math.abs(n))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const sign = n < 0 ? "−" : "";
    return `${sign}${formatted} ${I18n.t("currency")}`;
  },

  formatDate(isoDate) {
    if (!isoDate) return "—";
    const [y, m, d] = isoDate.split("-");
    return `${d}.${m}.${y}`;
  },

  todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  typeLabel(type) {
    return type === "income" ? I18n.t("type.income") : I18n.t("type.expense");
  },

  monthKey(isoDate) {
    return isoDate.slice(0, 7);
  },

  monthLabel(monthKey) {
    const [y, m] = monthKey.split("-");
    return `${I18n.t(`month.${Number(m) - 1}`)} ${y}`;
  },

  isInPeriod(isoDate, period) {
    if (period === "all") return true;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    if (period === "month") {
      return isoDate.startsWith(`${y}-${m}`);
    }
    if (period === "year") {
      return isoDate.startsWith(String(y));
    }
    return true;
  },

  err(key, vars) {
    const error = new Error(key);
    error.i18nKey = key;
    error.i18nVars = vars || {};
    return error;
  },

  errMessage(err) {
    if (err && err.i18nKey) return I18n.t(err.i18nKey, err.i18nVars);
    if (err && err.message && I18n.dictionaries.ru[err.message]) {
      return I18n.t(err.message);
    }
    return (err && err.message) || String(err);
  },
};
