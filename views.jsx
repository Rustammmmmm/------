/* global React, GEO_DATA, hexPath, scoreColor, formatRub, formatNum, ToggleRow, RangeSlider, Icon, Sparkline, HBar, LineChart, ConfusionMatrix */
const { useState: uS, useMemo: uM, useRef: uR, useEffect: uE, useCallback: uC } = React;

// ════════════════════════════════════════════════════════════════════════
// BASEMAP — общий "Яндекс-стайл" фон, переиспользуется в обзоре и детализации
// ════════════════════════════════════════════════════════════════════════
function MapBase({ showLabels = true, showBlockNumbers = true }) {
  const { MAP_W, MAP_H } = GEO_DATA.geom;
  const { rings, roads, riverPath, districts, parks } = GEO_DATA;

  // Псевдо-улицы внутри городской ткани (детерминированные синусоидальные кривые)
  const sideStreets = uM(() => {
    const out = [];
    // горизонтальные второстепенные
    for (let y = 60; y < MAP_H - 30; y += 28) {
      const ph = (y * 0.013) % (Math.PI * 2);
      const a = 4 + ((y * 7) % 3);
      let d = `M 0 ${y}`;
      for (let x = 0; x <= MAP_W; x += 30) d += ` L ${x} ${y + Math.sin((x * 0.018) + ph) * a}`;
      out.push(d);
    }
    // вертикальные второстепенные
    for (let x = 50; x < MAP_W - 30; x += 32) {
      const ph = (x * 0.019) % (Math.PI * 2);
      const a = 4 + ((x * 5) % 3);
      let d = `M ${x} 0`;
      for (let y = 0; y <= MAP_H; y += 30) d += ` L ${x + Math.sin((y * 0.020) + ph) * a} ${y}`;
      out.push(d);
    }
    return out;
  }, [MAP_W, MAP_H]);

  // Названия улиц по радиальным магистралям
  const streetLabels = uM(() => {
    const names = ["ул. Тверская","Ленинский пр.","Кутузовский пр.","ул. Арбат","Садовое к.","Б. Никитская","ул. Мира","Каширское ш.","Ленинградский пр.","Профсоюзная","ш. Энтузиастов","Дмитровское ш."];
    const result = [];
    roads.forEach((path, i) => {
      const m = path.match(/M (\d+) (\d+) L (\d+) (\d+)/);
      if (!m) return;
      const [, x1, y1, x2, y2] = m.map(Number);
      const mx = x1 + (x2 - x1) * 0.55;
      const my = y1 + (y2 - y1) * 0.55;
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const norm = angle > 90 || angle < -90 ? angle + 180 : angle;
      result.push({ x: mx, y: my, name: names[i % names.length], angle: norm });
    });
    return result;
  }, [roads]);

  // "X квартал" — деревовидно по сетке между кольцами
  const quartals = uM(() => {
    const out = [];
    let n = 12;
    for (let y = 110; y < MAP_H - 90; y += 95) {
      for (let x = 110; x < MAP_W - 90; x += 110) {
        const d = Math.hypot(x - 440, y - 360);
        if (d > 60 && d < 280 && Math.random > -1) {
          out.push({ x: x + ((x * 13) % 17) - 8, y: y + ((y * 7) % 13) - 6, n: n++ });
        }
      }
    }
    return out;
  }, [MAP_W, MAP_H]);

  return (
    <g>
      <defs>
        {/* Тёмный «night-mode» паттерн застройки: едва различимые кварталы поверх navy */}
        <pattern id="city-blocks-dark" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill="#0a1c38"/>
          <rect x="2"  y="2"  width="22" height="16" fill="#0e2548" rx="0.6"/>
          <rect x="26" y="2"  width="28" height="13" fill="#0c1f3e" rx="0.6"/>
          <rect x="2"  y="20" width="16" height="22" fill="#0f2950" rx="0.6"/>
          <rect x="20" y="18" width="13" height="14" fill="#0b1d3a" rx="0.6"/>
          <rect x="36" y="18" width="18" height="12" fill="#0d2444" rx="0.6"/>
          <rect x="20" y="34" width="34" height="20" fill="#0c2142" rx="0.6"/>
          <rect x="2"  y="46" width="16" height="8"  fill="#0e2748" rx="0.6"/>
        </pattern>

        <radialGradient id="map-vignette-cyan" cx="50%" cy="42%" r="62%">
          <stop offset="0%"   stopColor="rgba(0,170,255,0.10)"/>
          <stop offset="55%"  stopColor="rgba(0,170,255,0.02)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)"/>
        </radialGradient>

        {/* Лёгкая «карта-сетка» поверх застройки — как Mapbox Dark */}
        <pattern id="micro-grid" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(135,170,210,0.045)" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* Основа */}
      <rect width={MAP_W} height={MAP_H} fill="#06122a"/>
      <rect width={MAP_W} height={MAP_H} fill="url(#city-blocks-dark)"/>
      <rect width={MAP_W} height={MAP_H} fill="url(#micro-grid)"/>

      {/* Второстепенные улицы — тонкие холодные линии */}
      <g pointerEvents="none">
        {sideStreets.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(160,190,220,0.07)" strokeWidth="1.2"/>
        ))}
      </g>

      {/* Парки — приглушённый тёмно-зелёный */}
      <g pointerEvents="none">
        {parks.map(p => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={p.r} fill="rgba(80,150,90,0.16)" stroke="rgba(130,200,120,0.32)" strokeWidth="0.7"/>
          </g>
        ))}
      </g>

      {/* Кольца (Бульварное / Садовое / ТТК / МКАД) — тёплые «городские артерии» */}
      {rings.map((r, i) => (
        <g key={"r-"+i}>
          <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
            fill="none" stroke="rgba(255,180,90,0.10)"
            strokeWidth={i === rings.length - 1 ? 7 : (i === 0 ? 5 : 6)}
            pointerEvents="none"/>
          <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
            fill="none" stroke="rgba(255,215,150,0.55)"
            strokeWidth={i === rings.length - 1 ? 2 : (i === 0 ? 1.2 : 1.5)}
            pointerEvents="none"/>
        </g>
      ))}

      {/* Радиальные магистрали */}
      {roads.map((d, i) => (
        <g key={"rd-"+i} pointerEvents="none">
          <path d={d} fill="none" stroke="rgba(255,180,90,0.10)" strokeWidth="5"/>
          <path d={d} fill="none" stroke="rgba(255,215,150,0.55)" strokeWidth="1.4"/>
        </g>
      ))}

      {/* Москва-река — глубокий cyan */}
      <path d={riverPath} fill="none" stroke="#0d2e4a" strokeWidth="18" strokeLinecap="round" pointerEvents="none"/>
      <path d={riverPath} fill="none" stroke="#114a72" strokeWidth="14" strokeLinecap="round" pointerEvents="none"/>
      <path d={riverPath} fill="none" stroke="rgba(0,170,255,0.32)" strokeWidth="1.6" strokeLinecap="round" pointerEvents="none"/>

      {/* Виньетка для фокуса в центр */}
      <rect width={MAP_W} height={MAP_H} fill="url(#map-vignette-cyan)" pointerEvents="none"/>

      {/* Названия улиц вдоль магистралей */}
      {showLabels && streetLabels.map((s, i) => (
        <text key={i} x={s.x} y={s.y}
          fontSize="8.5" fontFamily="Inter" fontWeight="500"
          fill="rgba(200,220,240,0.55)"
          stroke="rgba(6,18,42,0.9)" strokeWidth="2.4" paintOrder="stroke"
          textAnchor="middle"
          pointerEvents="none"
          transform={`rotate(${s.angle} ${s.x} ${s.y})`}>
          {s.name}
        </text>
      ))}

      {/* "X квартал" */}
      {showBlockNumbers && quartals.map((q, i) => (
        <text key={i} x={q.x} y={q.y}
          fontSize="7.5" fontFamily="Inter" fontWeight="400"
          fill="rgba(180,200,230,0.28)" textAnchor="middle"
          pointerEvents="none">
          {q.n} квартал
        </text>
      ))}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ATM PIN — pill с лейблом банка + указатель в позицию
