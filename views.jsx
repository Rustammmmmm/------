/* global React, GEO_DATA, hexPath, scoreColor, formatRub, formatNum, ToggleRow, RangeSlider, Icon, Sparkline, HBar, LineChart, ConfusionMatrix */
const { useState: uS, useMemo: uM, useRef: uR, useEffect: uE, useCallback: uC } = React;

// ════════════════════════════════════════════════════════════════════════
// MAP CANVAS
// ════════════════════════════════════════════════════════════════════════
function MapCanvas({ hexes, filters, selected, onSelect, geom, baseLayers, hovered, setHovered }) {
  const { MAP_W, MAP_H, HEX_R } = geom;
  const { rings, roads, riverPath, districts, metro, malls, vtbAtms, competitors } = GEO_DATA;

  return (
    <svg className="map-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="map-vignette" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0f2a4a" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#06101e" stopOpacity="0"/>
        </radialGradient>
        <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(120,170,220,0.04)" strokeWidth="1"/>
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="1.4"/></filter>
      </defs>

      <rect width={MAP_W} height={MAP_H} fill="url(#city-grid)"/>
      <rect width={MAP_W} height={MAP_H} fill="url(#map-vignette)"/>

      {/* Кольцевые контуры */}
      {rings.map((r, i) => (
        <ellipse key={i}
          cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
          fill="none"
          stroke="rgba(140,180,220,0.08)"
          strokeWidth={i === rings.length - 1 ? 1.4 : 0.8}
          strokeDasharray={i === rings.length - 1 ? "none" : "3 5"}
        />
      ))}

      {/* Радиальные магистрали */}
      {roads.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(140,180,220,0.07)" strokeWidth="1"/>
      ))}

      {/* Москва-река */}
      <path d={riverPath} fill="none" stroke="rgba(75,150,210,0.32)" strokeWidth="14" strokeLinecap="round"/>
      <path d={riverPath} fill="none" stroke="rgba(120,200,240,0.18)" strokeWidth="1" strokeLinecap="round"/>

      {/* HEX-сетка */}
      <g>
        {hexes.map(h => {
          const visible = filters.passVisibility(h);
          const isSelected = selected === h.id;
          const isHovered = hovered === h.id;
          return (
            <polygon
              key={h.id}
              points={hexPath(h.cx, h.cy, HEX_R - 1)}
              fill={visible ? scoreColor(h.score, 0.85) : scoreColor(h.score, 0.55)}
              stroke={isSelected ? "#f4f8ff" : (visible ? "rgba(255,255,255,0.06)" : "rgba(40,70,110,0.2)")}
              strokeWidth={isSelected ? 2.4 : (isHovered ? 1.6 : 0.6)}
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
          <circle cx={a.x} cy={a.y} r="5" fill="rgba(95,180,255,0.18)" stroke="rgba(95,180,255,0.8)" strokeWidth="1"/>
          <circle cx={a.x} cy={a.y} r="2" fill="#5fb4ff"/>
        </g>
      ))}

      {/* POI: Конкуренты */}
      {baseLayers.competitors && GEO_DATA.competitors.map(c => (
        <g key={c.id} pointerEvents="none">
          <circle cx={c.x} cy={c.y} r="2.5" fill="#ff7a91" stroke="#3a0c1a" strokeWidth="0.8"/>
        </g>
      ))}

      {/* Названия районов (всегда) */}
      {districts.slice(0, 12).map(d => (
        <text key={d.name} x={d.cx} y={d.cy}
          fontSize="9.5" fontFamily="Inter" fontWeight="500"
          fill="rgba(180,205,235,0.4)" textAnchor="middle"
          pointerEvents="none"
          letterSpacing="0.05em">
          {d.name.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FILTERS PANEL
// ════════════════════════════════════════════════════════════════════════
function FilterPanel({ filters, setFilters, baseLayers, setBaseLayers, hexes, visibleCount }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const setLayer = (k, v) => setBaseLayers(L => ({ ...L, [k]: v }));

  const countWithLayer = (predicate) => hexes.filter(predicate).length;

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="panel-header">
        <span><Icon.filter style={{ verticalAlign: -2 }}/> &nbsp;Фильтры</span>
        <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 10.5 }}
          onClick={() => setFilters({ minScore: 80, hideVtb: true, requireMetro: false, requireMall: false, excludeCompetitor: false, district: "Все" })}>
          <Icon.reset/> сброс
        </button>
      </div>

      <div className="panel-body" style={{ overflowY: "auto", flex: 1 }}>

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
        </div>

        {/* Логика отбора */}
        <div className="filter-section">
          <div className="filter-section-title">Логика отбора</div>
          <ToggleRow checked={filters.hideVtb}            onChange={(v) => set("hideVtb", v)}            label="Скрыть зоны с банкоматом ВТБ" count={countWithLayer(h => !h.vtbNear)}/>
          <ToggleRow checked={filters.excludeCompetitor}  onChange={(v) => set("excludeCompetitor", v)}  label="Без конкурентов в радиусе"     count={countWithLayer(h => !h.competitorNear)}/>
          <ToggleRow checked={filters.requireMetro}       onChange={(v) => set("requireMetro", v)}       label="Только зоны у метро"          count={countWithLayer(h => h.metroNear)}/>
          <ToggleRow checked={filters.requireMall}        onChange={(v) => set("requireMall", v)}        label="Только зоны с ТЦ"             count={countWithLayer(h => h.mallNear)}/>
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
    district: "Все",
  });
  const [baseLayers, setBaseLayers] = uS({ vtb: true, competitors: false, metro: true, malls: false });
  const [hovered, setHovered] = uS(null);
  const mapRef = uR(null);

  // Filter logic
  const passVisibility = (h) => {
    if (h.score * 100 < filters.minScore) return false;
    if (filters.hideVtb && h.vtbNear) return false;
    if (filters.excludeCompetitor && h.competitorNear) return false;
    if (filters.requireMetro && !h.metroNear) return false;
    if (filters.requireMall && !h.mallNear) return false;
    return true;
  };
  filters.passVisibility = passVisibility;

  const visible = uM(() => hexes.filter(passVisibility), [hexes, filters.minScore, filters.hideVtb, filters.requireMetro, filters.requireMall, filters.excludeCompetitor]);

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
          <div className="legend-title">ML Score</div>
          <div className="gradient-bar"></div>
          <div className="gradient-scale">
            <span>0.0</span><span>0.3</span><span>0.5</span><span>0.7</span><span>1.0</span>
          </div>
          <div className="legend-pois">
            <div><span className="swatch round" style={{ background: "#5fb4ff" }}/> Банкомат ВТБ</div>
            <div><span className="swatch round" style={{ background: "#ff7a91" }}/> Конкуренты</div>
            <div><span className="swatch round" style={{ background: "#ffd166" }}/> Метро</div>
            <div><span className="swatch" style={{ background: "#c084fc" }}/> ТЦ</div>
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
