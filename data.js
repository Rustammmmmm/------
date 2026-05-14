// Стабильный PRNG (LCG) для воспроизводимости данных
function makePRNG(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Гексагональная геометрия (pointy-top)
const HEX_R = 22;
const HEX_W = Math.sqrt(3) * HEX_R;
const HEX_H = 2 * HEX_R;
const COL_STEP = HEX_W;
const ROW_STEP = 1.5 * HEX_R;

// SVG-вьюпорт карты
const MAP_W = 880;
const MAP_H = 720;

// Стилизованные «районы Москвы» (центр карты ~ Кремль)
const DISTRICTS = [
  { name: "Тверской",      cx: 440, cy: 310 },
  { name: "Арбат",         cx: 380, cy: 340 },
  { name: "Хамовники",     cx: 360, cy: 420 },
  { name: "Якиманка",      cx: 460, cy: 420 },
  { name: "Пресненский",   cx: 360, cy: 230 },
  { name: "Мещанский",     cx: 510, cy: 250 },
  { name: "Басманный",     cx: 570, cy: 310 },
  { name: "Таганский",     cx: 580, cy: 410 },
  { name: "Замоскворечье", cx: 480, cy: 480 },
  { name: "Красносельский",cx: 600, cy: 230 },
  { name: "Дорогомилово",  cx: 240, cy: 360 },
  { name: "Раменки",       cx: 180, cy: 470 },
  { name: "Сокол",         cx: 240, cy: 160 },
  { name: "Аэропорт",      cx: 340, cy: 130 },
  { name: "Беговой",       cx: 290, cy: 250 },
  { name: "Бутырский",     cx: 460, cy: 130 },
  { name: "Марьина роща",  cx: 540, cy: 150 },
  { name: "Сокольники",    cx: 660, cy: 200 },
  { name: "Лефортово",     cx: 700, cy: 350 },
  { name: "Южнопортовый",  cx: 680, cy: 490 },
  { name: "Даниловский",   cx: 530, cy: 560 },
  { name: "Донской",       cx: 420, cy: 580 },
  { name: "Гагаринский",   cx: 310, cy: 550 },
  { name: "Котловка",      cx: 210, cy: 600 },
];

function nearestDistrict(x, y) {
  let best = DISTRICTS[0], bd = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(d.cx - x, d.cy - y);
    if (dist < bd) { bd = dist; best = d; }
  }
  return best.name;
}

// "Хотспоты" потенциала (имитация ML-скора)
const HOTSPOTS = [
  { x: 440, y: 310, w: 0.95, sigma: 110 }, // Тверская / центр
  { x: 580, y: 320, w: 0.86, sigma: 90  }, // Басманный (БЦ)
  { x: 360, y: 230, w: 0.82, sigma: 100 }, // Пресня / Сити
  { x: 480, y: 480, w: 0.78, sigma: 95  }, // Замоскворечье
  { x: 660, y: 200, w: 0.74, sigma: 85  }, // Сокольники
  { x: 240, y: 360, w: 0.70, sigma: 80  }, // Дорогомилово
  { x: 700, y: 350, w: 0.66, sigma: 80  }, // Лефортово
  { x: 530, y: 560, w: 0.64, sigma: 75  }, // Даниловский
  { x: 210, y: 600, w: 0.42, sigma: 70  }, // окраина
  { x: 340, y: 130, w: 0.55, sigma: 80  }, // Аэропорт
];

// h3-подобный псевдо-индекс (15 hex-цифр, начинается с 89)
function fakeH3(row, col, prng) {
  const hex = "0123456789abcdef";
  let s = "89";
  for (let i = 0; i < 13; i++) s += hex[Math.floor(prng() * 16)];
  return s;
}

// Москва-река: волнистая линия запад→юго-восток
const RIVER_PATH = "M 50 380 C 130 340, 200 400, 270 360 S 380 440, 460 420 S 540 360, 620 420 S 750 540, 850 540";

