/* global React, GEO_DATA, hexPath, scoreColor, formatRub, formatNum, Icon, Sparkline, HBar, LineChart, ConfusionMatrix, TopBar, StatusBar, MapView */
const { useState: uSt, useMemo: uMe, useEffect: uEf } = React;

// ════════════════════════════════════════════════════════════════════════
// DETAIL VIEW  (one cell, full screen)
// ════════════════════════════════════════════════════════════════════════
function DetailView({ selected, setSelected, setTab }) {
  const { hexes, geom } = GEO_DATA;
  // pick a high-scoring representative if none selected
  const hex = uMe(() => {
    return hexes.find(h => h.id === selected)
      ?? [...hexes].sort((a, b) => b.score - a.score).find(h => !h.vtbNear);
  }, [selected, hexes]);

  if (!hex) return null;
  const c = scoreColor(hex.score, 1);
  const verdict = hex.score >= 0.85 ? "go" : (hex.score >= 0.65 ? "watch" : "skip");
  const verdictText = verdict === "go" ? "Рекомендовано к установке" : verdict === "watch" ? "Кандидат, требует проверки" : "Низкий потенциал";
  const verdictColor = verdict === "go" ? "var(--green)" : verdict === "watch" ? "var(--amber)" : "var(--red)";
  const verdictBg = verdict === "go" ? "rgba(88,214,141,0.14)" : verdict === "watch" ? "rgba(255,180,84,0.14)" : "rgba(255,106,90,0.14)";

  // ML history (sparkline)
  const history = uMe(() => {
    const base = hex.score;
    return Array.from({ length: 12 }, (_, i) => Math.max(0.1, Math.min(0.99, base - 0.18 + i * 0.018 + (Math.sin(i * 1.3) * 0.04))));
  }, [hex.id]);

  // Mini map: zoom to surroundings
  const R = 110;
  const vbX = hex.cx - R, vbY = hex.cy - R, vbW = R * 2, vbH = R * 2;
  const neighbors = hexes.filter(h => Math.abs(h.cx - hex.cx) < R && Math.abs(h.cy - hex.cy) < R);

  const mccEntries = Object.entries(hex.mcc).sort((a, b) => b[1] - a[1]);

  return (
    <div className="detail-shell">
      <div className="detail-grid">

        {/* Hero */}
        <div className="detail-hero">
          <div className="h3-block">
            <div className="h3-glyph">
              <svg width="56" height="56" viewBox="0 0 24 24">
                <polygon points={hexPath(12, 12, 9)} fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.4"/>
                <polygon points={hexPath(12, 12, 4.5)} fill={c}/>
              </svg>
            </div>
            <div className="h3-text">
              <div className="lbl">h3 res 9 · {hex.district}</div>
              <div className="id">{hex.id}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                <span style={{ fontFamily: "Inter" }}>координаты ⌖ 55.7558°N · 37.6173°E</span>
              </div>
            </div>
          </div>
          <div className="score-block">
            <div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>ML-Score</div>
              <div className="score-num" style={{ color: c }}>{(hex.score * 100).toFixed(0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Тренд 12 мес</div>
              <Sparkline values={history} w={140} h={42} color={c} fill={true}/>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <span className="verdict" style={{ background: verdictBg, color: verdictColor, border: `1px solid ${verdictColor}`, padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600 }}>● {verdictText}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setTab("map")}>← К карте</button>
              <button className="btn btn-primary">Передать в работу</button>
            </div>
          </div>
        </div>

        {/* Left: stats + factors */}
        <div style={{ display: "grid", gap: 12 }}>
          <div className="panel">
            <div className="panel-header"><span>Прогноз транзакционной активности</span><span className="meta">3 мес</span></div>
            <div className="panel-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)", margin: -12, marginTop: 0 }}>
                <div style={{ background: "var(--bg-1)", padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Транзакции</div>
                  <div className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{formatNum(hex.txCount)}</div>
                  <div className="mono" style={{ fontSize: 11, color: hex.txCount >= 8000 ? "var(--green)" : "var(--amber)" }}>{hex.txCount >= 8000 ? "в месяц · KPI ≥ 8 тыс ✓" : "в месяц · ниже KPI 8 тыс"}</div>
                </div>
                <div style={{ background: "var(--bg-1)", padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Оборот</div>
                  <div className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{formatRub(hex.txSum)}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>средний чек {Math.round(hex.txSum / hex.txCount).toLocaleString("ru")} ₽</div>
                </div>
                <div style={{ background: "var(--bg-1)", padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Уник. клиенты ВТБ</div>
                  <div className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{formatNum(hex.uniqueClients)}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>уже бывают в зоне</div>
                </div>
                <div style={{ background: "var(--bg-1)", padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Окупаемость</div>
                  <div className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: hex.score >= 0.7 ? "var(--teal)" : "var(--ink-2)" }}>~ {Math.max(6, Math.round(22 - hex.score * 18))} мес</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>при текущей аренде</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span>Декомпозиция Score</span><span className="meta">SHAP local values</span></div>
            <div className="panel-body">
              <HBar
                items={hex.factors.slice(0, 7).map(f => ({
                  label: f.label,
                  value: f.sign * f.weight,
                }))}
                format={(v) => (v >= 0 ? "+" : "") + v.toFixed(3)}
              />
              <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--bg-2)", borderRadius: 4, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                <span style={{ color: "var(--teal)", fontWeight: 600 }}>Главный драйвер:</span> высокий пешеходный трафик у метро и концентрация коммерческой инфраструктуры.
                {hex.competitorNear && <span> Конкуренты рядом частично снижают потенциал.</span>}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span>Распределение трат (MCC)</span><span className="meta">по транзакциям ВТБ в зоне</span></div>
            <div className="panel-body">
              <div style={{ display: "flex", height: 22, borderRadius: 4, overflow: "hidden", background: "var(--bg-2)" }}>
                {mccEntries.map(([k, v], i) => {
                  const colors = ["#2ad4c4", "#7dd3fc", "#a3e635", "#ffd166", "#ffb454", "#c084fc", "#ff7a91", "#5d738f"];
                  return <div key={k} style={{ width: (v * 100) + "%", background: colors[i % colors.length] }} title={`${k} ${(v*100).toFixed(1)}%`}/>
                })}
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {mccEntries.map(([k, v], i) => {
                  const colors = ["#2ad4c4", "#7dd3fc", "#a3e635", "#ffd166", "#ffb454", "#c084fc", "#ff7a91", "#5d738f"];
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-1)" }}>
                      <span className="swatch round" style={{ background: colors[i % colors.length] }}/>
                      <span>{k}</span>
                      <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-3)" }}>{(v*100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center: mini map */}
        <div className="panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="panel-header"><span>Окружение в радиусе 500м</span><span className="meta">live</span></div>
          <div style={{ flex: 1, background: "#07101e", position: "relative", minHeight: 320 }}>
            <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} width="100%" height="100%" style={{ display: "block" }}>
              {/* river within view */}
              <path d={GEO_DATA.riverPath} fill="none" stroke="rgba(75,150,210,0.32)" strokeWidth="14" strokeLinecap="round"/>
              {/* neighbor hexes */}
              {neighbors.map(h => (
                <polygon key={h.id}
                  points={hexPath(h.cx, h.cy, geom.HEX_R - 1)}
                  fill={scoreColor(h.score, 0.55)}
                  stroke={h.id === hex.id ? "#f4f8ff" : "rgba(255,255,255,0.06)"}
                  strokeWidth={h.id === hex.id ? 2.4 : 0.6}
                />
              ))}
              {/* POI: metro */}
              {GEO_DATA.metro.filter(m => Math.abs(m.x - hex.cx) < R && Math.abs(m.y - hex.cy) < R).map(m => (
                <g key={m.id}>
                  <circle cx={m.x} cy={m.y} r="4.5" fill="#ffd166" stroke="#3a2a08" strokeWidth="1.2"/>
                  <text x={m.x + 8} y={m.y + 3} fontSize="7.5" fill="#cfdcee" fontFamily="Inter">{m.name}</text>
                </g>
              ))}
              {/* POI: vtb */}
              {GEO_DATA.vtbAtms.filter(a => Math.abs(a.x - hex.cx) < R && Math.abs(a.y - hex.cy) < R).map(a => (
                <g key={a.id}>
                  <circle cx={a.x} cy={a.y} r="5" fill="rgba(95,180,255,0.18)" stroke="rgba(95,180,255,0.9)" strokeWidth="1.2"/>
                  <circle cx={a.x} cy={a.y} r="2" fill="#5fb4ff"/>
                </g>
              ))}
              {/* POI: competitors */}
              {GEO_DATA.competitors.filter(co => Math.abs(co.x - hex.cx) < R && Math.abs(co.y - hex.cy) < R).map(co => (
                <g key={co.id}>
                  <circle cx={co.x} cy={co.y} r="2.5" fill="#ff7a91" stroke="#3a0c1a" strokeWidth="0.8"/>
                </g>
              ))}
              {/* POI: malls */}
              {GEO_DATA.malls.filter(m => Math.abs(m.x - hex.cx) < R && Math.abs(m.y - hex.cy) < R).map(m => (
                <g key={m.id}>
                  <rect x={m.x - 4} y={m.y - 4} width="8" height="8" fill="#c084fc" stroke="#1a0d3e" strokeWidth="1" transform={`rotate(45 ${m.x} ${m.y})`}/>
                  <text x={m.x + 8} y={m.y + 3} fontSize="7.5" fill="#cfdcee" fontFamily="Inter">{m.name}</text>
                </g>
              ))}
            </svg>
            <div style={{ position: "absolute", left: 10, top: 10, fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>центр кадра — выбранная ячейка</div>
          </div>
          <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5 }}>
            <div><span style={{ color: "var(--ink-3)" }}>Метро рядом:</span> <span className="mono">{hex.metroNear ? "1 (Тверская, 180м)" : "—"}</span></div>
            <div><span style={{ color: "var(--ink-3)" }}>ТЦ рядом:</span> <span className="mono">{hex.mallNear ? "1" : "—"}</span></div>
            <div><span style={{ color: "var(--ink-3)" }}>Свои ATM:</span> <span className="mono">{hex.vtbNear ? "⚠ есть" : "нет"}</span></div>
            <div><span style={{ color: "var(--ink-3)" }}>Конкуренты:</span> <span className="mono">{hex.competitorNear ? `${Math.floor(2 + Math.random()*3)} в радиусе` : "1"}</span></div>
          </div>
        </div>

        {/* Right: decision + comparison + risk */}
        <div style={{ display: "grid", gap: 12 }}>
          <div className="panel">
            <div className="panel-header"><span>Сравнение с baseline</span><span className="meta">vs экспертный отбор</span></div>
            <div className="panel-body" style={{ display: "grid", gap: 8 }}>
              {[
                { l: "ML-Score модели",     v: (hex.score * 100).toFixed(0), unit: "/100",    bar: hex.score, base: 0.62, color: "var(--teal)" },
                { l: "Экспертная оценка",   v: "62",                          unit: "/100",    bar: 0.62, base: 0.62, color: "var(--ink-2)" },
                { l: "Окупаемость",         v: "7 мес",                       unit: "",        bar: 0.78, base: 0.45, color: "var(--green)", goodLow: true },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "var(--ink-1)" }}>{row.l}</span>
                    <span className="mono" style={{ color: row.color }}>{row.v}<span style={{ color: "var(--ink-3)" }}>{row.unit}</span></span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg-2)", borderRadius: 100 }}>
                    <div style={{ height: "100%", width: (row.bar * 100) + "%", background: row.color, opacity: 0.85, borderRadius: 100 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span>Контроль рисков</span><span className="meta">pre-flight</span></div>
            <div className="panel-body" style={{ display: "grid", gap: 6 }}>
              {[
                { ok: !hex.vtbNear, l: "Нет каннибализации (своих ATM < 300м)", note: hex.vtbNear ? "200м до ВТБ" : "ближайший 460м" },
                { ok: true, l: "Транзакционный след подтверждён", note: `${formatNum(hex.uniqueClients)} клиентов` },
                { ok: true, l: "POI-данные актуальны (≤ 30 дней)", note: "OSM 28.04.2026" },
                { ok: hex.score > 0.7, l: "Score стабилен 3+ месяца", note: "тренд +0.04" },
                { ok: false, l: "Технические ограничения проверены", note: "требуется выезд" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12, borderBottom: i < 4 ? "1px dashed var(--line)" : "none" }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: r.ok ? "rgba(88,214,141,0.15)" : "rgba(255,180,84,0.15)", color: r.ok ? "var(--green)" : "var(--amber)", display: "grid", placeItems: "center", fontSize: 11 }}>{r.ok ? "✓" : "?"}</span>
                  <span style={{ color: "var(--ink-1)" }}>{r.l}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: 10.5, color: "var(--ink-3)" }}>{r.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span>Резюме модели</span><span className="meta">CatBoost · v2.4</span></div>
            <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--ink-1)", lineHeight: 1.6 }}>
              {hex.score >= 0.85 ? <>Локация попадает в <span style={{ color: "var(--teal)", fontWeight: 600 }}>топ-3% потенциала</span> по Москве.</>
              : hex.score >= 0.65 ? <>Локация в <span style={{ color: "var(--amber)", fontWeight: 600 }}>верхних 25%</span>, но не в приоритете модели.</>
              : <>Локация в <span style={{ color: "var(--red)", fontWeight: 600 }}>нижних 50%</span> потенциала.</>}
              {" "}Основные драйверы: {hex.factors.slice(0, 2).map(f => f.label.toLowerCase()).join(", ")}.
              <br/><br/>
              <span style={{ color: "var(--ink-3)" }}>Рекомендуемое действие:</span><br/>
              <span>→ {hex.score >= 0.65 ? "направить специалиста для оценки технической возможности и переговоров по аренде." : "отложить, дождаться перерасчёта модели в следующем месяце."}</span>
            </div>
            <div className="cta-block">
              <button className="btn btn-primary" style={{ flex: 1 }}>Создать заявку</button>
              <button className="btn">Экспорт PDF</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// METRICS VIEW (model dashboard)
// ════════════════════════════════════════════════════════════════════════
function MetricsView() {
  // ROC curve (good model)
  const rocData = uMe(() => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const y = Math.min(1, Math.pow(x, 0.36) * 1.02);
      pts.push({ x, y });
    }
    return pts;
  }, []);

  const featureImportance = [
    { label: "Транзакционный след ВТБ", value: 0.28 },
    { label: "Плотность населения",     value: 0.19 },
    { label: "Концентрация ТЦ/POI",     value: 0.14 },
    { label: "Близость метро / ТПУ",     value: 0.12 },
    { label: "Бизнес-центры рядом",      value: 0.09 },
    { label: "Конкуренты (-)",           value: -0.07 },
    { label: "Каннибализация ВТБ (-)",   value: -0.06 },
    { label: "Близость ВУЗа",            value: 0.05 },
  ];

  const monthsSparkAUC = [0.71, 0.74, 0.73, 0.76, 0.78, 0.80, 0.81, 0.82, 0.823];
  const monthsSparkConv = [38, 42, 47, 51, 58, 64, 68, 73, 78];

  const matrix = [[1842, 218], [184, 1356]];

  // score distribution (histogram)
  const histBins = uMe(() => {
    const bins = Array(20).fill(0);
    GEO_DATA.hexes.forEach(h => {
      const i = Math.min(19, Math.floor(h.score * 20));
      bins[i]++;
    });
    return bins;
  }, []);
  const maxBin = Math.max(...histBins);

  return (
    <div className="metrics-shell">
      <div className="kpi-row">
        <div className="kpi">
          <div className="lbl">ROC-AUC</div>
          <div className="val">0.823</div>
          <div className="delta">▲ +0.013 за месяц</div>
          <div className="target">target ≥ 0.75 · ✓</div>
          <div className="spark"><Sparkline values={monthsSparkAUC} color="#2ad4c4"/></div>
        </div>
        <div className="kpi">
          <div className="lbl">Precision @ top-20</div>
          <div className="val">0.86</div>
          <div className="delta">▲ +0.04</div>
          <div className="target">86% рекомендаций оправдались</div>
        </div>
        <div className="kpi">
          <div className="lbl">Recall</div>
          <div className="val">0.74</div>
          <div className="delta">▲ +0.02</div>
          <div className="target">из всех «хороших» зон</div>
        </div>
        <div className="kpi">
          <div className="lbl">Conversion Rate</div>
          <div className="val">78%</div>
          <div className="delta">▲ +5 п.п. vs экспертный отбор</div>
          <div className="target">KPI после 3 мес работы ATM</div>
          <div className="spark"><Sparkline values={monthsSparkConv} color="#58d68d"/></div>
        </div>
      </div>

      {/* Left column */}
      <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
        <div className="panel">
          <div className="panel-header"><span>ROC-кривая</span><span className="meta">test set N=3 400</span></div>
          <div className="panel-body">
            <LineChart data={rocData} w={500} h={260} xLabel="False Positive Rate" yLabel="True Positive Rate" refLine={true}/>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-2)" }}>
              <span><span style={{ color: "var(--teal)" }}>━</span> ML модель · AUC 0.823</span>
              <span><span style={{ color: "var(--ink-3)" }}>┄</span> baseline (случайный выбор)</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span>Feature Importance</span><span className="meta">CatBoost · gain</span></div>
          <div className="panel-body">
            <HBar items={featureImportance} format={(v) => (v >= 0 ? "+" : "") + v.toFixed(2)}/>
            <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--bg-2)", borderRadius: 4, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Модель опирается прежде всего на <span style={{ color: "var(--teal)" }}>транзакционный след клиентов ВТБ</span> — устойчивый сигнал, не зависит от качества OSM.
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
        <div className="panel">
          <div className="panel-header"><span>Confusion Matrix</span><span className="meta">threshold 0.5</span></div>
          <div className="panel-body">
            <ConfusionMatrix matrix={matrix}/>
            <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--bg-2)", borderRadius: 4, fontSize: 11, color: "var(--ink-2)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--ink-1)" }}>Accuracy</span> 0.889 ·
              <span style={{ color: "var(--ink-1)" }}> F1</span> 0.871 ·
              <span style={{ color: "var(--ink-1)" }}> FPR</span> 0.106
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span>Распределение Score по городу</span><span className="meta">{GEO_DATA.hexes.length.toLocaleString("ru")} ячеек</span></div>
          <div className="panel-body">
            <svg width="100%" viewBox="0 0 400 140" style={{ display: "block" }}>
              {histBins.map((c, i) => {
                const h = (c / maxBin) * 110;
                return (
                  <g key={i}>
                    <rect x={i * 20 + 4} y={130 - h} width="16" height={h}
                      fill={scoreColor(i / 19 + 0.025, 0.95)}/>
                  </g>
                );
              })}
              {[0, 5, 10, 15, 19].map(i => (
                <text key={i} x={i * 20 + 12} y={138} fontSize="9" fill="#5d738f" textAnchor="middle" fontFamily="JetBrains Mono">
                  {(i * 5 + 2.5).toFixed(0)}
                </text>
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, fontSize: 11 }}>
              <div><span style={{ color: "var(--ink-3)" }}>Низкий 0–40</span> <span className="mono" style={{ color: "var(--ink-1)" }}>{histBins.slice(0, 8).reduce((a,b)=>a+b,0).toLocaleString("ru")}</span></div>
              <div><span style={{ color: "var(--ink-3)" }}>Средний 40–70</span> <span className="mono" style={{ color: "var(--ink-1)" }}>{histBins.slice(8, 14).reduce((a,b)=>a+b,0).toLocaleString("ru")}</span></div>
              <div><span style={{ color: "var(--teal)" }}>Высокий 70+</span> <span className="mono" style={{ color: "var(--teal)" }}>{histBins.slice(14).reduce((a,b)=>a+b,0).toLocaleString("ru")}</span></div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span>Качество данных</span><span className="meta">pipeline · 12.05.2026 03:00</span></div>
          <div className="panel-body" style={{ display: "grid", gap: 6 }}>
            {[
              { src: "Транзакции ВТБ",      rows: "184 230 540", fresh: "1 ч",  drift: 0.02, ok: true },
              { src: "OSM POI",             rows: "127 480",     fresh: "14 д", drift: 0.08, ok: true },
              { src: "Конкуренты (open)",    rows: "8 940",       fresh: "7 д",  drift: 0.04, ok: true },
              { src: "Демография Росстат",  rows: "12 380",      fresh: "32 д", drift: 0.11, ok: false },
            ].map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1.4fr 1fr 1fr 1fr", gap: 6, alignItems: "center", padding: "5px 0", fontSize: 11.5, borderBottom: i < 3 ? "1px dashed var(--line)" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: 100, background: s.ok ? "var(--green)" : "var(--amber)" }}/>
                <span style={{ color: "var(--ink-1)" }}>{s.src}</span>
                <span className="mono" style={{ color: "var(--ink-2)" }}>{s.rows}</span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>{s.fresh} назад</span>
                <span className="mono" style={{ color: s.drift > 0.1 ? "var(--amber)" : "var(--ink-2)" }}>drift {s.drift.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════════════
function App() {
  const [tab, setTab] = uSt("map");
  const [selected, setSelected] = uSt(null);

  // When user selects on map and switches to detail, keep selection
  const handleSelect = (id) => {
    setSelected(id);
  };

  const { hexes } = GEO_DATA;
  const visibleCount = hexes.filter(h => h.score >= 0.8).length; // for status bar

  return (
    <div className="app" data-screen-label={tab}>
      <TopBar tab={tab} setTab={setTab}/>
      {tab === "map"     && <MapView selected={selected} setSelected={handleSelect}/>}
      {tab === "detail"  && <DetailView selected={selected} setSelected={handleSelect} setTab={setTab}/>}
      {tab === "metrics" && <MetricsView/>}
      <StatusBar visibleCount={visibleCount} totalCount={hexes.length} selected={selected ? selected.slice(0, 10) + "…" : null}/>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
