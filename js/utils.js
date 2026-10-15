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
    return `${sign}${formatted} сум`;
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
    return type === "income" ? "Доход" : "Расход";
  },

  monthKey(isoDate) {
    return isoDate.slice(0, 7);
  },

  monthLabel(monthKey) {
    const [y, m] = monthKey.split("-");
    const names = [
      "янв", "фев", "мар", "апр", "май", "июн",
      "июл", "авг", "сен", "окт", "ноя", "дек",
    ];
    return `${names[Number(m) - 1]} ${y}`;
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
};
