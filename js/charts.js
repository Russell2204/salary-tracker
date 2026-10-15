const Charts = {
  clear(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  _css(name, fallback) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  },

  _theme() {
    return {
      text: this._css("--text", "#1a2e28"),
      muted: this._css("--text-muted", "#5a6f68"),
      grid: this._css("--chart-grid", "#d0ddd6"),
      floor: this._css("--chart-floor", "rgba(208, 221, 214, 0.35)"),
      plate1: this._css("--chart-plate-1", "#ffffff"),
      plate2: this._css("--chart-plate-2", "#eef4f1"),
      chartText: this._css("--chart-text", "#1a2e28"),
      income: this._css("--income", "#1b7f5a"),
      expense: this._css("--expense", "#c44536"),
      border: this._css("--border", "#d0ddd6"),
    };
  },

  /* ----- color helpers ----- */
  _hexToRgb(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    if (hex.startsWith("rgb")) {
      const m = hex.match(/[\d.]+/g);
      if (!m) return { r: 0, g: 0, b: 0 };
      return { r: Number(m[0]), g: Number(m[1]), b: Number(m[2]) };
    }
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },

  _shade(hex, factor) {
    const { r, g, b } = this._hexToRgb(hex);
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const nr = clamp(r * factor);
    const ng = clamp(g * factor);
    const nb = clamp(b * factor);
    return `rgb(${nr},${ng},${nb})`;
  },

  _rgba(hex, alpha) {
    const { r, g, b } = this._hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  /* ----- 3D bar chart ----- */
  drawMonthlyBars(canvas, series) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const depth = 14;
    const pad = { top: 28, right: 20 + depth, bottom: 44, left: 16 };
    this.clear(canvas);

    if (!series.length) {
      this._empty(ctx, w, h, I18n.t("chart.noData"));
      return;
    }

    const maxVal = Math.max(
      1,
      ...series.map((s) => Math.max(s.income, s.expense))
    );
    const theme = this._theme();
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const groupW = chartW / series.length;
    const barW = Math.min(26, groupW * 0.28);

    // floor / base plane
    ctx.fillStyle = theme.floor;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + depth, pad.top + chartH - depth * 0.45);
    ctx.lineTo(w - pad.right + depth, pad.top + chartH - depth * 0.45);
    ctx.lineTo(w - pad.right, pad.top + chartH);
    ctx.closePath();
    ctx.fill();

    // grid lines with slight perspective
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    series.forEach((item, i) => {
      const cx = pad.left + groupW * i + groupW / 2;
      const incomeH = Math.max(
        item.income > 0 ? 4 : 0,
        (item.income / maxVal) * chartH
      );
      const expenseH = Math.max(
        item.expense > 0 ? 4 : 0,
        (item.expense / maxVal) * chartH
      );

      if (incomeH > 0) {
        this._draw3DBar(
          ctx,
          cx - barW - 5,
          pad.top + chartH - incomeH,
          barW,
          incomeH,
          depth,
          theme.income
        );
      }
      if (expenseH > 0) {
        this._draw3DBar(
          ctx,
          cx + 5,
          pad.top + chartH - expenseH,
          barW,
          expenseH,
          depth,
          theme.expense
        );
      }

      ctx.fillStyle = theme.muted;
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(item.label, cx + depth * 0.35, h - 14);
    });

    // 3D legend cubes
    this._drawLegendCube(ctx, pad.left, 8, theme.income);
    ctx.fillStyle = theme.muted;
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(I18n.t("chart.income"), pad.left + 20, 14);

    const expenseLabelX = pad.left + 20 + ctx.measureText(I18n.t("chart.income")).width + 24;
    this._drawLegendCube(ctx, expenseLabelX, 8, theme.expense);
    ctx.fillStyle = theme.muted;
    ctx.fillText(I18n.t("chart.expense"), expenseLabelX + 20, 14);
  },

  _draw3DBar(ctx, x, y, width, height, depth, color) {
    if (height <= 0) return;

    const front = color;
    const top = this._shade(color, 1.28);
    const side = this._shade(color, 0.72);
    const edge = this._shade(color, 0.55);

    // soft shadow on floor
    ctx.fillStyle = "rgba(26, 46, 40, 0.12)";
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2 + depth * 0.4,
      y + height + 3,
      width * 0.55,
      5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // side face (right)
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + depth, y - depth * 0.55);
    ctx.lineTo(x + width + depth, y + height - depth * 0.55);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();

    // top face
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + depth, y - depth * 0.55);
    ctx.lineTo(x + width + depth, y - depth * 0.55);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();

    // front face with vertical gradient
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, this._shade(color, 1.12));
    grad.addColorStop(0.45, front);
    grad.addColorStop(1, this._shade(color, 0.88));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);

    // edge highlight
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

    // top edge shine
    ctx.strokeStyle = this._rgba("#ffffff", 0.35);
    ctx.beginPath();
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x + width - 1, y);
    ctx.stroke();
  },

  _drawLegendCube(ctx, x, y, color) {
    const s = 10;
    const d = 4;
    ctx.fillStyle = this._shade(color, 0.7);
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s + d, y - d * 0.6);
    ctx.lineTo(x + s + d, y + s - d * 0.6);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this._shade(color, 1.25);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d * 0.6);
    ctx.lineTo(x + s + d, y - d * 0.6);
    ctx.lineTo(x + s, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);
  },

  /* ----- 3D doughnut ----- */
  drawDoughnut(canvas, slices, legendEl) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    this.clear(canvas);

    if (legendEl) legendEl.innerHTML = "";

    if (!slices.length) {
      this._empty(ctx, w, h, I18n.t("chart.noExpenses"));
      return;
    }

    const theme = this._theme();
    const total = slices.reduce((sum, s) => sum + s.amount, 0);
    const cx = w / 2;
    const cy = h / 2 - 18;
    const outer = Math.min(w, h) * 0.34;
    const inner = outer * 0.52;
    const thickness = 16;
    const layers = thickness;

    // ground shadow
    ctx.fillStyle = this._rgba(theme.text, 0.14);
    ctx.beginPath();
    ctx.ellipse(cx, cy + thickness + 8, outer * 0.95, outer * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // side walls (bottom layers → top), darker
    for (let layer = layers; layer >= 1; layer--) {
      const ly = cy + layer;
      let start = -Math.PI / 2;
      slices.forEach((slice) => {
        const angle = (slice.amount / total) * Math.PI * 2;
        if (angle <= 0) return;
        this._drawRingSector(
          ctx,
          cx,
          ly,
          inner,
          outer,
          start,
          start + angle,
          this._shade(slice.color, 0.55 + (layers - layer) * 0.012)
        );
        start += angle;
      });
    }

    // top face
    let start = -Math.PI / 2;
    slices.forEach((slice) => {
      const angle = (slice.amount / total) * Math.PI * 2;
      if (angle <= 0) return;
      this._drawRingSector(
        ctx,
        cx,
        cy,
        inner,
        outer,
        start,
        start + angle,
        slice.color
      );

      // highlight arc on top surface
      const mid = start + angle / 2;
      const hx = cx + Math.cos(mid) * ((inner + outer) / 2);
      const hy = cy + Math.sin(mid) * ((inner + outer) / 2) * 0.9;
      const glow = ctx.createRadialGradient(hx, hy, 2, hx, hy, outer * 0.55);
      glow.addColorStop(0, this._rgba("#ffffff", 0.28));
      glow.addColorStop(1, this._rgba("#ffffff", 0));
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outer, start, start + angle);
      ctx.arc(cx, cy, inner, start + angle, start, true);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = glow;
      ctx.fillRect(cx - outer, cy - outer, outer * 2, outer * 2);
      ctx.restore();

      start += angle;
    });

    // inner rim (depth into the hole)
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.strokeStyle = this._rgba(theme.text, 0.18);
    ctx.lineWidth = 2;
    ctx.stroke();

    // outer rim highlight
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // center plate
    const plateGrad = ctx.createRadialGradient(cx - 6, cy - 6, 4, cx, cy, inner * 0.95);
    plateGrad.addColorStop(0, theme.plate1);
    plateGrad.addColorStop(1, theme.plate2);
    ctx.beginPath();
    ctx.arc(cx, cy, inner - 1, 0, Math.PI * 2);
    ctx.fillStyle = plateGrad;
    ctx.fill();
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = theme.chartText;
    ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Utils.formatSum(total), cx, cy);

    if (legendEl) {
      legendEl.innerHTML = slices
        .map(
          (s) => `
          <li class="chart-legend__item">
            <span class="chart-legend__swatch" style="background:${s.color}"></span>
            ${s.name} — ${Utils.formatSum(s.amount)}
          </li>`
        )
        .join("");
    }
  },

  _drawRingSector(ctx, cx, cy, inner, outer, start, end, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, outer, start, end);
    ctx.arc(cx, cy, inner, end, start, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },

  _empty(ctx, w, h, text) {
    const theme = this._theme();
    ctx.fillStyle = theme.muted;
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
  },
};
