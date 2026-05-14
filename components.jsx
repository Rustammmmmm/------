/* global React */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Icons ─────────────────────────────────────────────────────────────
const Icon = {
  hex: (p) =>
  <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" />
    </svg>,

  list: (p) =>
  <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>,

  chart: (p) =>
  <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3 V21 H21" /><path d="M7 15 L11 10 L14 13 L20 6" />
    </svg>,

  layers: (p) =>
  <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3 L22 8 L12 13 L2 8 Z" /><path d="M2 13 L12 18 L22 13" /><path d="M2 18 L12 23 L22 18" />
    </svg>,

  filter: (p) =>
  <svg viewBox="0 0 24 24" width="13" height="13" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 5 H21 L14 13 V21 L10 19 V13 Z" />
    </svg>,

  search: (p) =>
  <svg viewBox="0 0 24 24" width="13" height="13" {...p} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>,

  plus: (p) => <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  minus: (p) => <svg viewBox="0 0 24 24" width="14" height="14" {...p} fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  reset: (p) => <svg viewBox="0 0 24 24" width="13" height="13" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" /></svg>,
  ext: (p) => <svg viewBox="0 0 24 24" width="12" height="12" {...p} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 L17 7" /><polyline points="8 7 17 7 17 16" /></svg>,
  download: (p) => <svg viewBox="0 0 24 24" width="13" height="13" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3 V15" /><polyline points="7 11 12 16 17 11" /><path d="M4 19 H20" /></svg>,
  bookmark: (p) => <svg viewBox="0 0 24 24" width="13" height="13" {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3 H18 V22 L12 17 L6 22 Z" /></svg>
};

// ─── Brand ─────────────────────────────────────────────────────────────
function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ee2d4" />
          <stop offset="100%" stopColor="#1a89a8" />
        </linearGradient>
      </defs>
      <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill="url(#bm-grad)" opacity="0.18" />
      <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill="none" stroke="url(#bm-grad)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.2" fill="#5ee2d4" />
    </svg>);

}

// ─── Top bar ───────────────────────────────────────────────────────────
function TopBar({ tab, setTab }) {
  const tabs = [
  { id: "map", label: "Карта потенциала", icon: Icon.hex, badge: "3 042" },
  { id: "detail", label: "Детализация ячейки", icon: Icon.list },
  { id: "metrics", label: "Метрики модели", icon: Icon.chart }];

  return (
    <div className="topbar">
      <div className="brand">
        <BrandMark size={22} />
        <span>Хайп хаус</span>
        <span className="brand-tag"> МСК</span>
      </div>
      <div className="nav-tabs">
        {tabs.map((t) =>
        <button
          key={t.id}
          className={`nav-tab ${tab === t.id ? "active" : ""}`}
          onClick={() => setTab(t.id)}>
          
            <t.icon /> {t.label}
            {t.badge ? <span className="badge">{t.badge}</span> : null}
          </button>
        )}
      </div>
      <div className="topbar-right">
        <span className="pill"><span className="dot"></span>Модель обновлена 12.05.2026</span>
        <button className="btn btn-ghost" title="Экспорт"><Icon.download /></button>
        <div className="avatar">АК</div>
      </div>
    </div>);

}

// ─── Status bar ────────────────────────────────────────────────────────
function StatusBar({ visibleCount, totalCount, selected }) {
  return (
    <div className="statusbar">
      <span>● <span className="ok">PIPELINE: OK</span></span>
      <span className="sep">│</span>
      <span>H3 res 9 · ~0.105 км²/ячейка</span>
      <span className="sep">│</span>
      <span>видно ячеек: {visibleCount.toLocaleString("ru")} / {totalCount.toLocaleString("ru")}</span>
      <span className="sep">│</span>
      <span>ROC-AUC 0.823 · target ≥ 0.75</span>
      <span style={{ marginLeft: "auto" }}>{selected ? `выбрано: ${selected}` : "регион: Москва (ЦАО + примыкающие округа)"}</span>
    </div>);

}

// ─── Sparkline ─────────────────────────────────────────────────────────
function Sparkline({ values, w = 70, h = 28, color = "#2ad4c4", fill = true }) {
  if (!values || !values.length) return null;
  const max = Math.max(...values),min = Math.min(...values);
  const norm = (v) => max === min ? 0.5 : (v - min) / (max - min);
  const pts = values.map((v, i) => {
    const x = i / (values.length - 1) * w;
    const y = h - 2 - norm(v) * (h - 4);
    return [x, y];
  });
  const d = "M " + pts.map((p) => p.join(" ")).join(" L ");
  const fillPath = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && <path d={fillPath} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>);

}

// ─── Toggle row (checkbox + label + count + swatch) ────────────────────
function ToggleRow({ checked, onChange, swatch, label, count, dashed }) {
  return (
    <label className="filter-row" style={{ cursor: "pointer" }}>
      <input type="checkbox" className="check" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {swatch &&
      <span
        className={`swatch ${swatch.round ? "round" : ""}`}
        style={{
          background: swatch.color,
          border: dashed ? `1px dashed ${swatch.color}` : "none",
          backgroundClip: dashed ? "padding-box" : undefined
        }} />

      }
      <span>{label}</span>
      {count != null && <span className="count">{count}</span>}
    </label>);

}