// Кольцевые контуры (Бульварное / Садовое / ТТК), стилизованные эллипсы
const RINGS = [
  { cx: 440, cy: 360, rx: 60,  ry: 50,  name: "Бульварное"  },
  { cx: 440, cy: 360, rx: 110, ry: 90,  name: "Садовое"     },
  { cx: 440, cy: 360, rx: 200, ry: 170, name: "ТТК"         },
  { cx: 440, cy: 360, rx: 320, ry: 290, name: "МКАД"        },
];

// Крупные магистрали (радиальные)
const ROADS = [
  "M 440 360 L 60  100", "M 440 360 L 440 40 ", "M 440 360 L 820 100",
  "M 440 360 L 870 360", "M 440 360 L 820 660", "M 440 360 L 440 700",
  "M 440 360 L 60  660", "M 440 360 L 10  360",
];

// Категории MCC (распределение трат)
function genMCC(prng, score) {
  const base = {
    "Супермаркеты": 0.18 + prng() * 0.12,
    "Кафе и рестораны": 0.10 + prng() * 0.10 + score * 0.08,
    "Транспорт": 0.08 + prng() * 0.08,
    "Аптеки": 0.05 + prng() * 0.05,
    "Одежда": 0.04 + prng() * 0.10 + score * 0.04,
    "АЗС": 0.04 + prng() * 0.06,
    "Развлечения": 0.03 + prng() * 0.06,
    "Прочее": 0.10,
  };
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  Object.keys(base).forEach(k => base[k] = base[k] / sum);
  return base;
}

// Топ-факторы (объяснение Score через SHAP-подобные значения)
function genFactors(prng, hex) {
  const all = [
    { key: "transit",     label: "Пешеходный трафик",   sign: +1, weight: hex.metroNear ? 0.22 : 0.05 + prng() * 0.06 },
    { key: "demo",        label: "Плотность населения", sign: +1, weight: 0.08 + (hex.pop / 12000) * 0.18 },
    { key: "commerce",    label: "Концентрация ТЦ/ритейла", sign: +1, weight: hex.mallNear ? 0.18 : 0.04 + prng() * 0.06 },
    { key: "vtb_hist",    label: "Транзакционный след ВТБ", sign: +1, weight: 0.10 + hex.score * 0.12 },
    { key: "competitors", label: "Конкуренты рядом",    sign: -1, weight: hex.competitorNear ? 0.10 + prng() * 0.06 : 0.02 },
    { key: "cannibal",    label: "Каннибализация (свои АТМ)", sign: -1, weight: hex.vtbNear ? 0.14 + prng() * 0.06 : 0.01 },
    { key: "uni",         label: "Близость ВУЗа",       sign: +1, weight: hex.uniNear ? 0.08 + prng() * 0.04 : 0.0 },
    { key: "bc",          label: "Бизнес-центры",       sign: +1, weight: hex.bcNear ? 0.10 + prng() * 0.04 : 0.02 },
    { key: "hardware",    label: "Строймагазины (наличка)", sign: +1, weight: hex.hardwareNear ? 0.12 + prng() * 0.04 : 0.0 },
    { key: "park",        label: "Парки / достопримеч.",  sign: +1, weight: hex.parkNear ? 0.09 + prng() * 0.04 : 0.0 },
    { key: "transit",     label: "Остановки НГПТ",        sign: +1, weight: hex.transitNear ? 0.07 + prng() * 0.04 : 0.0 },
  ];
  return all.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
}