// ════════════════════════════════════════════════════════════════════════
function ATMPin({ x, y, label, color, fg = "#fff", large = false }) {
  const charW = large ? 5.2 : 4.4;
  const w = Math.max(large ? 24 : 20, label.length * charW + (large ? 12 : 9));
  const h = large ? 14 : 11.5;
  const pillTop = y - h - 5;
  return (
    <g pointerEvents="none">
      {/* shadow */}
      <ellipse cx={x} cy={y + 1.5} rx={3} ry={1.2} fill="#000" opacity="0.18"/>
      {/* dot at position */}
      <circle cx={x} cy={y} r={2} fill={color} stroke="#fff" strokeWidth="0.8"/>
      {/* pointer */}
      <path d={`M ${x - 3} ${y - 4.5} L ${x} ${y - 1.2} L ${x + 3} ${y - 4.5} Z`} fill={color} stroke="#fff" strokeWidth="0.6"/>
      {/* pill */}
      <rect x={x - w / 2} y={pillTop} width={w} height={h} rx={h / 2}
        fill={color} stroke="#fff" strokeWidth="1.1"/>
      <text x={x} y={pillTop + h * 0.7}
        fontSize={large ? 8 : 7} fontFamily="Inter" fontWeight="800"
        fill={fg} textAnchor="middle" letterSpacing="0.04em">{label}</text>
    </g>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAP CANVAS
// ════════════════════════════════════════════════════════════════════════
function MapCanvas({ hexes, filters, selected, onSelect, geom, baseLayers, hovered, setHovered, pinMode }) {
  const { MAP_W, MAP_H, HEX_R } = geom;
  const { districts, metro, malls } = GEO_DATA;

  return (
    <svg className="map-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="hex-selected-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <MapBase/>
      {/* HEX-сетка (тепловая карта поверх navy-карты) */}
      <g>
        {hexes.map(h => {
          const visible = filters.passVisibility(h);
          const isSelected = selected === h.id;
          const isHovered = hovered === h.id;
          const baseAlpha = pinMode ? 0.42 : 0.78;
          const dimAlpha = pinMode ? 0.06 : 0.12;
          return (
            <polygon
              key={h.id}
              points={hexPath(h.cx, h.cy, HEX_R - 0.6)}
              fill={visible ? scoreColor(h.score, baseAlpha) : scoreColor(h.score, dimAlpha)}
              stroke={isSelected
                ? "#00AAFF"
                : (isHovered
                  ? "rgba(255,255,255,0.85)"
                  : (visible ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.04)"))}
              strokeWidth={isSelected ? 2.4 : (isHovered ? 1.4 : 0.6)}
              filter={isSelected ? "url(#hex-selected-glow)" : undefined}
              className={`hex ${isSelected ? "selected" : ""} ${visible ? "" : "dimmed"} ${h.vtbNear ? "has-vtb" : ""}`}
              onClick={() => onSelect(h.id)}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </g>

      {/* POI: ТЦ */}
      {baseLayers.malls && GEO_DATA.malls.map(m => (
        <g key={m.id} pointerEvents="none">
          <rect x={m.x - 4} y={m.y - 4} width="8" height="8" fill="#c084fc" stroke="#1a0d3e" strokeWidth="1" transform={`rotate(45 ${m.x} ${m.y})`}/>
        </g>
      ))}

      {/* POI: Парки */}
      {baseLayers.parks && GEO_DATA.parks.map(p => (
        <g key={p.id} pointerEvents="none">
          <circle cx={p.x} cy={p.y} r={p.r} fill="rgba(132,204,22,0.10)" stroke="rgba(132,204,22,0.45)" strokeWidth="1" strokeDasharray="2 3"/>
          <circle cx={p.x} cy={p.y} r="3" fill="#84cc16" stroke="#1a2e08" strokeWidth="0.8"/>
        </g>
      ))}

      {/* POI: Строймагазины */}
      {baseLayers.hardware && GEO_DATA.hardwares.map(h => (
        <g key={h.id} pointerEvents="none">
          <rect x={h.x - 4.5} y={h.y - 4.5} width="9" height="9" fill="#f97316" stroke="#3a1c08" strokeWidth="1" rx="1.5"/>
          <text x={h.x} y={h.y + 2.5} fontSize="6" fill="#fff" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">+</text>
        </g>
      ))}

      {/* POI: Остановки НГПТ */}
      {baseLayers.transit && GEO_DATA.transits.map(t => (
        <g key={t.id} pointerEvents="none">
          <circle cx={t.x} cy={t.y} r="1.6" fill="#22c55e" opacity="0.85"/>
        </g>
      ))}

      {/* POI: Метро */}
      {baseLayers.metro && GEO_DATA.metro.map(m => (
        <g key={m.id} pointerEvents="none">
          <circle cx={m.x} cy={m.y} r="4" fill="#ffd166" stroke="#3a2a08" strokeWidth="1.2"/>
          <circle cx={m.x} cy={m.y} r="1.6" fill="#3a2a08"/>
        </g>
      ))}

      {/* POI: ВТБ банкоматы (свои) */}
      {baseLayers.vtb && GEO_DATA.vtbAtms.map(a => (
        <g key={a.id} pointerEvents="none">
          {pinMode
            ? <ATMPin x={a.x} y={a.y} label="ВТБ" color="#1d6fb8" large={true}/>
            : <ATMPin x={a.x} y={a.y} label="ВТБ" color="#1d6fb8"/>
          }
        </g>
      ))}

      {/* POI: Конкуренты */}
      {baseLayers.competitors && GEO_DATA.competitors.map(c => {
        const bankColor = {
          "СБ": "#21a038", "АЛ": "#ef3124", "ТК": "#fcd535",
          "ГП": "#0079c1", "РС": "#e30613"
        }[c.bank] || "#888";
        const bankFg = c.bank === "ТК" ? "#1a1a1a" : "#fff";
        return (
          <g key={c.id} pointerEvents="none">
            {pinMode
              ? <ATMPin x={c.x} y={c.y} label={c.bank} color={bankColor} fg={bankFg} large={true}/>
              : <ATMPin x={c.x} y={c.y} label={c.bank} color={bankColor} fg={bankFg}/>
            }
          </g>
        );
      })}

      {/* Названия районов (поверх всех слоёв) */}
      {districts.slice(0, 14).map(d => (
        <text key={d.name} x={d.cx} y={d.cy}
          fontSize="9.5" fontFamily="Inter" fontWeight="600"
          fill="rgba(220,235,255,0.72)"
          stroke="rgba(6,18,42,0.92)" strokeWidth="2.4" paintOrder="stroke"
          textAnchor="middle"
          pointerEvents="none"
          letterSpacing="0.06em">
          {d.name.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FILTERS PANEL
// ════════════════════════════════════════════════════════════════════════
function FilterPanel({ filters, setFilters, baseLayers, setBaseLayers, hexes, visibleCount, mapMode, setMapMode }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const setLayer = (k, v) => setBaseLayers(L => ({ ...L, [k]: v }));

  const countWithLayer = (predicate) => hexes.filter(predicate).length;

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="panel-header">
        <span><Icon.filter style={{ verticalAlign: -2 }}/> &nbsp;Фильтры</span>
        <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 10.5 }}
          onClick={() => setFilters({ minScore: 80, hideVtb: true, requireMetro: false, requireMall: false, excludeCompetitor: false, requireHardware: false, requirePark: false, requireTransit: false, district: "Все" })}>
          <Icon.reset/> сброс
        </button>
      </div>

      <div className="panel-body" style={{ overflowY: "auto", flex: 1 }}>

        {/* View mode */}
        <div className="filter-section">
          <div className="filter-section-title">Режим карты</div>
          <div className="seg">
            <button className={mapMode === "heatmap" ? "on" : ""} onClick={() => setMapMode("heatmap")}>Heatmap</button>
            <button className={mapMode === "pins" ? "on" : ""} onClick={() => setMapMode("pins")}>Слоты / Пины</button>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
            {mapMode === "heatmap"
              ? "Цвет ячейки = ML-Score потенциала."
              : "Реальные позиции банкоматов с брендом банка-владельца."}
          </div>
        </div>
        {/* Score slider */}
        <div className="filter-section">
          <div className="filter-section-title">Минимальный Score</div>
          <RangeSlider
            value={filters.minScore}
            onChange={(v) => set("minScore", v)}
            min={0} max={99}
            format={(v) => `≥ ${v}%`}
            label="Потенциал ячейки"
          />
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {[50, 70, 85, 95].map(v => (
              <button key={v} className="btn" style={{ flex: 1, padding: "4px 6px", fontSize: 10.5 }} onClick={() => set("minScore", v)}>{v}+</button>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="filter-section">
          <div className="filter-section-title">Слои на карте</div>
          <ToggleRow checked={baseLayers.vtb}        onChange={(v) => setLayer("vtb", v)}        swatch={{ color: "#5fb4ff", round: true }} label="Банкоматы ВТБ"     count={GEO_DATA.vtbAtms.length}/>
          <ToggleRow checked={baseLayers.competitors} onChange={(v) => setLayer("competitors", v)} swatch={{ color: "#ff7a91", round: true }} label="Конкуренты"       count={GEO_DATA.competitors.length}/>
          <ToggleRow checked={baseLayers.metro}      onChange={(v) => setLayer("metro", v)}      swatch={{ color: "#ffd166", round: true }} label="Метро"             count={GEO_DATA.metro.length}/>
          <ToggleRow checked={baseLayers.malls}      onChange={(v) => setLayer("malls", v)}      swatch={{ color: "#c084fc" }} label="Торговые центры"   count={GEO_DATA.malls.length}/>
          <ToggleRow checked={baseLayers.hardware}   onChange={(v) => setLayer("hardware", v)}   swatch={{ color: "#f97316" }} label="Строймагазины"     count={GEO_DATA.hardwares.length}/>
          <ToggleRow checked={baseLayers.parks}      onChange={(v) => setLayer("parks", v)}      swatch={{ color: "#84cc16", round: true }} label="Парки / достопримеч." count={GEO_DATA.parks.length}/>
          <ToggleRow checked={baseLayers.transit}    onChange={(v) => setLayer("transit", v)}    swatch={{ color: "#22c55e", round: true }} label="Остановки НГПТ"   count={GEO_DATA.transits.length}/>
        </div>

        {/* Логика отбора */}
        <div className="filter-section">
          <div className="filter-section-title">Логика отбора</div>
          <ToggleRow checked={filters.hideVtb}            onChange={(v) => set("hideVtb", v)}            label="Скрыть зоны с банкоматом ВТБ" count={countWithLayer(h => !h.vtbNear)}/>
          <ToggleRow checked={filters.excludeCompetitor}  onChange={(v) => set("excludeCompetitor", v)}  label="Без конкурентов в радиусе"     count={countWithLayer(h => !h.competitorNear)}/>
          <ToggleRow checked={filters.requireMetro}       onChange={(v) => set("requireMetro", v)}       label="Только зоны у метро"          count={countWithLayer(h => h.metroNear)}/>
          <ToggleRow checked={filters.requireMall}        onChange={(v) => set("requireMall", v)}        label="Только зоны с ТЦ"             count={countWithLayer(h => h.mallNear)}/>
          <ToggleRow checked={filters.requireHardware}    onChange={(v) => set("requireHardware", v)}    label="Рядом со строймагазином"      count={countWithLayer(h => h.hardwareNear)}/>
          <ToggleRow checked={filters.requirePark}        onChange={(v) => set("requirePark", v)}        label="Рядом с парком / достопримеч." count={countWithLayer(h => h.parkNear)}/>
          <ToggleRow checked={filters.requireTransit}     onChange={(v) => set("requireTransit", v)}     label="Узел наземного транспорта"    count={countWithLayer(h => h.transitNear)}/>
        </div>

        {/* Округ / район */}
        <div className="filter-section">
          <div className="filter-section-title">Административный округ</div>
          <div className="seg">
            {["Все", "ЦАО", "САО", "ЮАО"].map(o => (
              <button key={o} className={filters.district === o ? "on" : ""} onClick={() => set("district", o)}>{o}</button>
            ))}
          </div>
        </div>

        {/* Поиск */}
        <div className="filter-section">
          <div className="filter-section-title">Поиск</div>
          <div style={{ position: "relative" }}>
            <Icon.search style={{ position: "absolute", left: 9, top: 8, color: "var(--ink-3)" }}/>
            <input
              type="text"
              placeholder="h3-индекс или адрес"
              style={{
                width: "100%", padding: "7px 8px 7px 28px",
                background: "var(--bg-2)", border: "1px solid var(--line)",
                borderRadius: 4, color: "var(--ink-0)", fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
            />
          </div>
        </div>

        {/* Результаты */}
        <div style={{
          padding: "10px 12px",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 5,
          marginTop: 6,
        }}>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Подходит ячеек</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--teal)" }}>
            {visibleCount.toLocaleString("ru")}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-2)" }}>
            из {hexes.length.toLocaleString("ru")} в регионе
          </div>
        </div>

      </div>

      <div style={{ padding: 10, borderTop: "1px solid var(--line)", display: "flex", gap: 6 }}>
        <button className="btn btn-primary btn-block">Сформировать шорт-лист</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LOCATION CARD (right panel)
// ════════════════════════════════════════════════════════════════════════
function LocationCard({ hex, rank, totalRanked }) {
  if (!hex) {
    return (
      <div className="panel empty-card">
        <div className="glyph"><Icon.hex/></div>
        <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Выберите ячейку на карте</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.5, maxWidth: 240 }}>
          Кликните по гексу, чтобы увидеть прогноз транзакций, ключевые факторы и рекомендацию модели.
        </div>
      </div>
    );
  }

  const verdict = hex.score >= 0.85 ? "go" : (hex.score >= 0.65 ? "watch" : "skip");
  const verdictText = verdict === "go" ? "Рекомендовано к установке" : verdict === "watch" ? "Кандидат, требует проверки" : "Низкий потенциал";
  const c = scoreColor(hex.score, 1);

  return (
    <div className="panel card-scroll" style={{ display: "flex", flexDirection: "column" }}>
      <div className="panel-header">
        <span>Карточка локации</span>
        <span className="meta">кликом по карте</span>
      </div>

      {/* Score header */}
      <div className="card-score">
        <div>
          <div className="score-label">ML-Score</div>
          <div className="score-big" style={{ color: c }}>{(hex.score * 100).toFixed(0)}<span style={{ fontSize: 22, color: "var(--ink-2)", marginLeft: 4 }}>/100</span></div>
        </div>
        {rank && (
          <div className="rank-pill">#{rank} из {totalRanked}</div>
        )}
      </div>
      <div style={{ padding: "0 14px 12px", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{
          padding: "3px 9px",
          background: verdict === "go" ? "rgba(88,214,141,0.14)" : verdict === "watch" ? "rgba(255,180,84,0.14)" : "rgba(255,106,90,0.14)",
          color: verdict === "go" ? "var(--green)" : verdict === "watch" ? "var(--amber)" : "var(--red)",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
        }}>● {verdictText}</span>
      </div>

      {/* H3 index */}
      <div className="h3-id">
        <span className="label">h3_index</span>
        <span style={{ color: "var(--ink-0)" }}>{hex.id}</span>
        <button className="copy-btn">copy</button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="lbl">Прогноз транзакций</div>
          <div className="val">{formatNum(hex.txCount)}</div>
          <div className="sub">в месяц</div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Оборот</div>
          <div className="val">{formatRub(hex.txSum)}</div>
          <div className="sub">прогноз/мес</div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Уник. клиенты ВТБ</div>
          <div className="val">{formatNum(hex.uniqueClients)}</div>
          <div className="sub">в зоне</div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Плотность нас.</div>
          <div className="val">{(hex.pop / 1000).toFixed(1)}к</div>
          <div className="sub">чел / км²</div>
        </div>
      </div>

      {/* Factors */}
      <div style={{ padding: "12px 14px 4px", borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Ключевые факторы</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>SHAP</span>
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          {hex.factors.slice(0, 6).map((f, i) => {
            const maxW = Math.max(...hex.factors.map(x => Math.abs(x.weight)));
            const pct = Math.abs(f.weight) / maxW * 100;
            const positive = f.sign > 0;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-1)", marginBottom: 2 }}>
                  <span>
                    <span style={{ color: positive ? "var(--teal)" : "var(--red)", fontFamily: "JetBrains Mono", marginRight: 6 }}>{positive ? "+" : "−"}</span>
                    {f.label}
                  </span>
                  <span className="mono" style={{ color: "var(--ink-2)", fontSize: 10.5 }}>
                    {positive ? "+" : "−"}{(Math.abs(f.weight)).toFixed(2)}
                  </span>
                </div>
                <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: pct + "%", background: positive ? "var(--teal)" : "var(--red)", opacity: 0.7, borderRadius: 100 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nearby */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", marginTop: 10 }}>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Окружение (R 250м)</div>
        {[
          { label: "Банкоматы ВТБ",      color: "#5fb4ff", count: hex.vtbNear ? 2 : 0, status: hex.vtbNear ? "⚠ каннибализация" : "—" },
          { label: "Банкоматы конкурентов", color: "#ff7a91", count: hex.competitorNear ? 4 : 1 },
          { label: "Метро",              color: "#ffd166", count: hex.metroNear ? 1 : 0, status: hex.metroNear ? "✓ трафик" : "—" },
          { label: "Торговые центры",     color: "#c084fc", count: hex.mallNear ? 1 : 0 },
          { label: "Бизнес-центры",       color: "#7dd3fc", count: hex.bcNear ? Math.floor(2 + Math.random()*2) : 0 },
          { label: "Строймагазины",      color: "#f97316", count: hex.hardwareNear ? 1 : 0, status: hex.hardwareNear ? "✓ наличные" : "—" },
          { label: "Парки / достопримеч.", color: "#84cc16", count: hex.parkNear ? 1 : 0 },
          { label: "Остановки НГПТ",     color: "#22c55e", count: hex.transitNear ? Math.floor(2 + Math.random()*3) : 0 },
        ].map((n, i) => (
          <div className="nearby-row" key={i}>
            <span className="swatch round" style={{ background: n.color }}/>
            <span>{n.label}</span>
            <span className="dist">{n.count}</span>
            {n.status && <span style={{ fontSize: 10.5, color: n.status.startsWith("⚠") ? "var(--amber)" : "var(--ink-3)", marginLeft: 6 }}>{n.status}</span>}
          </div>
        ))}
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed var(--line)", fontSize: 11, color: "var(--ink-2)" }}>
          Район: <span style={{ color: "var(--ink-0)" }}>{hex.district}</span>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <div className="cta-block">
        <button className="btn btn-primary" style={{ flex: 1 }}>Передать в работу</button>
        <button className="btn"><Icon.bookmark/></button>
        <button className="btn"><Icon.ext/></button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAP VIEW (combined layout)
// ════════════════════════════════════════════════════════════════════════
function MapView({ selected, setSelected }) {
  const { hexes, geom } = GEO_DATA;
  const [filters, setFilters] = uS({
    minScore: 80,
    hideVtb: true,
    requireMetro: false,
    requireMall: false,
    excludeCompetitor: false,
    requireHardware: false,
    requirePark: false,
    requireTransit: false,
    district: "Все",
  });
  const [baseLayers, setBaseLayers] = uS({ vtb: true, competitors: true, metro: true, malls: false, hardware: false, parks: false, transit: false });
  const [hovered, setHovered] = uS(null);
  const [mapMode, setMapMode] = uS("heatmap");
  const mapRef = uR(null);

  // Filter logic
  const passVisibility = (h) => {
    if (h.score * 100 < filters.minScore) return false;
    if (filters.hideVtb && h.vtbNear) return false;
    if (filters.excludeCompetitor && h.competitorNear) return false;
    if (filters.requireMetro && !h.metroNear) return false;
    if (filters.requireMall && !h.mallNear) return false;
    if (filters.requireHardware && !h.hardwareNear) return false;
    if (filters.requirePark && !h.parkNear) return false;
    if (filters.requireTransit && !h.transitNear) return false;
    return true;
  };
  filters.passVisibility = passVisibility;

  const visible = uM(() => hexes.filter(passVisibility), [hexes, filters.minScore, filters.hideVtb, filters.requireMetro, filters.requireMall, filters.excludeCompetitor, filters.requireHardware, filters.requirePark, filters.requireTransit]);

  const ranked = uM(() => [...visible].sort((a, b) => b.score - a.score), [visible]);
  const selectedHex = hexes.find(h => h.id === selected);
  const rank = selectedHex ? ranked.findIndex(h => h.id === selected) + 1 : null;

  // Hovered tooltip position
  const hoveredHex = hexes.find(h => h.id === hovered);
  const tipPos = uM(() => {
    if (!hoveredHex || !mapRef.current) return null;
    const svgEl = mapRef.current.querySelector("svg");
    if (!svgEl) return null;
    const rect = mapRef.current.getBoundingClientRect();
    const sx = rect.width / geom.MAP_W;
    const sy = rect.height / geom.MAP_H;
    const s = Math.min(sx, sy);
    const offsetX = (rect.width - geom.MAP_W * s) / 2;
    const offsetY = (rect.height - geom.MAP_H * s) / 2;
    return { x: offsetX + hoveredHex.cx * s + 14, y: offsetY + hoveredHex.cy * s + 14 };
  }, [hoveredHex, geom]);

  return (
    <div className="map-shell">
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        baseLayers={baseLayers}
        setBaseLayers={setBaseLayers}
        hexes={hexes}
        visibleCount={visible.length}
        mapMode={mapMode}
        setMapMode={setMapMode}
      />

      <div className="map-panel" ref={mapRef}>
        <MapCanvas
          hexes={hexes}
          filters={filters}
          selected={selected}
          onSelect={setSelected}
          geom={geom}
          baseLayers={baseLayers}
          hovered={hovered}
          setHovered={setHovered}
          pinMode={mapMode === "pins"}
        />

        {/* Map overlays */}
        <div className="map-overlay tl">
          <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Геопотенциал · 12.05.2026</div>
          <div className="display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>Москва — H3 res 9</div>
        </div>

        <div className="map-controls">
          <button className="map-btn"><Icon.plus/></button>
          <button className="map-btn"><Icon.minus/></button>
          <button className="map-btn"><Icon.layers/></button>
        </div>

        {/* Legend */}
        <div className="legend">
          <div className="legend-title">{mapMode === "pins" ? "Банкоматы и POI" : "ML Score"}</div>
          {mapMode === "heatmap" && (
            <>
              <div className="gradient-bar"></div>
              <div className="gradient-scale">
                <span>0.0</span><span>0.3</span><span>0.5</span><span>0.7</span><span>1.0</span>
              </div>
            </>
          )}
          <div className="legend-pois">
            <div><span className="swatch round" style={{ background: "#1d6fb8" }}/> Банкомат ВТБ</div>
            <div><span className="swatch round" style={{ background: "#21a038" }}/> Сбер · СБ</div>
            <div><span className="swatch round" style={{ background: "#ef3124" }}/> Альфа · АЛ</div>
            <div><span className="swatch round" style={{ background: "#fcd535" }}/> Т-Банк · ТК</div>
            <div><span className="swatch round" style={{ background: "#0079c1" }}/> Газпромб · ГП</div>
            <div><span className="swatch round" style={{ background: "#ffd166" }}/> Метро</div>
            <div><span className="swatch" style={{ background: "#c084fc" }}/> ТЦ</div>
            <div><span className="swatch round" style={{ background: "#84cc16" }}/> Парки</div>
          </div>
        </div>

        {/* Tooltip on hover */}
        {hoveredHex && tipPos && (
          <div className="map-tip" style={{ left: tipPos.x, top: tipPos.y }}>
            <div className="tip-id">{hoveredHex.id.slice(0, 12)}…</div>
            <div className="tip-row"><span className="k">Score</span><span className="v" style={{ color: scoreColor(hoveredHex.score, 1) }}>{(hoveredHex.score * 100).toFixed(0)}</span></div>
            <div className="tip-row"><span className="k">Транзакций/мес</span><span className="v">{formatNum(hoveredHex.txCount)}</span></div>
            <div className="tip-row"><span className="k">Район</span><span className="v">{hoveredHex.district}</span></div>
            {hoveredHex.vtbNear && <div className="tip-row" style={{ color: "var(--amber)" }}><span>⚠ есть банкомат ВТБ</span></div>}
          </div>
        )}
      </div>

      <LocationCard hex={selectedHex} rank={rank} totalRanked={ranked.length}/>
    </div>
  );
}

window.MapView = MapView;
window.MapBase = MapBase;
window.ATMPin = ATMPin;