// ─── Range slider ──────────────────────────────────────────────────────
function RangeSlider({ value, onChange, min = 0, max = 100, format = (v) => v, label }) {
  const pct = (value - min) / (max - min) * 100;
  return (
    <div className="slider-wrap">
      <div className="slider-head">
        <span>{label}</span>
        <span className="val">{format(value)}</span>
      </div>
      <input
        type="range"
        className="range-slider"
        min={min} max={max} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ "--pct": pct + "%" }} />
      
    </div>);

}

// ─── Bar chart (horizontal, for feature importance) ────────────────────
function HBar({ items, max, color = "#2ad4c4", height = 18, format }) {
  const m = max ?? Math.max(...items.map((i) => Math.abs(i.value)));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {items.map((it, i) => {
        const v = it.value;
        const pct = Math.abs(v) / m * 100;
        const c = it.color || (v < 0 ? "#ff6a5a" : color);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 60px", gap: 8, alignItems: "center", fontSize: 11 }}>
            <span style={{ color: "var(--ink-1)" }}>{it.label}</span>
            <div style={{ position: "relative", height, background: "var(--bg-2)", borderRadius: 3 }}>
              <div style={{
                position: "absolute", left: v < 0 ? `${100 - pct}%` : "0%",
                width: pct + "%", height: "100%",
                background: c, opacity: 0.85, borderRadius: 3
              }} />
            </div>
            <span className="mono" style={{ textAlign: "right", color: "var(--ink-2)", fontSize: 10.5 }}>
              {format ? format(v) : v.toFixed(2)}
            </span>
          </div>);

      })}
    </div>);

}

// ─── Line chart (ROC curve etc) ────────────────────────────────────────
function LineChart({ data, w = 360, h = 240, xLabel, yLabel, refLine }) {
  const padL = 36,padB = 28,padT = 12,padR = 12;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const px = (v) => padL + v * cw;
  const py = (v) => padT + (1 - v) * ch;
  const pts = data.map((d) => [px(d.x), py(d.y)]);
  const path = "M " + pts.map((p) => p.join(" ")).join(" L ");
  const fillPath = `${path} L ${px(1)} ${py(0)} L ${px(0)} ${py(0)} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) =>
      <g key={"g" + t}>
          <line x1={padL} x2={w - padR} y1={py(t)} y2={py(t)} stroke="rgba(255,255,255,0.05)" />
          <text x={padL - 6} y={py(t) + 3} fontSize="9" fill="#5d738f" textAnchor="end" fontFamily="JetBrains Mono">{t.toFixed(1)}</text>
        </g>
      )}
      {[0, 0.25, 0.5, 0.75, 1].map((t) =>
      <g key={"v" + t}>
          <line x1={px(t)} x2={px(t)} y1={padT} y2={h - padB} stroke="rgba(255,255,255,0.04)" />
          <text x={px(t)} y={h - padB + 14} fontSize="9" fill="#5d738f" textAnchor="middle" fontFamily="JetBrains Mono">{t.toFixed(1)}</text>
        </g>
      )}
      {/* axis labels */}
      <text x={(padL + w - padR) / 2} y={h - 4} fontSize="10" fill="#8ea2bf" textAnchor="middle">{xLabel}</text>
      <text x={10} y={(padT + h - padB) / 2} fontSize="10" fill="#8ea2bf" textAnchor="middle" transform={`rotate(-90, 10, ${(padT + h - padB) / 2})`}>{yLabel}</text>
      {/* reference */}
      {refLine &&
      <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke="#5d738f" strokeDasharray="3 4" strokeWidth="1" />
      }
      {/* curve */}
      <path d={fillPath} fill="#2ad4c4" opacity="0.12" />
      <path d={path} fill="none" stroke="#2ad4c4" strokeWidth="2" />
    </svg>);

}

// ─── Confusion matrix ──────────────────────────────────────────────────
function ConfusionMatrix({ matrix }) {
  // matrix: [[tn, fp],[fn, tp]]
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const max = Math.max(...matrix.flat());
  const labels = ["Прогноз: 0", "Прогноз: 1"];
  const ylabels = ["Факт: 0", "Факт: 1"];
  const cellMeta = [["TN", "FP"], ["FN", "TP"]];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 4 }}>
        <div></div>
        {labels.map((l) => <div key={l} style={{ fontSize: 10.5, color: "var(--ink-3)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>)}
        {matrix.map((row, ri) =>
        <React.Fragment key={ri}>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center" }}>{ylabels[ri]}</div>
            {row.map((v, ci) => {
            const isCorrect = ri === ci;
            const intensity = v / max;
            return (
              <div key={ci} style={{
                background: isCorrect ? `rgba(42,212,196,${0.1 + intensity * 0.45})` : `rgba(255,106,90,${0.1 + intensity * 0.45})`,
                border: `1px solid ${isCorrect ? "rgba(42,212,196,0.5)" : "rgba(255,106,90,0.5)"}`,
                borderRadius: 4,
                padding: "14px 8px",
                textAlign: "center"
              }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{cellMeta[ri][ci]}</div>
                  <div className="display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "2px 0" }}>{v.toLocaleString("ru")}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-2)" }}>{(v / total * 100).toFixed(1)}%</div>
                </div>);

          })}
          </React.Fragment>
        )}
      </div>
    </div>);

}

Object.assign(window, { Icon, BrandMark, TopBar, StatusBar, Sparkline, ToggleRow, RangeSlider, HBar, LineChart, ConfusionMatrix });