// Генерация POI и сетки
function generateData() {
  const prng = makePRNG(20260514);

  // POI: метро (~26 точек, привязанных к радиалам)
  const metro = [];
  const metroNames = [
    "Тверская","Пушкинская","Чеховская","Театральная","Лубянка","Китай-город",
    "Новокузнецкая","Парк культуры","Кропоткинская","Арбатская","Смоленская",
    "Краснопресненская","Баррикадная","Маяковская","Белорусская","Курская",
    "Чкаловская","Цветной бульвар","Сухаревская","Тургеневская","Чистые пруды",
    "Полянка","Третьяковская","Октябрьская","Серпуховская","Тульская"
  ];
  for (let i = 0; i < metroNames.length; i++) {
    const angle = (i / metroNames.length) * Math.PI * 2;
    const rad = 80 + prng() * 220;
    metro.push({
      id: "m" + i,
      name: metroNames[i],
      x: 440 + Math.cos(angle) * rad + (prng() - 0.5) * 60,
      y: 360 + Math.sin(angle) * rad * 0.85 + (prng() - 0.5) * 40,
    });
  }

  // POI: ТЦ
  const malls = [];
  const mallNames = ["Афимолл","Метрополис","Европейский","Атриум","ЦДМ","Авиапарк","Охотный Ряд","Цветной","Гагаринский","Columbus","Капитолий","РИО"];
  for (let i = 0; i < mallNames.length; i++) {
    malls.push({
      id: "mall" + i, name: mallNames[i],
      x: 80 + prng() * 720, y: 80 + prng() * 560,
    });
  }

  // POI: банкоматы ВТБ
  const vtbAtms = [];
  for (let i = 0; i < 48; i++) {
    vtbAtms.push({
      id: "vtb" + i,
      x: 60 + prng() * 760, y: 60 + prng() * 600,
    });
  }

  // POI: конкуренты
  const competitors = [];
  const bankNames = ["СБ", "АЛ", "ТК", "ГП", "РС"];
  for (let i = 0; i < 96; i++) {
    competitors.push({
      id: "c" + i,
      bank: bankNames[Math.floor(prng() * bankNames.length)],
      x: 50 + prng() * 780, y: 50 + prng() * 620,
    });
  }

  // Бизнес-центры
  const bcs = [];
  for (let i = 0; i < 18; i++) bcs.push({ id: "bc" + i, x: 60 + prng() * 760, y: 60 + prng() * 600 });

  // ВУЗы
  const unis = [];
  for (let i = 0; i < 10; i++) unis.push({ id: "u" + i, x: 60 + prng() * 760, y: 60 + prng() * 600 });

  // Крупные строительные магазины (наличные расчёты при доставке)
  const hardwares = [];
  const hardwareNames = ["Леруа", "OBI", "Петрович", "СтройДвор", "Касторама", "Все Инструменты", "Бауцентр", "Стройландия"];
  for (let i = 0; i < 14; i++) {
    hardwares.push({
      id: "hw" + i, name: hardwareNames[i % hardwareNames.length],
      x: 70 + prng() * 740, y: 70 + prng() * 580,
    });
  }

  // Парки / достопримечательности (туристический трафик, оплата за наличные)
  const parks = [];
  const parkNames = ["Парк Горького","Сокольники","Зарядье","ВДНХ","Воробьёвы горы","Коломенское","Музеон","Эрмитаж","Чистые пруды","Парк Победы","Кузьминки","Тверской бульвар"];
  for (let i = 0; i < parkNames.length; i++) {
    parks.push({
      id: "pk" + i, name: parkNames[i],
      x: 60 + prng() * 760, y: 60 + prng() * 600,
      r: 28 + prng() * 18,
    });
  }

  // Остановки наземного транспорта (автобус/троллейбус/трамвай) — точки с наличной оплатой
  const transits = [];
  for (let i = 0; i < 120; i++) {
    transits.push({
      id: "tr" + i,
      kind: ["bus","tram","trol"][Math.floor(prng() * 3)],
      x: 30 + prng() * 820, y: 30 + prng() * 660,
    });
  }

  // Hex grid
  const hexes = [];
  const rows = Math.ceil(MAP_H / ROW_STEP) + 1;
  const cols = Math.ceil(MAP_W / COL_STEP) + 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * COL_STEP + (row % 2 ? COL_STEP / 2 : 0) + 12;
      const y = row * ROW_STEP + 30;
      if (x < 25 || x > MAP_W - 25 || y < 25 || y > MAP_H - 25) continue;

      // базовый скор по хотспотам (гаусс)
      let score = 0;
      for (const h of HOTSPOTS) {
        const d2 = (x - h.x) ** 2 + (y - h.y) ** 2;
        score = Math.max(score, h.w * Math.exp(-d2 / (2 * h.sigma * h.sigma)));
      }
      // шум
      score += (prng() - 0.5) * 0.12;
      score = Math.max(0.02, Math.min(0.99, score));

      // близость POI
      const near = (poi, r) => poi.some(p => Math.hypot(p.x - x, p.y - y) < r);
      const metroNear = near(metro, 38);
      const mallNear = near(malls, 45);
      const vtbNear = near(vtbAtms, 30);
      const competitorNear = near(competitors, 30);
      const bcNear = near(bcs, 45);
      const uniNear = near(unis, 50);
      const hardwareNear = near(hardwares, 42);
      const parkNear = parks.some(p => Math.hypot(p.x - x, p.y - y) < p.r);
      const transitNear = transits.filter(t => Math.hypot(t.x - x, t.y - y) < 28).length >= 2;

      // штраф каннибализации
      if (vtbNear) score = Math.max(0.05, score - 0.18);
      // буст транспортный
      if (metroNear) score = Math.min(0.99, score + 0.08);
      if (hardwareNear) score = Math.min(0.99, score + 0.05);
      if (parkNear) score = Math.min(0.99, score + 0.04);
      if (transitNear) score = Math.min(0.99, score + 0.03);

      // плотность населения, имитация
      const pop = Math.round(2000 + 8000 * Math.exp(-(Math.hypot(x - 440, y - 360)) / 280) + prng() * 1500);

      // прогнозируемые транзакции/мес
      const txCount = Math.round(score * 18000 + prng() * 2500);
      const txSum = Math.round(txCount * (3200 + prng() * 1800));
      const uniqueClients = Math.round(txCount * (0.18 + prng() * 0.08));

      const hex = {
        id: fakeH3(row, col, prng),
        row, col, cx: x, cy: y,
        score: +score.toFixed(3),
        txCount, txSum, uniqueClients,
        pop,
        district: nearestDistrict(x, y),
        metroNear, mallNear, vtbNear, competitorNear, bcNear, uniNear,
        hardwareNear, parkNear, transitNear,
      };
      hex.mcc = genMCC(prng, score);
      hex.factors = genFactors(prng, hex);
      hexes.push(hex);
    }
  }

  return {
    hexes, metro, malls, vtbAtms, competitors, bcs, unis,
    hardwares, parks, transits,
    rings: RINGS, roads: ROADS, riverPath: RIVER_PATH, districts: DISTRICTS,
    geom: { HEX_R, HEX_W, HEX_H, MAP_W, MAP_H }
  };
}

// SVG-полигон для pointy-top hex
function hexPath(cx, cy, r) {
  const w = Math.sqrt(3) * r;
  return [
    [cx, cy - r], [cx + w/2, cy - r/2], [cx + w/2, cy + r/2],
    [cx, cy + r], [cx - w/2, cy + r/2], [cx - w/2, cy - r/2],
  ].map(p => p.join(",")).join(" ");
}

// Палитра тепловой карты (cool→hot, читается на тёмном)
// 0.0 deep blue → 0.35 cyan → 0.6 teal/green → 0.8 amber → 1.0 red-orange
function scoreColor(s, alpha = 0.85) {
  // OKLCH-подобный градиент через интерполяцию RGB между опорными точками
  const stops = [
    { t: 0.00, c: [22, 42, 92] },     // deep blue
    { t: 0.30, c: [33, 110, 168] },   // mid blue
    { t: 0.50, c: [38, 178, 184] },   // cyan-teal
    { t: 0.70, c: [134, 200, 130] },  // green-yellow
    { t: 0.85, c: [240, 178, 70] },   // amber
    { t: 1.00, c: [232, 86, 60] },    // red-orange
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].t && s <= stops[i+1].t) { a = stops[i]; b = stops[i+1]; break; }
  }
  const t = (s - a.t) / (b.t - a.t || 1);
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t);
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t);
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t);
  return `rgba(${r},${g},${bl},${alpha})`;
}

function formatRub(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " млрд ₽";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " млн ₽";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + " тыс ₽";
  return n + " ₽";
}
function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " млн";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " тыс";
  return String(n);
}

window.GEO_DATA = generateData();
window.hexPath = hexPath;
window.scoreColor = scoreColor;
window.formatRub = formatRub;
window.formatNum = formatNum;
