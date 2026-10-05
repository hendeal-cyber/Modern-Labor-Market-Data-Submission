/**
 * Build the presentation from the committed analysis artifacts.
 *
 *   paper/presentation.pptx              the submission copy: no speaker notes
 *   paper/presentation_with_notes.pptx   the presenter copy: identical slides,
 *                                        with a spoken script in the notes
 *
 * Every number on a slide is read from data/analysis/analysis.json,
 * selection_funnel.json or deck_data.json (scripts/make_deck_data.py), so the
 * deck cannot claim a result the dataset does not support. Verdict words
 * ("holds under every check", "tentative", "overturned") are computed from the
 * bootstrap and the four robustness checks with the same thresholds the paper
 * and the executive summary use.
 *
 * Design: Indiana University colours (Crimson 990000, Cream EDEBEB) on white
 * content slides, crimson title and section slides, an IU stamp on every
 * slide. Charts and diagrams are native PowerPoint charts or shapes, so they
 * stay editable. If paper/figures/deck/iu_mark.png exists (the official mark,
 * supplied by the author) it replaces the typographic stamp; if
 * paper/figures/deck/posting_screenshot.png exists it fills the title slide.
 */
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const ANALYSIS = path.join(ROOT, "data", "analysis");
const DECK_ASSETS = path.join(ROOT, "paper", "figures", "deck");

const load = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(ANALYSIS, f), "utf8")); } catch { return null; }
};
const A = load("analysis.json");
const F = load("selection_funnel.json");
const D = load("deck_data.json");
if (!A || !F || !D) {
  console.error("missing analysis.json, selection_funnel.json or deck_data.json; run make_deck_data.py first");
  process.exit(1);
}

// ------------------------------------------------------------------ palette
const CRIMSON = "990000", CRIMSON_DK = "6B0000", CREAM = "EDEBEB";
const INK = "243142", MUTED = "5E6A78", GRAY = "A7A9AB", RULE = "D4D6D9", WHITE = "FFFFFF";
const TINT = "F6E3E3";          // crimson tint: a passing cell, a highlighted card
const PALE = "F4F4F5";          // neutral fill: a failing cell
const SEQ = ["F2D4D4", "D98C8C", "B33A3A", "7A0000"];   // sequential crimson, light to dark
const HEAD = "Cambria", BODY = "Arial";
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;

// ------------------------------------------------------------------ helpers
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const usd = (n) => "$" + fmt(n);
const usdK = (n) => "$" + Math.round(n / 1000) + "k";
const pct1 = (x) => (x * 100).toFixed(1) + "%";
const pct0 = (x) => Math.round(x * 100) + "%";
const effect = (b) => (Math.exp(b) - 1) * 100;                 // log points -> % effect
// A coefficient's % effect as analysis.json states it (the paper prints the
// same field), falling back to computing it.
const pe = (row) => (row.pct_effect !== undefined && row.pct_effect !== null) ? row.pct_effect : effect(row.coef);
const sgn = (x, d = 1) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d);
const num = (x, d) => (x < 0 ? "\u2212" : "") + Math.abs(x).toFixed(d);
const pv = (p) => (p === null || p === undefined) ? "—" : p < 0.001 ? "<0.001" : p.toFixed(3);
const joinNames = (xs) => xs.length <= 2 ? xs.join(" and ")
  : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// A label inside a sentence: lower-case the first letter unless it opens an acronym.
const lc = (s) => /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

const CORE = A.models.core.coefficients;
const EXT = A.models.extended.coefficients;
const LPM = A.models.disclosure_lpm.coefficients;
const REAL = (A.models.real_pay || {}).coefficients || {};
const EC = (A.models.early_career || {}).coefficients || {};
const RW = (A.models.range_width || {}).coefficients || {};
const BOOT = A.wild_cluster_bootstrap.by_variable;
const RR = A.region_robustness.by_variable;
const LE = A.largest_employer_robustness.by_variable;
const FED = A.federal_robustness.by_variable;
const DISC = A.disclosure.robustness;
const N = A.n_estimation, NCL = A.n_clusters;
const BIG = A.largest_employer, BIG_N = A.largest_employer_n, BIG_SHARE = A.largest_employer_share;

const LABEL = {
  seniority_rank: "Seniority (per step)", yrs_exp_min: "Required experience (per year)",
  yrs_exp_stated: "States an experience minimum", degree_required: "Requires a degree",
  degree_stem: "STEM degree", skill_cloud: "Cloud skill (AWS, Azure, GCP)",
  skill_ml_ai: "ML/AI skill", remote_eligible: "Remote-eligible", hourly_original: "Advertised hourly",
  mandate_state: "Pay-transparency mandate", region_northeast: "Northeast (vs. Midwest)",
  region_south: "South (vs. Midwest)", region_west: "West (vs. Midwest)",
  industry_data_center: "Data-center operator", family_ai_ml: "AI/ML role family",
  advanced_degree_pref: "Advanced degree preferred", soft_leadership: "Leadership named",
  job_level: "Job level (numeric title)", study_metro: "In a study metro",
  prior_internship_req: "Prior internship required", certification_req: "Certification required",
  skill_python_r: "Python or R", skill_sql: "SQL", skill_viz_bi: "Visualization / BI",
  skill_big_data: "Big-data tools", soft_teamwork: "Teamwork named", soft_communication: "Communication named",
  metro_indianapolis: "Indianapolis metro", const: "Constant",
};
// Names as they read inside a sentence.
const PHRASE = {
  seniority_rank: "seniority", yrs_exp_min: "required experience", skill_cloud: "a stated cloud skill",
  yrs_exp_stated: "stating an experience minimum", degree_stem: "a STEM degree",
  region_west: "a West location", region_northeast: "a Northeast location",
  skill_ml_ai: "a stated ML/AI skill", family_ai_ml: "an AI/ML role family",
  degree_required: "a degree requirement", industry_data_center: "a data-center operator",
};
const INDUSTRY = {
  utility: "Electric utilities", developer: "Developers (renewables, storage)",
  data_center: "Data-center operators", energy_analytics: "Energy analytics & software",
  grid_vendor: "Grid-technology vendors", consulting: "Energy consultancies",
  grid_operator: "Grid operators (ISOs/RTOs)", retailer: "Competitive retailers",
  cooperative: "Electric cooperatives", gas_utility: "Gas utilities",
};
const ROLE = {
  software_data: "Software & data", grid_power: "Grid & power systems",
  siting_dev: "Siting & development", market_commercial: "Market & commercial",
  ai_ml: "AI & machine learning", regulatory: "Regulatory & compliance",
  other: "Other analytics-adjacent", gis: "GIS", sustainability: "Sustainability analytics",
};
const RANK = { 1: "Entry", 2: "Mid", 3: "Senior", 4: "Staff / principal", 5: "Manager", 6: "Director", 7: "Executive" };

// ------------------------------------------------- verdicts, computed once
// Pre-registration section 5 committed a direction for these; anything else
// that survives is exploratory, and yrs_exp_stated is a control that travels
// with the imputed experience minimum.
const PRED = new Set(["seniority_rank", "yrs_exp_min", "family_ai_ml", "degree_required", "industry_data_center"]);
const CONTROL = new Set(["yrs_exp_stated"]);
const CHECKS = [
  ["region", "Without nationwide-remote", (k) => (RR[k] || {}).bootstrap_p],
  ["real", "Price-adjusted pay", (k) => (REAL[k] || {}).p_value],
  ["crusoe", `Without ${BIG}`, (k) => (LE[k] || {}).bootstrap_p],
  ["federal", "Without federal rows", (k) => (FED[k] || {}).bootstrap_p],
];
// Same thresholds as the paper: a survivor whose weaker p (bootstrap or the
// nationwide-remote check) is 0.02 or above is tentative, and one that loses
// significance only once pay is price-adjusted is nominal.
function verdict(k) {
  const bp = (BOOT[k] || {}).p_value, cp = (CORE[k] || {}).p_value;
  if (bp === undefined || bp === null) return "ns";
  if (bp >= 0.05) return cp < 0.05 ? "overturned" : "ns";
  const failed = CHECKS.filter(([, , f]) => { const p = f(k); return p === undefined || p === null || p >= 0.05; })
    .map(([id]) => id);
  if (!failed.length && Math.max(bp, (RR[k] || {}).bootstrap_p || 0) < 0.02) return "robust";
  if (failed.length === 1 && failed[0] === "real") return "nominal";
  return "tentative";
}
const VARS = Object.keys(BOOT);
const V = Object.fromEntries(VARS.map((k) => [k, verdict(k)]));
const byV = (v) => VARS.filter((k) => V[k] === v).sort((a, b) => BOOT[a].p_value - BOOT[b].p_value);
const ROBUST = byV("robust"), TENT = byV("tentative"), NOMINAL = byV("nominal"), OVER = byV("overturned");
const VERDICT_TEXT = {
  robust: "Holds under every check", tentative: "Tentative", nominal: "Nominal only",
  overturned: "Overturned by the bootstrap", ns: "Not significant",
};
const VERDICT_SHORT = { robust: "Holds everywhere", tentative: "Tentative", nominal: "Nominal only",
  overturned: "Overturned", ns: "Not significant" };
const VERDICT_COLOR = { robust: CRIMSON, tentative: CRIMSON, nominal: CRIMSON, overturned: MUTED, ns: GRAY };
const failedChecks = (k) => CHECKS.filter(([, , f]) => { const p = f(k); return p === undefined || p === null || p >= 0.05; });

// Hypotheses, scored exactly as make_paper.py scores them.
function scoreH(k, wantPositive) {
  const row = CORE[k]; const p = BOOT[k] ? BOOT[k].p_value : row.p_value;
  const matched = (row.coef > 0) === wantPositive;
  return { coef: row.coef, pct: pe(row), p, mark: matched && p < 0.05 ? "Supported" : (!matched && p < 0.05 ? "Contradicted" : "Inconclusive") };
}
const mShare = DISC.all.mandate, nShare = DISC.all.no_mandate, GAP = DISC.all.gap;
const rwM = RW.mandate_state || {};
const HYP = [
  { id: "H1", text: "Seniority dominates advertised pay", ...scoreH("seniority_rank", true), kind: "pay", unit: "per step" },
  { id: "H2", text: "A mandate raises disclosure", kind: "disc", mark: "Supported, descriptively" },
  { id: "H3", text: "Required experience raises pay", ...scoreH("yrs_exp_min", true), kind: "pay", unit: "per year" },
  { id: "H4", text: "AI/ML roles carry a premium", ...scoreH("family_ai_ml", true), kind: "pay" },
  { id: "H5", text: "A required degree raises pay", ...scoreH("degree_required", true), kind: "pay" },
  { id: "H6", text: "Mandate states advertise wider ranges", kind: "rw", coef: rwM.coef, pct: rwM.coef !== undefined ? pe(rwM) : null, p: rwM.p_value,
    mark: rwM.coef > 0 && rwM.p_value < 0.05 ? "Supported" : (rwM.coef < 0 && rwM.p_value < 0.05 ? "Contradicted" : "Inconclusive") },
  { id: "H7", text: "Data centers pay more than utilities", ...scoreH("industry_data_center", true), kind: "pay" },
];
// Mandate history, from the dated table in config/scope.yaml.
const STATE_NAME = { CA: "California", CO: "Colorado", CT: "Connecticut", DC: "the District of Columbia", HI: "Hawaii",
  IL: "Illinois", MA: "Massachusetts", MD: "Maryland", MN: "Minnesota", NJ: "New Jersey", NY: "New York",
  VA: "Virginia", VT: "Vermont", WA: "Washington", TX: "Texas", OH: "Ohio", MO: "Missouri",
  NH: "New Hampshire", ME: "Maine", RI: "Rhode Island", PA: "Pennsylvania", IN: "Indiana", WI: "Wisconsin" };
const sname = (k) => STATE_NAME[k] || k;
const longDate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const IN_FORCE = (F.mandate_states_in_force || []).slice().sort((a, b) => D.mandate_dates[a].localeCompare(D.mandate_dates[b]));
const FIRST = IN_FORCE[0], NEWEST = IN_FORCE[IN_FORCE.length - 1];
const TOP_STATES = Object.entries(D.state_with_pay).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => sname(k));
const N_SUPPORTED = HYP.filter((h) => h.mark.startsWith("Supported")).length;

// ------------------------------------------------------------------ assets
const asset = (names) => names.map((n) => path.join(DECK_ASSETS, n)).find((p) => fs.existsSync(p)) || null;
const IU_MARK = asset(["iu_mark.png", "iu_mark.jpg"]);
const SCREENSHOT = asset(["posting_screenshot.png", "posting_screenshot.jpg", "posting_screenshot.jpeg"]);

// ------------------------------------------------------------------ the deck
function build(withNotes) {
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  p.author = "Alexander J. Henderson";
  p.company = "Indiana University, Kelley School of Business";
  p.title = "Determinants of Advertised Pay in the US Energy and Data Center Sector";
  p.subject = "Evidence from employer-published job postings";
  p.theme = { headFontFace: HEAD, bodyFontFace: BODY };

  const stamp = (dark) => {
    const objs = [];
    if (IU_MARK) {
      objs.push({ image: { x: M, y: 6.9, w: 0.3, h: 0.4, path: IU_MARK } });
    } else {
      objs.push({ rect: { x: M, y: 6.93, w: 0.36, h: 0.36, fill: { color: dark ? WHITE : CRIMSON } } });
      objs.push({ text: { text: "IU", options: { x: M, y: 6.93, w: 0.36, h: 0.36, margin: 0, align: "center",
        valign: "middle", fontFace: HEAD, fontSize: 14, bold: true, color: dark ? CRIMSON : WHITE } } });
    }
    objs.push({ text: { text: "INDIANA UNIVERSITY  ·  KELLEY SCHOOL OF BUSINESS", options: {
      x: M + 0.5, y: 6.93, w: 6, h: 0.36, margin: 0, valign: "middle", fontFace: BODY, fontSize: 9,
      bold: true, charSpacing: 1.5, color: dark ? WHITE : CRIMSON } } });
    return objs;
  };
  // Titles are layout placeholders, not text boxes, so PowerPoint's outline,
  // navigation pane, accessibility checker and "Reset slide" see them.
  const titlePh = (o) => ({ placeholder: { options: Object.assign({ name: "title", type: "title",
    fontFace: HEAD, bold: true, margin: 0, valign: "top", align: "left" }, o), text: "" } });
  const slideNum = (color) => ({ x: W - M - 0.6, y: 6.93, w: 0.6, h: 0.36, fontFace: BODY, fontSize: 10, color, align: "right", valign: "middle" });
  p.defineSlideMaster({ title: "CONTENT", background: { color: WHITE },
    objects: stamp(false).concat([titlePh({ x: M, y: 0.62, w: CW, h: 0.95, fontSize: 26, color: INK })]), slideNumber: slideNum(MUTED) });
  p.defineSlideMaster({ title: "TITLE", background: { color: CRIMSON },
    objects: stamp(true).concat([titlePh({ x: M, y: 1.25, w: 6.6, h: 2.3, fontSize: 36, color: WHITE })]), slideNumber: slideNum(CREAM) });
  p.defineSlideMaster({ title: "SECTION", background: { color: CRIMSON },
    objects: stamp(true).concat([titlePh({ x: M, y: 2.9, w: CW, h: 1.0, fontSize: 40, color: WHITE })]), slideNumber: slideNum(CREAM) });

  for (const t of ["Introduction", "Institutional background", "Data", "Empirical strategy", "Results",
    "Threats to validity", "Conclusion", "Appendix"]) p.addSection({ title: t });

  const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, fontFace: BODY, color: INK,
    fontSize: 14, margin: 0, valign: "top" }, o));
  const R = (s, o) => s.addShape(p.shapes.RECTANGLE, Object.assign({ line: { type: "none" } }, o));
  const RR_ = (s, o) => s.addShape(p.shapes.ROUNDED_RECTANGLE, Object.assign({ rectRadius: 0.08, line: { type: "none" } }, o));
  const LINE = (s, x, y, w, h, color, width, dash) => s.addShape(p.shapes.LINE,
    { x, y, w, h, line: Object.assign({ color, width }, dash ? { dashType: dash } : {}) });
  const DOT = (s, cx, cy, d, fill, ring) => s.addShape(p.shapes.OVAL, { x: cx - d / 2, y: cy - d / 2, w: d, h: d,
    fill: { color: fill }, line: ring ? { color: ring, width: 1.5 } : { type: "none" } });
  const badge = (s, n, x, y, d = 0.46) => {
    DOT(s, x + d / 2, y + d / 2, d, CRIMSON);
    T(s, String(n), { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: WHITE });
  };
  const notes = (s, text) => { if (withNotes) s.addNotes(text); };
  const caption = (s, text, y = 6.42, w = CW) => T(s, text, { x: M, y, w, h: 0.4, fontSize: 10, color: MUTED, valign: "bottom" });

  function content(section, kicker, title) {
    const s = p.addSlide({ masterName: "CONTENT", sectionTitle: section });
    T(s, kicker.toUpperCase(), { x: M, y: 0.34, w: CW, h: 0.28, fontSize: 11, bold: true, color: CRIMSON, charSpacing: 2 });
    s.addText(title, { placeholder: "title" });
    return s;
  }
  function divider(section, kicker, title, sub) {
    const s = p.addSlide({ masterName: "SECTION", sectionTitle: section });
    T(s, kicker.toUpperCase(), { x: M, y: 2.5, w: CW, h: 0.35, fontSize: 13, bold: true, color: CREAM, charSpacing: 3 });
    s.addText(title, { placeholder: "title" });
    if (sub) T(s, sub, { x: M, y: 3.95, w: 9.5, h: 1.0, fontSize: 16, color: CREAM });
    return s;
  }
  // Native horizontal bar chart in the deck's one chart style.
  function hbar(s, labels, values, o) {
    s.addChart(p.charts.BAR, [{ name: o.series || "Postings", labels, values }], Object.assign({
      barDir: "bar", chartColors: [o.color || CRIMSON], barGapWidthPct: 45,
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontSize: 11,
      dataLabelFontFace: "Arial", dataLabelFormatCode: o.fmt || "#,##0",
      catAxisLabelColor: INK, catAxisLabelFontSize: 11, catAxisLabelFontFace: "Arial",
      catAxisOrientation: "maxMin", catAxisLineShow: false, valAxisHidden: true,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
      showTitle: !!o.title, title: o.title, titleFontSize: 12, titleColor: INK, titleFontFace: "Arial",
      valAxisMinVal: 0, valAxisMaxVal: o.max,
    }, o.chart, { x: o.x, y: o.y, w: o.w, h: o.h }));
  }
  // US tile grid: one square per state, DC included.
  const TILES = { AK: [0, 0], ME: [10, 0], VT: [9, 1], NH: [10, 1], WA: [0, 2], ID: [1, 2], MT: [2, 2], ND: [3, 2],
    MN: [4, 2], IL: [5, 2], WI: [6, 2], MI: [7, 2], NY: [8, 2], RI: [9, 2], MA: [10, 2], OR: [0, 3], NV: [1, 3],
    WY: [2, 3], SD: [3, 3], IA: [4, 3], IN: [5, 3], OH: [6, 3], PA: [7, 3], NJ: [8, 3], CT: [9, 3], CA: [0, 4],
    UT: [1, 4], CO: [2, 4], NE: [3, 4], MO: [4, 4], KY: [5, 4], WV: [6, 4], VA: [7, 4], MD: [8, 4], DE: [9, 4],
    AZ: [1, 5], NM: [2, 5], KS: [3, 5], AR: [4, 5], TN: [5, 5], NC: [6, 5], SC: [7, 5], DC: [8, 5], OK: [3, 6],
    LA: [4, 6], MS: [5, 6], AL: [6, 6], GA: [7, 6], HI: [0, 7], TX: [3, 7], FL: [8, 7] };
  function tileMap(s, x0, y0, size, gap, style) {
    for (const [st, [c, r]] of Object.entries(TILES)) {
      const x = x0 + c * (size + gap), y = y0 + r * (size + gap);
      const o = style(st);
      R(s, { x, y, w: size, h: size, fill: { color: o.fill }, line: o.line || { type: "none" } });
      const runs = [{ text: st, options: { bold: true, fontSize: 11, color: o.text, breakLine: !!o.sub } }];
      if (o.sub) runs.push({ text: o.sub, options: { fontSize: 9, color: o.text } });
      T(s, runs, { x, y, w: size, h: size, align: "center", valign: "middle" });
    }
  }
  // Horizontal interval plot: one row per item, dot = estimate, bar = 95% CI.
  function intervalPlot(s, rows, o) {
    const { x, y, w, rowH, labelW, lo, hi, ticks, unit } = o;
    const px0 = x + labelW, pw = w - labelW;
    const X = (v) => px0 + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * pw;
    const h = rows.length * rowH;
    for (const t of ticks) {
      LINE(s, X(t), y, 0, h, t === 0 ? INK : RULE, t === 0 ? 1 : 0.75);
      T(s, (t > 0 ? "+" : t < 0 ? "\u2212" : "") + Math.abs(t) + unit, { x: X(t) - 0.4, y: y + h + 0.04, w: 0.8, h: 0.25, fontSize: 10, color: MUTED, align: "center" });
    }
    rows.forEach((r, i) => {
      const cy = y + i * rowH + rowH / 2;
      if (i % 2 === 0) R(s, { x, y: y + i * rowH, w, h: rowH, fill: { color: "FAFAFA" } });
      T(s, r.label, { x, y: y + i * rowH, w: labelW - 0.15, h: rowH, fontSize: 12, color: r.labelColor || INK, valign: "middle", bold: !!r.bold });
      if (r.ciLo !== undefined) LINE(s, X(r.ciLo), cy, X(r.ciHi) - X(r.ciLo), 0, r.color, 2.25);
      DOT(s, X(r.est), cy, 0.17, r.hollow ? WHITE : r.color, r.hollow ? r.color : null);
      if (r.extra) r.extra(X, cy);
    });
    return { X, h };
  }

  // ======================================================== 1. Title (S1)
  {
    const s = p.addSlide({ masterName: "TITLE", sectionTitle: "Introduction" });
    T(s, "RESEARCH PRESENTATION  ·  OCTOBER 2026", { x: M, y: 0.75, w: 7, h: 0.3, fontSize: 12, bold: true, color: CREAM, charSpacing: 3 });
    s.addText("Determinants of Advertised Pay in the US Energy and Data Center Sector", { placeholder: "title" });
    T(s, "Evidence from employer-published job postings", { x: M, y: 3.6, w: 6.6, h: 0.5, fontFace: HEAD, fontSize: 20, italic: true, color: CREAM });
    T(s, "Alexander J. Henderson", { x: M, y: 4.75, w: 6.6, h: 0.45, fontSize: 20, bold: true, color: WHITE });
    T(s, "Kelley School of Business, Indiana University", { x: M, y: 5.2, w: 6.6, h: 0.4, fontSize: 15, color: CREAM });
    T(s, `${fmt(N)} postings  ·  ${NCL} employers  ·  collected ${D.snapshots[0].slice(8)}–${D.snapshots[D.snapshots.length - 1].slice(8)} September 2026`,
      { x: M, y: 5.75, w: 6.6, h: 0.35, fontSize: 13, color: CREAM });

    // The posting on the right: the author's screenshot of it if supplied,
    // with the pay range and coverage read from the same dataset record.
    const cx = 7.6, cy = 0.75, cw = W - M - 7.6, chh = 5.55;
    s.addShape(p.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: chh, fill: { color: WHITE }, line: { type: "none" },
      shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 12, offset: 4, angle: 90 } });
    const e = D.example_posting;
    const listed = e ? String(e.states_listed || e.state).split(";") : [];
    const covered = listed.filter((k) => IN_FORCE.includes(k));
    const later = listed.filter((k) => !IN_FORCE.includes(k) && D.mandate_dates[k]);
    T(s, "AN OBSERVATION IN THE SAMPLE", { x: cx + 0.3, y: cy + 0.25, w: cw - 0.6, h: 0.3, fontSize: 10, bold: true, color: CRIMSON, charSpacing: 2 });
    let y = cy + 0.65;
    if (SCREENSHOT && e) {
      T(s, `${e.employer}  ·  the employer's own careers site`, { x: cx + 0.3, y, w: cw - 0.6, h: 0.3, fontSize: 12, color: MUTED });
      y += 0.38;
    }
    if (SCREENSHOT) {
      // Width-fitted at the image's own aspect ratio, read from the PNG header.
      const buf = fs.readFileSync(SCREENSHOT);
      const ratio = buf.readUInt32BE(20) / buf.readUInt32BE(16);
      const iw = cw - 0.6, ih = iw * ratio;
      s.addImage({ path: SCREENSHOT, x: cx + 0.3, y, w: iw, h: ih, altText: e ? `Job posting: ${e.employer}, ${e.title}` : "Job posting",
        line: { color: RULE, width: 0.75 } });
      y += ih + 0.22;
    } else if (e) {
      T(s, e.employer, { x: cx + 0.3, y, w: cw - 0.6, h: 0.35, fontSize: 14, color: MUTED });
      T(s, e.title, { x: cx + 0.3, y: y + 0.35, w: cw - 0.6, h: 0.85, fontFace: HEAD, fontSize: 22, bold: true, color: INK });
      y += 1.35;
    }
    if (e) {
      R(s, { x: cx + 0.3, y, w: cw - 0.6, h: 1.1, fill: { color: TINT } });
      T(s, SCREENSHOT ? "Pay range, stated further down the posting" : "Pay range",
        { x: cx + 0.5, y: y + 0.12, w: cw - 1.0, h: 0.3, fontSize: 12, color: CRIMSON_DK, bold: true });
      T(s, `${usd(e.pay_min)} – ${usd(e.pay_max)}`, { x: cx + 0.5, y: y + 0.45, w: cw - 1.0, h: 0.55, fontFace: HEAD, fontSize: 26, bold: true, color: CRIMSON });
      y += 1.25;
      T(s, [
        { text: `Lists ${joinNames(listed)}: covered through ${joinNames(covered.map(sname))} (law in force since ${joinNames(covered.map((k) => longDate(D.mandate_dates[k])))}).`, options: { breakLine: true } },
        { text: `Midpoint used in the pay model: ${usd(e.pay_midpoint)}` },
      ], { x: cx + 0.3, y, w: cw - 0.6, h: 0.75, fontSize: 12, color: INK, paraSpaceAfter: 4 });
    }
    T(s, SCREENSHOT ? "Screenshot of the employer's posting (October 2026); pay range and coverage from the collected record."
      : "Drawn from the dataset record.",
    { x: cx + 0.3, y: cy + chh - 0.55, w: cw - 0.6, h: 0.42, fontSize: 10, italic: true, color: MUTED, valign: "bottom" });
    notes(s, "Title. This study asks what in a job posting predicts the pay an employer advertises, in the US energy and data-center sector. " +
      `It uses ${fmt(N)} postings with a stated pay range from ${NCL} employers, collected directly from employers' own job boards between ` +
      `${D.snapshots[0]} and ${D.snapshots[D.snapshots.length - 1]}.` +
      (e ? ` The panel on the right is one observation: ${e.employer}'s ${e.seniority_label}-level posting "${e.title}", at ${usd(e.pay_min)} to ${usd(e.pay_max)}. ` +
        `It lists ${joinNames(listed.map(sname))}, so it is covered by the ${joinNames(covered.map(sname))} law: a posting counts as covered if any listed location is.` : ""));
  }

  // ======================================================== 2. Purpose (S2)
  {
    const s = content("Introduction", "Why this study", "What in a job posting predicts the pay an employer advertises?");
    const mandates = (F.mandate_states_in_force || []).length;
    const cards = [
      ["Pay transparency is spreading", `${mandates} US jurisdictions now require a pay range in the posting itself; ${sname(FIRST)} was first, in ${D.mandate_dates[FIRST].slice(0, 4)}.`],
      ["Energy hiring is changing", "Data-center construction is pulling analytical talent into utilities, developers and grid operators."],
      ["Students can benchmark offers", "For a graduating student, the posted range is the first price signal of a career."],
    ];
    const cw = (CW - 2 * 0.3) / 3;
    cards.forEach(([h, b], i) => {
      const x = M + i * (cw + 0.3);
      R(s, { x, y: 1.75, w: cw, h: 1.85, fill: { color: CREAM } });
      badge(s, i + 1, x + 0.25, 1.95);
      T(s, h, { x: x + 0.85, y: 1.87, w: cw - 1.05, h: 0.62, fontSize: 17, bold: true, valign: "middle" });
      T(s, b, { x: x + 0.25, y: 2.6, w: cw - 0.5, h: 1.2, fontSize: 14, color: INK });
    });
    // The subject, and the literature.
    const yb = 3.9, hb = 2.45;
    R(s, { x: M, y: yb, w: 5.6, h: hb, fill: { color: TINT } });
    T(s, "The author as the subject", { x: M + 0.25, y: yb + 0.2, w: 5.1, h: 0.35, fontSize: 15, bold: true, color: CRIMSON_DK });
    T(s, "Industries and roles were benchmarked to the author's résumé: the sectors with the most experience and interest, and roles the author holds or could hold. The same design extends to any student or industry.",
      { x: M + 0.25, y: yb + 0.65, w: 5.1, h: 1.6, fontSize: 14 });
    const lx = M + 5.9, lw = CW - 5.9;
    T(s, "RELATED WORK", { x: lx, y: yb + 0.05, w: lw, h: 0.3, fontSize: 11, bold: true, color: CRIMSON, charSpacing: 2 });
    T(s, [
      { text: "Arnold, Quach & Taska (2025, NBER WP 34480): ", options: { bold: true } },
      { text: "Colorado's posting law raised the share of postings stating pay by about 30 points.", options: { breakLine: true } },
      { text: "Cullen & Pakzad-Hurson (2023, Econometrica): ", options: { bold: true } },
      { text: "equilibrium effects of transparency on wages.", options: { breakLine: true } },
      { text: "Cullen (2024, Journal of Economic Perspectives): ", options: { bold: true } },
      { text: "is pay transparency good? A review.", options: { breakLine: true } },
      { text: "This study: ", options: { bold: true, color: CRIMSON } },
      { text: `one sector, all US states, ${fmt(F.funnel.unique_in_scope)} postings; disclosure is modelled as an outcome, not assumed.` },
    ], { x: lx, y: yb + 0.42, w: lw, h: hb - 0.4, fontSize: 13, paraSpaceAfter: 6 });
    notes(s, "Why this matters. Pay-transparency laws are spreading quickly across US states, the energy sector is hiring analysts because of data-center growth, and for a student the posted range is the first price signal of a career. " +
      "The study uses the author as the subject: the industries and roles were benchmarked to the author's own résumé, but nothing in the method is specific to one person, so it extends to any student or industry. " +
      "Related work: Arnold, Quach and Taska find Colorado's 2021 law raised disclosure by about 30 points; Cullen and Pakzad-Hurson model the equilibrium wage effects; Cullen's JEP article reviews the evidence. " +
      "This study's contribution is a sector-specific national cross-section in which disclosure itself is an outcome.");
  }

  // ======================================================== 3. Background (S3)
  {
    const mandates = F.mandate_states_in_force || [];
    const s = content("Institutional background", "Institutional background",
      `${mandates.length} jurisdictions required a pay range in the posting during the collection window`);
    const dates = D.mandate_dates;
    const end = D.snapshots[D.snapshots.length - 1];
    const later = Object.keys(dates).filter((k) => dates[k] > end);
    tileMap(s, M, 1.75, 0.5, 0.06, (st) => {
      if (mandates.includes(st)) return { fill: CRIMSON, text: WHITE, sub: dates[st] ? dates[st].slice(0, 4) : "" };
      if (later.includes(st)) return { fill: WHITE, text: CRIMSON, sub: dates[st].slice(0, 4), line: { color: CRIMSON, width: 1.5, dashType: "dash" } };
      return { fill: CREAM, text: MUTED };
    });
    // legend under the map
    const ly = 1.75 + 8 * 0.56 + 0.12;
    R(s, { x: M, y: ly, w: 0.22, h: 0.22, fill: { color: CRIMSON } });
    T(s, "Posting mandate in force (year it took effect)", { x: M + 0.32, y: ly - 0.02, w: 4.0, h: 0.26, fontSize: 11, color: INK });
    R(s, { x: M, y: ly + 0.32, w: 0.22, h: 0.22, fill: { color: WHITE }, line: { color: CRIMSON, width: 1.25, dashType: "dash" } });
    T(s, `Takes effect after the window (${later.map((k) => `${k}, ${dates[k]}`).join("; ")})`, { x: M + 0.32, y: ly + 0.3, w: 5.5, h: 0.26, fontSize: 11, color: INK });

    const rx = 7.35, rw = W - M - rx;
    const pts = [
      ["Coded by date", `Each posting is coded against the laws in force on the day it was seen; ${later.join(", ")}'s rule starts ${later.map((k) => dates[k]).join(", ")}, after the window.`],
      ["Coverage follows the job", `A posting is covered if any listed work location is in a mandate state (${pct0(D.multi_location_share)} list more than one).`],
      ["Elsewhere, disclosure is a choice", "Without a law, stating pay is voluntary, so postings that state pay are a selected group."],
    ];
    pts.forEach(([h, b], i) => {
      const y = 1.75 + i * 1.3;
      badge(s, i + 1, rx, y);
      T(s, h, { x: rx + 0.65, y, w: rw - 0.65, h: 0.4, fontSize: 16, bold: true, valign: "middle" });
      T(s, b, { x: rx + 0.65, y: y + 0.42, w: rw - 0.65, h: 0.85, fontSize: 13, color: INK });
    });
    R(s, { x: rx, y: 5.85, w: rw, h: 0.62, fill: { color: TINT } });
    T(s, "The question for the data: does disclosure differ where the law requires it?",
      { x: rx + 0.2, y: 5.85, w: rw - 0.4, h: 0.62, fontSize: 13, bold: true, color: CRIMSON_DK, valign: "middle" });
    notes(s, `At the last snapshot, ${mandates.length} jurisdictions required a pay scale in the posting itself: ${joinNames(mandates)}. ` +
      `${sname(FIRST)} was first, in ${D.mandate_dates[FIRST].slice(0, 4)}; ${sname(NEWEST)} is the newest, effective ${longDate(D.mandate_dates[NEWEST])}. ` +
      later.map((k) => `${sname(k)}'s posting rule starts ${longDate(dates[k])}, after collection closed, so no posting here counts as covered by it. `).join("") +
      "Coverage attaches to the location of the work, so a posting listing several locations is covered if any of them is covered. Where there is no law, disclosure is voluntary, which is why the study models disclosure as an outcome in its own right.");
  }

  // ======================================================== 4. Data: sectors and roles (S4)
  {
    const s = content("Data", "Data · What is in scope",
      "The sample: analytical roles in energy, utilities and data centers");
    const ind = Object.entries(D.industry_in_scope).sort((a, b) => b[1] - a[1]);
    const role = Object.entries(D.role_in_scope).sort((a, b) => b[1] - a[1]);
    const half = (CW - 0.4) / 2;
    hbar(s, ind.map(([k]) => INDUSTRY[k] || k), ind.map(([, v]) => v),
      { x: M, y: 1.65, w: half, h: 3.65, title: `In-scope postings by industry (N = ${fmt(F.funnel.unique_in_scope)})`, max: ind[0][1] * 1.18 });
    hbar(s, role.map(([k]) => ROLE[k] || k), role.map(([, v]) => v),
      { x: M + half + 0.4, y: 1.65, w: half, h: 3.65, title: `In-scope postings by role family (N = ${fmt(F.funnel.unique_in_scope)})`, max: role[0][1] * 1.18 });
    R(s, { x: M, y: 5.5, w: CW, h: 0.95, fill: { color: CREAM } });
    T(s, [
      { text: "Benchmarked to the author's résumé.  ", options: { bold: true, color: CRIMSON_DK } },
      { text: "Industries where the author has the most experience and interest; roles the author is, or could become, qualified for. " +
        "Every seniority level is kept, because seniority is a regressor; internships are excluded (a different contract and pay regime)." },
    ], { x: M + 0.25, y: 5.5, w: CW - 0.5, h: 0.95, fontSize: 13, valign: "middle" });
    notes(s, `The frame covers ${Object.keys(D.industry_in_scope).length} industry categories under one energy, utility and data-center umbrella, and an analytical role taxonomy: software and data, grid and power systems, siting and development, market and commercial, AI and machine learning, regulatory, GIS and sustainability analytics. ` +
      "These were chosen from the author's résumé: the industries with the most experience and interest, and roles the author is or could become qualified for. " +
      `All seniority levels are kept because seniority is the headline regressor; internships are excluded. The bars count the ${fmt(F.funnel.unique_in_scope)} unique in-scope postings, before restricting to those that state pay.`);
  }

  // ======================================================== 5. Data: sources (S5)
  {
    const s = content("Data", "Data · Sources",
      "Postings come straight from the job boards employers publish to");
    const rows = D.platforms;
    const tot = rows.reduce((a, r) => ({ e: a.e + r.employers_with_postings, raw: a.raw + r.raw, sc: a.sc + r.in_scope, pay: a.pay + r.with_pay }), { e: 0, raw: 0, sc: 0, pay: 0 });
    const hdr = ["Source", "Employers with postings", "Postings retrieved*", "In scope (unique)", "State pay"]
      .map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i ? "right" : "left", valign: "middle" } }));
    const body = rows.map((r, i) => [r.label, fmt(r.employers_with_postings), fmt(r.raw), fmt(r.in_scope), fmt(r.with_pay)]
      .map((t, j) => ({ text: t, options: { align: j ? "right" : "left", fill: { color: i % 2 ? WHITE : "FAFAFA" } } })));
    const total = ["Total", fmt(tot.e), fmt(tot.raw), fmt(tot.sc), fmt(tot.pay)]
      .map((t, j) => ({ text: t, options: { bold: true, align: j ? "right" : "left", border: [{ type: "solid", color: INK, pt: 1 }, { type: "none" }, { type: "none" }, { type: "none" }] } }));
    s.addTable([hdr, ...body, total], { x: M, y: 1.7, w: 7.6, colW: [2.2, 1.45, 1.35, 1.3, 1.3], rowH: 0.4,
      fontFace: BODY, fontSize: 12, color: INK, valign: "middle", margin: [0, 0.08, 0, 0.08],
      border: { type: "none" } });
    caption(s, `*Every sighting on each of the ${D.snapshots.length} collection days (${D.snapshots[0]} to ${D.snapshots[D.snapshots.length - 1]}). ` +
      "USAJOBS is the federal government's job API. Employer counts sum across sources.", 5.85, 7.6);

    const rx = 8.7, rw = W - M - rx;
    R(s, { x: rx, y: 1.7, w: rw, h: 1.75, fill: { color: TINT } });
    T(s, fmt(D.frame.employers_attempted), { x: rx + 0.25, y: 1.8, w: 1.75, h: 0.75, fontFace: HEAD, fontSize: 40, bold: true, color: CRIMSON });
    T(s, "employers searched in the sampling frame", { x: rx + 2.1, y: 1.8, w: rw - 2.3, h: 0.72, fontSize: 13, valign: "middle" });
    T(s, `${fmt(D.frame.boards_found_last_run)} had a readable public board on the final run; the rest use systems with no open feed, or none at all.`,
      { x: rx + 0.25, y: 2.58, w: rw - 0.5, h: 0.8, fontSize: 12, color: INK });
    T(s, "NOT USED: TERMS PROHIBIT AUTOMATED COLLECTION", { x: rx, y: 3.65, w: rw, h: 0.5, fontSize: 10, bold: true, color: CRIMSON, charSpacing: 1.5 });
    const banned = ["LinkedIn", "Indeed", "Handshake", "iCIMS", "Oracle Cloud HCM", "UKG", "careers.electric.coop"];
    const chipW = (rw - 0.15) / 2;
    banned.forEach((b, i) => {
      const x = rx + (i % 2) * (chipW + 0.15), y = 4.25 + Math.floor(i / 2) * 0.48;
      RR_(s, { x, y, w: chipW, h: 0.38, fill: { color: PALE } });
      T(s, b, { x, y, w: chipW, h: 0.38, fontSize: 12, color: MUTED, align: "center", valign: "middle" });
    });
    notes(s, "Every posting comes from a public, unauthenticated feed that employers publish to: the applicant tracking systems Greenhouse, Workday, Ashby, Lever, Workable, SmartRecruiters and Recruitee, plus the federal USAJOBS API for federal energy agencies. " +
      "These are the upstream source that job aggregators copy from. Sources whose terms forbid automated collection were read and ruled out rather than worked around: LinkedIn, Indeed, Handshake, iCIMS, Oracle Cloud HCM, UKG, and the electric cooperatives' careers site. " +
      `The frame lists ${fmt(D.frame.employers_attempted)} employers; ${fmt(D.frame.boards_found_last_run)} had a readable board on the final run.`);
  }

  // ======================================================== 6. Data: funnel (S5b)
  {
    const fn = F.funnel, rj = F.rejection_reasons;
    const s = content("Data", "Data · Selection",
      `From ${fmt(fn.raw)} retrieved postings to an estimation sample of ${fmt(fn.usable_with_pay)}`);
    const stages = [
      [fn.raw, "Retrieved from employer job boards", `${D.snapshots.length} collection days`],
      [fn.passed_screen, "Pass the sector and role screens", ""],
      [fn.passed_geo, "In the US, with a resolvable state", "or nationwide remote"],
      [fn.unique_in_scope, "Unique in-scope postings", "the disclosure sample"],
      [fn.usable_with_pay, "State a pay range", "the pay-model sample"],
    ];
    const drops = [
      [fn.raw - fn.passed_screen, `role outside the taxonomy or an internship ${fmt(fn.rejected_screen)}; no energy-sector evidence in the posting ${fmt(fn.rejected_no_sector_evidence)}; a sister company outside the sector ${fmt(fn.rejected_off_umbrella)}`],
      [fn.rejected_geo, `no resolvable US state ${fmt(rj.no_us_state)}; outside the US ${fmt(rj.non_us)}`],
      [fn.duplicate_sighting + fn.duplicate_repost, `the same posting seen again on a later day ${fmt(fn.duplicate_sighting)}; reposted requisitions ${fmt(fn.duplicate_repost)}`],
      [fn.unique_in_scope - fn.usable_with_pay, "no pay range stated (kept in the disclosure model)"],
    ];
    const bx = M, bw0 = 6.2, bh = 0.72, gap = 0.24, cxm = bx + bw0 / 2;
    stages.forEach(([n, lab, sub], i) => {
      const w = bw0 - i * 0.55, x = cxm - w / 2, y = 1.72 + i * (bh + gap);
      const last = i === stages.length - 1, key = i === 3;
      R(s, { x, y, w, h: bh, fill: { color: last ? CRIMSON : key ? SEQ[1] : CREAM } });
      T(s, fmt(n), { x: x + 0.2, y, w: 1.35, h: bh, fontFace: HEAD, fontSize: 22, bold: true, color: last ? WHITE : CRIMSON_DK, valign: "middle" });
      T(s, [{ text: lab, options: { bold: true, breakLine: !!sub } }].concat(sub ? [{ text: sub, options: { color: last ? CREAM : MUTED } }] : []),
        { x: x + 1.55, y, w: w - 1.7, h: bh, fontSize: 12, color: last ? WHITE : INK, valign: "middle" });
    });
    const rx = M + bw0 + 0.4, rw = W - M - rx;
    drops.forEach(([n, why], i) => {
      const y = 1.72 + i * (bh + gap) + bh * 0.55;
      T(s, "−" + fmt(n), { x: rx, y, w: 1.15, h: 0.62, fontFace: HEAD, fontSize: 17, bold: true, color: CRIMSON, valign: "middle" });
      T(s, why, { x: rx + 1.2, y, w: rw - 1.2, h: 0.62, fontSize: 11, color: INK, valign: "middle" });
    });
    caption(s, "A posting can fail more than one screen; each is removed at the first it fails. Duplicates are matched on employer, title and location.", 6.5);
    notes(s, `The funnel. ${fmt(fn.raw)} postings were retrieved across the collection days. ` +
      `${fmt(fn.raw - fn.passed_screen)} fail the sector and role screens: most are roles outside the analytical taxonomy, internships, postings with no energy-sector evidence, or sister companies outside the sector. ` +
      `${fmt(fn.rejected_geo)} have no resolvable US state or are outside the US. The large drop to ${fmt(fn.unique_in_scope)} is not lost data: ${fmt(fn.duplicate_sighting)} are the same posting seen again on later collection days. ` +
      `${fmt(fn.unique_in_scope)} unique postings form the disclosure sample; the ${fmt(fn.usable_with_pay)} that state a range form the pay-model sample.`);
  }

  // ======================================================== 7. Data: employers and geography (S6)
  {
    const st = D.state_with_pay;
    const nStates = Object.keys(st).length;
    const s = content("Data", "Data · Employers and geography",
      `${NCL} employers in ${nStates} states; the largest supplies ${pct1(BIG_SHARE)} of the sample`);
    const bins = [[1, 5], [6, 20], [21, 60], [61, 1e9]];
    const binOf = (n) => bins.findIndex(([a, b]) => n >= a && n <= b);
    tileMap(s, M, 1.75, 0.5, 0.06, (k) => {
      const n = st[k] || 0;
      if (!n) return { fill: CREAM, text: MUTED };
      const b = binOf(n);
      return { fill: SEQ[b], text: b >= 2 ? WHITE : INK, sub: String(n) };
    });
    const ly = 1.75 + 8 * 0.56 + 0.12;
    T(s, "Postings that state pay:", { x: M, y: ly - 0.02, w: 1.9, h: 0.26, fontSize: 11 });
    bins.forEach(([a, b], i) => {
      const x = M + 1.95 + i * 1.1;
      R(s, { x, y: ly, w: 0.22, h: 0.22, fill: { color: SEQ[i] } });
      T(s, b > 1e8 ? `${a}+` : `${a}–${b}`, { x: x + 0.28, y: ly - 0.02, w: 0.8, h: 0.26, fontSize: 11 });
    });
    T(s, `Plus ${D.no_state_with_pay} nationwide-remote postings with no single state.`, { x: M, y: ly + 0.3, w: 6.3, h: 0.26, fontSize: 11, color: MUTED });

    const rx = 7.35, rw = W - M - rx, kw = (rw - 0.3) / 3;
    [[fmt(N), "postings state pay"], [String(NCL), "employers (clusters)"], [pct1(BIG_SHARE), `largest: ${BIG} (${BIG_N})`]].forEach(([v, l], i) => {
      const x = rx + i * (kw + 0.15);
      R(s, { x, y: 1.75, w: kw, h: 1.25, fill: { color: i === 2 ? TINT : CREAM } });
      T(s, v, { x, y: 1.82, w: kw, h: 0.62, fontFace: HEAD, fontSize: 28, bold: true, color: CRIMSON, align: "center", valign: "middle" });
      T(s, l, { x: x + 0.08, y: 2.44, w: kw - 0.16, h: 0.5, fontSize: 11, align: "center", valign: "top" });
    });
    const ebi = Object.entries(D.employers_by_industry).sort((a, b) => b[1] - a[1]);
    hbar(s, ebi.map(([k]) => INDUSTRY[k] || k), ebi.map(([, v]) => v),
      { x: rx, y: 3.2, w: rw, h: 3.2, title: "Employers stating pay, by industry", max: ebi[0][1] * 1.2, series: "Employers" });
    notes(s, `The ${fmt(N)} postings with a stated range come from ${NCL} distinct employers across ${nStates} states, plus ${D.no_state_with_pay} nationwide-remote postings. ` +
      `${joinNames(TOP_STATES)} supply the most. The largest single employer, ${BIG}, supplies ${BIG_N} postings, ${pct1(BIG_SHARE)} of the sample, well under the pre-registered ceiling of 25%; a robustness check drops it entirely. ` +
      "Employers are the clustering unit for inference, so the count of employers matters more than the count of postings.");
  }

  // ======================================================== 8. Empirical strategy (S7)
  {
    const s = content("Empirical strategy", "Empirical strategy",
      "Two models: what predicts pay, and what predicts stating it");
    const cw = (CW - 0.3) / 2;
    const sub = (t) => ({ text: t, options: { subscript: true } });
    const it = (t) => ({ text: t, options: { italic: true } });
    const eqs = [
      [`Pay model  ·  N = ${fmt(N)} postings that state pay`,
        [{ text: "ln(" }, it("Pay"), sub("ij"), { text: ") = α + β" }, sub("1"), it(" Seniority"), sub("ij"),
          { text: " + β" }, sub("2"), it(" Experience"), sub("ij"), { text: " + " }, it("X"), sub("ij"), { text: "′γ + ε" }, sub("ij")],
        `Pay is the midpoint of the advertised range, in annual US dollars. X: degree, skills, region, mandate, industry, role family (${Object.keys(CORE).length - 1} regressors in all).`],
      [`Disclosure model  ·  N = ${fmt(A.models.disclosure_lpm.n)} in-scope postings`,
        [{ text: "Pr(" }, it("Pay stated"), sub("ij"), { text: ") = δ + θ " }, it("Mandate"), sub("ij"), { text: " + " }, it("Z"), sub("ij"), { text: "′λ + u" }, sub("ij")],
        "A linear probability model. Z controls for seniority, remote eligibility, data-center operator and census region."],
    ];
    eqs.forEach(([h, eq, b], i) => {
      const x = M + i * (cw + 0.3);
      R(s, { x, y: 1.7, w: cw, h: 2.1, fill: { color: CREAM } });
      T(s, h, { x: x + 0.3, y: 1.85, w: cw - 0.6, h: 0.35, fontSize: 14, bold: true, color: CRIMSON_DK });
      T(s, eq, { x: x + 0.3, y: 2.3, w: cw - 0.6, h: 0.7, fontFace: HEAD, fontSize: 17, color: INK, valign: "middle" });
      T(s, b, { x: x + 0.3, y: 3.05, w: cw - 0.6, h: 0.7, fontSize: 12, color: INK });
    });
    const steps = [
      ["Pre-registered", "Seven hypotheses and their signs were committed before the national sample was collected."],
      ["Specification by sample size", `${A.obs_per_regressor} observations per regressor (rule: at least 20), so the extended model (${Object.keys(EXT).length - 1} regressors) is estimated too.`],
      ["Few-cluster inference", `Standard errors clustered by employer (${NCL}); every p-value read from a wild cluster bootstrap (Rademacher, ${fmt(A.wild_cluster_bootstrap.reps_requested)} draws).`],
      ["Four robustness checks", `Price-adjusted pay; without nationwide-remote postings; without ${BIG}; without the federal rows.`],
    ];
    const sw = (CW - 3 * 0.25) / 4;
    steps.forEach(([h, b], i) => {
      const x = M + i * (sw + 0.25);
      badge(s, i + 1, x, 4.2);
      if (i < 3) LINE(s, x + 0.56, 4.43, sw - 0.42, 0, RULE, 1.5);
      T(s, h, { x, y: 4.82, w: sw, h: 0.32, fontSize: 14, bold: true });
      T(s, b, { x, y: 5.18, w: sw - 0.05, h: 1.1, fontSize: 13, color: INK });
    });
    caption(s, "i indexes postings, j employers. Associational design: one cross-section with no time variation, so no difference-in-differences.", 6.45);
    notes(s, "Two models. The pay model regresses the log of the advertised range midpoint on posting attributes, on the postings that state pay. " +
      "The disclosure model is a linear probability model of whether pay is stated at all, on every in-scope posting, with the mandate indicator as the variable of interest. " +
      `Hypotheses and signs were pre-registered. The specification is chosen by sample size, not by results: at ${A.obs_per_regressor} observations per regressor the extended model is also estimated. ` +
      `Postings from one employer are correlated, so standard errors are clustered by employer. With ${NCL} clusters of very uneven size, conventional clustered p-values over-reject, so every significance claim is read from a wild cluster bootstrap (Cameron, Gelbach and Miller 2008): it resamples residuals by employer, flipping signs at random, to build the test's distribution under the null. ` +
      "Four robustness checks follow. The design is associational: a single cross-section cannot separate the law from the employers who operate under it.");
  }

  // ======================================================== 9. R1 Disclosure gap
  {
    const s = content("Results", "Results · Disclosure",
      `Pay is stated in ${pct0(mShare)} of postings where the law requires it, ${pct0(nShare)} elsewhere`);
    // two bars, drawn
    const bx = M + 0.4, by = 1.9, bh = 4.0, bw = 1.7;
    const bars = [[mShare, "Mandate state", DISC.all.n_mandate, CRIMSON], [nShare, "No mandate", DISC.all.n_no_mandate, GRAY]];
    LINE(s, M, by + bh, 5.2, 0, INK, 1);
    bars.forEach(([v, lab, n, col], i) => {
      const x = bx + i * (bw + 0.8), h = bh * v;
      R(s, { x, y: by + bh - h, w: bw, h, fill: { color: col } });
      T(s, pct1(v), { x: x - 0.2, y: by + bh - h - 0.55, w: bw + 0.4, h: 0.5, fontFace: HEAD, fontSize: 26, bold: true, color: i ? MUTED : CRIMSON, align: "center", valign: "bottom" });
      T(s, [{ text: lab, options: { bold: true, breakLine: true } }, { text: `n = ${fmt(n)}`, options: { color: MUTED } }],
        { x: x - 0.3, y: by + bh + 0.08, w: bw + 0.6, h: 0.55, fontSize: 12, align: "center" });
    });
    // the gap, and its stability
    const rx = 6.4, rw = W - M - rx;
    T(s, (GAP * 100).toFixed(1), { x: rx, y: 1.75, w: 2.3, h: 1.0, fontFace: HEAD, fontSize: 60, bold: true, color: CRIMSON, valign: "middle" });
    T(s, [{ text: "percentage-point gap", options: { bold: true, breakLine: true } }, { text: "share stating pay, mandate minus no mandate", options: { color: MUTED } }],
      { x: rx + 2.35, y: 1.9, w: rw - 2.35, h: 0.75, fontSize: 13, valign: "middle" });
    T(s, "THE GAP UNDER EVERY CUT OF THE SAMPLE", { x: rx, y: 3.05, w: rw, h: 0.3, fontSize: 10, bold: true, color: CRIMSON, charSpacing: 1.5 });
    const cuts = [["all", "All postings"], ["excluding_virginia", "Without Virginia (newest law)"],
      ["excluding_largest_employer", `Without ${BIG}`], ["excluding_federal", "Without federal employers"]];
    const lo = 40, hi = 50, px0 = rx + 3.1, pw = rw - 3.3, X = (v) => px0 + (v - lo) / (hi - lo) * pw;
    cuts.forEach(([k, lab], i) => {
      const y = 3.45 + i * 0.5, g = DISC[k].gap * 100;
      T(s, lab, { x: rx, y, w: 3.0, h: 0.4, fontSize: 12, valign: "middle" });
      LINE(s, px0, y + 0.2, pw, 0, RULE, 1);
      DOT(s, X(g), y + 0.2, 0.18, CRIMSON);
      T(s, g.toFixed(1), { x: X(g) + 0.12, y, w: 0.6, h: 0.4, fontSize: 11, color: INK, valign: "middle" });
    });
    [40, 45, 50].forEach((t) => T(s, `${t}`, { x: X(t) - 0.3, y: 5.45, w: 0.6, h: 0.25, fontSize: 10, color: MUTED, align: "center" }));
    const gaps = cuts.map(([k]) => DISC[k].gap * 100);
    R(s, { x: rx, y: 5.85, w: rw, h: 0.6, fill: { color: PALE } });
    T(s, [{ text: "Associational, not causal: ", options: { bold: true } },
      { text: "a single cross-section; employers in mandate states differ in other ways." }],
      { x: rx + 0.2, y: 5.85, w: rw - 0.4, h: 0.6, fontSize: 12, valign: "middle" });
    notes(s, `The clearest result is about disclosure rather than the level of pay. In mandate states ${pct1(mShare)} of ${fmt(DISC.all.n_mandate)} postings state pay; elsewhere ${pct1(nShare)} of ${fmt(DISC.all.n_no_mandate)}: a gap of ${(GAP * 100).toFixed(1)} points. ` +
      `It ranges only from ${Math.min(...gaps).toFixed(1)} to ${Math.max(...gaps).toFixed(1)} points across cuts: dropping Virginia, whose law took effect on ${longDate(D.mandate_dates.VA)}; dropping the largest employer; dropping the federal agencies. ` +
      "This is associational. There is no time variation, so no difference-in-differences, and employers in mandate states differ from others in ways the data cannot control for.");
  }

  // ======================================================== 10. R2 Conditional gap
  {
    const m = LPM.mandate_state;
    const s = content("Results", "Results · Disclosure",
      `With controls, a mandate is still associated with a ${Math.round(m.coef * 100)}-point higher chance of stating pay`);
    const keys = ["mandate_state", "region_south", "region_northeast", "region_west", "remote_eligible", "industry_data_center", "seniority_rank"]
      .filter((k) => LPM[k]);
    const LPM_PHRASE = { region_northeast: "the Northeast", region_west: "the West", region_south: "the South",
      remote_eligible: "remote eligibility", industry_data_center: "a data-center operator", seniority_rank: "seniority" };
    const rows = keys.map((k) => ({
      label: LABEL[k], est: LPM[k].coef * 100, ciLo: LPM[k].ci_low * 100, ciHi: LPM[k].ci_high * 100,
      color: LPM[k].p_value < 0.05 ? CRIMSON : GRAY, bold: k === "mandate_state",
      extra: k === "mandate_state" ? (X, cy) => {
        LINE(s, X(GAP * 100), cy - 0.22, 0, 0.44, INK, 1.25, "dash");
        T(s, `raw gap ${(GAP * 100).toFixed(1)}`, { x: X(GAP * 100) - 0.6, y: cy - 0.5, w: 1.2, h: 0.25, fontSize: 10, color: INK, align: "center" });
      } : null,
    }));
    T(s, `Change in the probability of stating pay, percentage points with 95% CI (N = ${fmt(A.models.disclosure_lpm.n)})`,
      { x: M, y: 1.65, w: 7.3, h: 0.5, fontSize: 12, color: MUTED });
    intervalPlot(s, rows, { x: M, y: 2.35, w: 7.3, rowH: 0.52, labelW: 2.9, lo: -60, hi: 60, ticks: [-60, -30, 0, 30, 60], unit: "" });
    caption(s, `Standard errors clustered by employer. R² = ${A.models.disclosure_lpm.r_squared.toFixed(3)}. Crimson: p < 0.05 (clustered; this model has no bootstrap). Region effects are relative to the Midwest.`, 6.45);

    const rx = 8.35, rw = W - M - rx;
    const order = ["west", "remote_national", "northeast", "midwest", "south"];
    const nm = { west: "West", remote_national: "Nationwide remote", northeast: "Northeast", midwest: "Midwest", south: "South" };
    const rd = D.region_disclosure;
    const ks = order.filter((k) => rd[k]);
    hbar(s, ks.map((k) => `${nm[k]} (${pct0(rd[k].n_mandate / rd[k].n)} covered)`), ks.map((k) => rd[k].share_disclosed),
      { x: rx, y: 1.65, w: rw, h: 3.4, title: "Share stating pay, by region", max: 1.15, fmt: "0%", series: "Share" });
    R(s, { x: rx, y: 5.2, w: rw, h: 1.0, fill: { color: TINT } });
    const lowest = ks.slice().sort((a, b) => rd[a].share_disclosed - rd[b].share_disclosed)[0];
    T(s, `The ${nm[lowest]} has the lowest disclosure (${pct0(rd[lowest].share_disclosed)}) and ${pct0(rd[lowest].n_mandate / rd[lowest].n)} of its postings covered; with region held fixed the gap goes from ${(GAP * 100).toFixed(1)} to ${(m.coef * 100).toFixed(1)} points.`,
      { x: rx + 0.2, y: 5.2, w: rw - 0.4, h: 1.0, fontSize: 12, valign: "middle", color: CRIMSON_DK });
    notes(s, `An economist will ask whether the raw gap is just geography. Holding region, seniority, remote eligibility and industry fixed, a mandate is associated with a ${(m.coef * 100).toFixed(1)}-point higher probability of stating pay, 95% interval ${(m.ci_low * 100).toFixed(1)} to ${(m.ci_high * 100).toFixed(1)}. ` +
      `So controls absorb some of the raw ${(GAP * 100).toFixed(1)}-point gap, but most of it remains. The ${nm[lowest]} is the outlier: ${pct0(rd[lowest].n_mandate / rd[lowest].n)} of its postings are covered and disclosure is lowest, ${pct0(rd[lowest].share_disclosed)}. ` +
      `${cap(joinNames(keys.filter((k) => LPM[k].p_value >= 0.05).map((k) => LPM_PHRASE[k] || k)))} do not predict disclosure at 5%. This model has no bootstrap, so its p-values are the clustered ones.`);
  }

  // ======================================================== 11. R3 Coefficient plot
  {
    const s = content("Results", "Results · Pay",
      `${cap(joinNames(ROBUST.map((k) => PHRASE[k] || k)))} predict advertised pay under every check`);
    const rankV = { robust: 0, tentative: 1, nominal: 1, overturned: 2, ns: 3 };
    const keys = Object.keys(CORE).filter((k) => k !== "const")
      .sort((a, b) => (rankV[V[a]] - rankV[V[b]]) || (pe(CORE[b]) - pe(CORE[a])));
    const style = { robust: { color: CRIMSON }, tentative: { color: CRIMSON, hollow: true }, nominal: { color: CRIMSON, hollow: true },
      overturned: { color: MUTED }, ns: { color: GRAY } };
    const rows = keys.map((k) => Object.assign({
      label: LABEL[k], est: pe(CORE[k]), ciLo: effect(CORE[k].ci_low), ciHi: effect(CORE[k].ci_high),
      bold: V[k] === "robust", labelColor: V[k] === "ns" ? MUTED : INK,
    }, style[V[k]]));
    intervalPlot(s, rows, { x: M, y: 1.7, w: 8.3, rowH: 0.29, labelW: 3.0, lo: -20, hi: 30, ticks: [-20, -10, 0, 10, 20, 30], unit: "%" });
    const rx = 9.3, rw = W - M - rx;
    T(s, "HOW TO READ IT", { x: rx, y: 1.7, w: rw, h: 0.3, fontSize: 10, bold: true, color: CRIMSON, charSpacing: 1.5 });
    const leg = [
      [CRIMSON, false, VERDICT_TEXT.robust, joinNames(ROBUST.map((k) => PHRASE[k] || k))],
      [CRIMSON, true, "Tentative or nominal only", "passes the bootstrap, fails a check"],
      [MUTED, false, VERDICT_TEXT.overturned, "clustered p < 0.05, bootstrap p ≥ 0.05"],
      [GRAY, false, VERDICT_TEXT.ns, ""],
    ];
    leg.forEach(([c, hollow, h, b], i) => {
      const y = 2.12 + i * 0.78;
      DOT(s, rx + 0.1, y + 0.13, 0.17, hollow ? WHITE : c, hollow ? c : null);
      T(s, h, { x: rx + 0.35, y, w: rw - 0.35, h: 0.28, fontSize: 12, bold: true });
      if (b) T(s, b, { x: rx + 0.35, y: y + 0.28, w: rw - 0.35, h: 0.45, fontSize: 11, color: MUTED });
    });
    R(s, { x: rx, y: 5.3, w: rw, h: 1.05, fill: { color: CREAM } });
    T(s, `Core model, N = ${fmt(N)}, ${NCL} employer clusters, R² = ${A.models.core.r_squared.toFixed(3)}. Dot: % effect, e^β − 1. Bar: 95% cluster-robust CI.`,
      { x: rx + 0.15, y: 5.3, w: rw - 0.3, h: 1.05, fontSize: 11, valign: "middle" });
    notes(s, "The pay model. Each row is one attribute; the dot is its percentage effect on advertised pay and the bar its 95% interval. " +
      `${cap(joinNames(ROBUST.map((k) => PHRASE[k] || k)))} hold under the bootstrap and all four robustness checks. ` +
      `Hollow crimson dots pass the bootstrap but fail a check: ${joinNames(TENT.concat(NOMINAL).map((k) => PHRASE[k] || k))}. ` +
      `Grey dots are ${OVER.length ? joinNames(OVER.map((k) => PHRASE[k] || k)) + ", which clustered errors call significant but the bootstrap overturns, and " : ""}attributes with no detectable effect. ` +
      ROBUST.filter((k) => !PRED.has(k) && !CONTROL.has(k)).map((k) => `${cap(PHRASE[k] || k)} carried no prediction in the pre-registration, so it is exploratory.`).join(" "));
  }

  // ======================================================== 12. R4 Economic size
  {
    const mean = D.pay_stats.mean;
    const sp = D.seniority_profile, bS = CORE.seniority_rank.coef;
    const s = content("Results", "Results · Pay",
      `In dollars: one seniority step is worth about ${usd(Math.round(mean * (Math.exp(bS) - 1) / 1000) * 1000)} a year`);
    const tiles = ROBUST.map((k) => {
      const e = pe(CORE[k]);
      const unit = k === "seniority_rank" ? "per seniority step" : k === "yrs_exp_min" ? "per year of required experience" : `for ${PHRASE[k] || k}`;
      return [sgn(e) + "%", unit, `≈ ${usd(Math.round(mean * e / 100 / 100) * 100)} a year at mean pay`, PRED.has(k) ? "Pre-registered" : CONTROL.has(k) ? "Control" : "Exploratory"];
    });
    tiles.forEach(([v, u, d, tag], i) => {
      const y = 1.7 + i * 1.55;
      R(s, { x: M, y, w: 4.9, h: 1.38, fill: { color: i === 0 ? TINT : CREAM } });
      T(s, v, { x: M + 0.2, y, w: 2.0, h: 1.38, fontFace: HEAD, fontSize: 36, bold: true, color: CRIMSON, valign: "middle" });
      T(s, [{ text: u, options: { bold: true, breakLine: true } }, { text: d, options: { breakLine: true } }, { text: tag, options: { color: MUTED, italic: true } }],
        { x: M + 2.2, y, w: 2.6, h: 1.38, fontSize: 12, valign: "middle" });
    });
    const ranks = Object.keys(sp.n_by_rank).map(Number).sort((a, b) => a - b);
    const pred = ranks.map((r) => Math.exp(sp.mean_log_pay + bS * (r - sp.mean_rank)));
    const rx = 5.9, rw = W - M - rx;
    s.addChart(p.charts.BAR, [{ name: "Predicted pay", labels: ranks.map((r) => `${RANK[r]}\n(n=${sp.n_by_rank[r]})`), values: pred }], {
      x: rx, y: 1.65, w: rw, h: 4.55, barDir: "col", chartColors: [CRIMSON], barGapWidthPct: 40,
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$#,##0", dataLabelColor: INK, dataLabelFontSize: 11, dataLabelFontFace: "Arial",
      catAxisLabelColor: INK, catAxisLabelFontSize: 10, catAxisLabelFontFace: "Arial", catAxisLineShow: true,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, valAxisMinVal: 0,
      showTitle: true, title: "Predicted advertised pay by seniority, other attributes at sample means", titleFontSize: 12, titleColor: INK, titleFontFace: "Arial",
    });
    caption(s, `Mean advertised pay ${usd(mean)} (median ${usd(D.pay_stats.median)}). Predictions are geometric means from the core model: exp(mean ln pay + β × (rank − mean rank)).`, 6.3);
    notes(s, `Translating log points into dollars at mean pay of ${usd(mean)}: ` + tiles.map(([v, u, d]) => `${v} ${u}, ${d.replace("≈ ", "about ")}`).join("; ") + ". " +
      `The chart traces predicted pay up the seniority ladder holding everything else at its sample mean, from about ${usdK(pred[0])} at entry level to about ${usdK(pred[pred.length - 1])} at the top. The executive level has only ${sp.n_by_rank[ranks[ranks.length - 1]]} postings, so read that bar with care.`);
  }

  // ======================================================== 13. R5 Robustness matrix
  {
    const s = content("Results", "Results · Robustness",
      `Only ${ROBUST.length === 3 ? "three" : ROBUST.length} results hold under the bootstrap and all four checks`);
    const keys = VARS.slice().sort((a, b) => BOOT[a].p_value - BOOT[b].p_value);
    const cols = [["Clustered SE", (k) => CORE[k].p_value], ["Wild bootstrap", (k) => BOOT[k].p_value]]
      .concat(CHECKS.map(([, lab, f]) => [lab, f]));
    const hdr = [{ text: "Attribute", options: { bold: true, color: WHITE, fill: { color: CRIMSON } } }]
      .concat(cols.map(([l]) => ({ text: l, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: "center" } })))
      .concat([{ text: "Verdict", options: { bold: true, color: WHITE, fill: { color: CRIMSON } } }]);
    const body = keys.map((k) => [{ text: LABEL[k], options: { bold: V[k] === "robust" } }]
      .concat(cols.map(([, f], j) => {
        const v = f(k); const pass = v !== undefined && v !== null && v < 0.05;
        // A check only matters for a coefficient the bootstrap keeps; the
        // others are shown greyed so the eye goes to the verdicts.
        const live = j < 2 || BOOT[k].p_value < 0.05;
        return { text: pv(v), options: { align: "center", fill: { color: pass && live ? TINT : PALE },
          color: pass && live ? CRIMSON_DK : (live ? INK : GRAY), bold: pass && live } };
      }))
      .concat([{ text: VERDICT_SHORT[V[k]], options: { color: VERDICT_COLOR[V[k]], bold: ["robust", "tentative", "nominal"].includes(V[k]) } }]));
    s.addTable([hdr, ...body], { x: M, y: 1.65, w: CW, colW: [2.75, 1.15, 1.15, 1.45, 1.3, 1.3, 1.35, 1.683], rowH: 0.275,
      fontFace: BODY, fontSize: 10.5, color: INK, valign: "middle", margin: [0, 0.07, 0, 0.07],
      border: { type: "solid", color: WHITE, pt: 1.5 } });
    caption(s, "Cells: p-values; shaded = p < 0.05. Price-adjusted pay has no bootstrap, so that column is clustered. Tentative: p ≥ 0.02 on the bootstrap or the remote check, or fails a check. Nominal only: fails price adjustment alone.", 6.3);
    notes(s, "This table is the study's credibility check. Each row is an attribute; each column a test. Shaded cells pass at 5%. " +
      `${cap(joinNames(ROBUST.map((k) => PHRASE[k] || k)))} pass everything. ` +
      (NOMINAL.length ? `${cap(joinNames(NOMINAL.map((k) => PHRASE[k] || k)))} pass in nominal pay but not once pay is adjusted for regional price levels, so they reflect cost of living. ` : "") +
      (TENT.length ? `${cap(joinNames(TENT.map((k) => PHRASE[k] || k)))} ${TENT.length > 1 ? "are" : "is"} tentative. ` : "") +
      (OVER.length ? `${cap(joinNames(OVER.map((k) => PHRASE[k] || k)))} ${OVER.length > 1 ? "are" : "is"} significant under clustered errors but overturned by the bootstrap.` : ""));
  }

  // ======================================================== 14. R6 Hypotheses
  {
    const s = content("Results", "Results · Pre-registered hypotheses",
      `${N_SUPPORTED === 3 ? "Three" : N_SUPPORTED} of seven pre-registered hypotheses are supported`);
    const est = (h) => {
      if (h.kind === "disc") return `${pct1(mShare)} vs. ${pct1(nShare)}`;
      if (h.kind === "rw") return `${sgn(h.pct)}% range width`;
      return `${sgn(h.pct)}%${h.unit ? " " + h.unit : ""}`;
    };
    const pcol = (h) => h.kind === "disc" ? "descriptive" : h.kind === "rw" ? `${pv(h.p)} (clustered)` : pv(h.p);
    const hdr = ["", "Hypothesis", "Predicted", "Estimate", "p (bootstrap)", "Verdict"]
      .map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i >= 2 && i <= 4 ? "center" : "left" } }));
    const body = HYP.map((h) => {
      const ok = h.mark.startsWith("Supported");
      return [
        { text: h.id, options: { bold: true, color: CRIMSON } },
        { text: h.text },
        { text: "+", options: { align: "center" } },
        { text: est(h), options: { align: "center" } },
        { text: pcol(h), options: { align: "center", color: MUTED } },
        { text: h.mark, options: { bold: true, color: ok ? WHITE : INK, fill: { color: ok ? CRIMSON : PALE } } },
      ];
    });
    s.addTable([hdr, ...body], { x: M, y: 1.75, w: CW, colW: [0.6, 4.1, 1.15, 2.3, 1.6, 2.383], rowH: 0.5,
      fontFace: BODY, fontSize: 13, color: INK, valign: "middle", margin: [0, 0.1, 0, 0.1],
      border: { type: "solid", color: WHITE, pt: 2 } });
    const h5 = HYP.find((h) => h.id === "H5");
    R(s, { x: M, y: 5.95, w: CW, h: 0.5, fill: { color: CREAM } });
    T(s, `H5 has the wrong sign (${sgn(h5.pct)}%); clustered errors would call it significant (p = ${CORE.degree_required.p_value.toFixed(3)}), the bootstrap does not (p = ${h5.p.toFixed(3)}).`,
      { x: M + 0.2, y: 5.95, w: CW - 0.4, h: 0.5, fontSize: 12, valign: "middle" });
    notes(s, "The hypotheses were written down, with their signs, before the national sample was collected, and every one is scored here whether or not it held. " +
      HYP.map((h) => `${h.id}, ${/^[A-Z]{2}/.test(h.text) ? h.text : h.text.charAt(0).toLowerCase() + h.text.slice(1)}: ${h.mark.toLowerCase()}`).join("; ") + ". " +
      "H5 is the instructive case: the estimate is negative, opposite to the prediction, and the conventional and bootstrap procedures disagree about it, which is exactly the situation the pre-registration anticipated.");
  }

  // ======================================================== 15. R7 Early career
  {
    const ecN = A.models.early_career.n, ecE = (A.early_career_subsample || {}).n_employers;
    const sigEC = Object.keys(EC).filter((k) => k !== "const" && EC[k].p_value < 0.05);
    const s = content("Results", "Results · The early-career question",
      `Early-career postings: ${ecN} observations are too few to pin down premiums`);
    const keys = ["yrs_exp_min", "degree_required", "degree_stem", "skill_cloud", "skill_ml_ai", "family_ai_ml", "industry_data_center", "mandate_state"]
      .filter((k) => EC[k] && CORE[k]);
    const rows = [];
    keys.forEach((k) => {
      rows.push({ label: LABEL[k], est: pe(CORE[k]), ciLo: effect(CORE[k].ci_low), ciHi: effect(CORE[k].ci_high), color: CRIMSON, bold: true });
      rows.push({ label: "   early career", est: pe(EC[k]), ciLo: effect(EC[k].ci_low), ciHi: effect(EC[k].ci_high), color: MUTED, hollow: true, labelColor: MUTED });
    });
    intervalPlot(s, rows, { x: M, y: 1.7, w: 8.3, rowH: 0.27, labelW: 3.0, lo: -30, hi: 60, ticks: [-30, 0, 30, 60], unit: "%" });
    const rx = 9.3, rw = W - M - rx;
    R(s, { x: rx, y: 1.7, w: rw, h: 1.5, fill: { color: TINT } });
    T(s, String(ecN), { x: rx + 0.2, y: 1.75, w: 1.3, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: CRIMSON, valign: "middle" });
    T(s, `early-career postings that state pay, from ${ecE} employers`, { x: rx + 1.6, y: 1.8, w: rw - 1.75, h: 0.85, fontSize: 12, valign: "middle" });
    T(s, `Full sample: N = ${fmt(N)}`, { x: rx + 0.2, y: 2.7, w: rw - 0.4, h: 0.35, fontSize: 12, color: MUTED });
    T(s, [{ text: "Crimson: ", options: { bold: true, color: CRIMSON } }, { text: "full sample (core model).", options: { breakLine: true } },
      { text: "Grey, hollow: ", options: { bold: true, color: MUTED } }, { text: "early-career subsample (no bootstrap; clustered p)." }],
    { x: rx, y: 3.4, w: rw, h: 0.85, fontSize: 12 });
    T(s, sigEC.length ? `At p < 0.05 (clustered): ${joinNames(sigEC.map((k) => `${PHRASE[k] || LABEL[k]} (${sgn(pe(EC[k]), 0)}%)`))}. Intervals this wide cannot be read as findings.`
      : "Nothing reaches p < 0.05 in the subsample.",
    { x: rx, y: 4.35, w: rw, h: 1.0, fontSize: 12 });
    // The full-sample verdicts of the plotted attributes, so a crimson dot is
    // never read as a finding the bootstrap rejected.
    const fullNo = keys.filter((k) => ["overturned", "ns"].includes(V[k]));
    if (fullNo.length) T(s, `In the full sample, ${joinNames(fullNo.map((k) => lc(LABEL[k])))} ${fullNo.length > 1 ? "are" : "is"} not significant under the bootstrap.`,
      { x: rx, y: 5.4, w: rw, h: 0.75, fontSize: 11, color: MUTED });
    const ecRanks = Object.keys(D.early_career.ranks_with_pay || {}).map((r) => RANK[r].toLowerCase());
    caption(s, `Early career: an entry-level title, or a stated experience minimum of ${D.early_career.max_years} years or less. Bars: 95% cluster-robust CI. ` +
      `Seniority is left off the plot: the subsample spans only ${joinNames(ecRanks)} ranks.`, 6.3);
    notes(s, `The study began as a question about early-career pay specifically, so that subsample is reported on its own: ${ecN} postings from ${ecE} employers. ` +
      "Its intervals, in grey, are several times wider than the full sample's, in crimson. " +
      (sigEC.length ? `Under clustered errors only ${joinNames(sigEC.map((k) => PHRASE[k] || LABEL[k]))} reach 5%, with no bootstrap on this model and intervals running from ${sgn(Math.min(...sigEC.map((k) => effect(EC[k].ci_low))), 1)}% to ${sgn(Math.max(...sigEC.map((k) => effect(EC[k].ci_high))), 0)}%. ` : "") +
      `For a student, the practical reading is the full-sample one: ${joinNames(ROBUST.map((k) => PHRASE[k] || k))} are what move the posted number.`);
  }

  // ======================================================== 16. R8 What did not hold
  {
    const s = content("Results", "Results · What did not hold",
      "What did not hold up");
    const cards = [];
    if (OVER.length) cards.push(["Overturned by the bootstrap", OVER.map((k) =>
      `${LABEL[k]} ${sgn(pe(CORE[k]))}%: p = ${CORE[k].p_value.toFixed(3)} clustered, ${BOOT[k].p_value.toFixed(3)} bootstrap`)]);
    const deg = CORE.degree_required;
    if (deg && deg.coef < 0) cards.push(["A degree requirement: wrong sign, inconclusive", [
      `Predicted to raise pay; estimated ${sgn(pe(deg))}% (bootstrap p = ${BOOT.degree_required.p_value.toFixed(3)}).`,
      "Not distinguishable from zero at this cluster count."]]);
    TENT.filter((k) => !CONTROL.has(k)).forEach((k) => cards.push([`${LABEL[k]}: tentative`, [
      `${sgn(pe(CORE[k]))}% (bootstrap p = ${BOOT[k].p_value.toFixed(3)}), but fails ` +
      joinNames(failedChecks(k).map(([, lab, f]) => `${lab.charAt(0).toLowerCase() + lab.slice(1)} (p = ${f(k).toFixed(3)})`)) + "."]]));
    if (NOMINAL.length) cards.push(["Regional premiums: nominal only", NOMINAL.map((k) =>
      `${LABEL[k].replace(" (vs. Midwest)", "")} ${sgn(pe(CORE[k]))}% nominal; price-adjusted p = ${REAL[k].p_value.toFixed(3)}`)]);
    const cw = (CW - 0.3) / 2, ch = 2.15;
    cards.slice(0, 4).forEach(([h, lines], i) => {
      const x = M + (i % 2) * (cw + 0.3), y = 1.75 + Math.floor(i / 2) * (ch + 0.3);
      R(s, { x, y, w: cw, h: ch, fill: { color: i === 0 ? TINT : CREAM } });
      badge(s, i + 1, x + 0.25, y + 0.25);
      T(s, h, { x: x + 0.9, y: y + 0.17, w: cw - 1.1, h: 0.62, fontSize: 16, bold: true, valign: "middle", color: CRIMSON_DK });
      T(s, lines.map((l, j) => ({ text: l, options: { breakLine: j < lines.length - 1 } })),
        { x: x + 0.9, y: y + 0.9, w: cw - 1.15, h: ch - 1.05, fontSize: 13, paraSpaceAfter: 6 });
    });
    caption(s, "Reported because they were tested: a null or a reversal is a result. The AI/ML premium did not hold, so it is not claimed.", 6.5);
    notes(s, "Results that did not hold are reported as carefully as those that did. " + cards.map(([h, l]) => `${h}. ${l.map((x) => x.replace(/\.+$/, "")).join("; ")}.`).join(" ") +
      " The AI and machine-learning premium is the one most people would expect; under clustered errors it looks significant, but the bootstrap, which this study pre-registered for exactly this situation, does not support it.");
  }

  // ======================================================== 17. Threats to validity
  {
    const s = content("Threats to validity", "Threats to validity", "Four threats, and how each is handled");
    const items = [
      ["Advertised is not realized pay", "The outcome is the midpoint of the posted range; offers can be negotiated in either direction."],
      ["Disclosure is selected", `Where no law applies only ${pct0(nShare)} of postings state pay, so pay coefficients are conditional on disclosure. Disclosure is modelled as its own outcome.`],
      ["Associational, not causal", "One cross-section with no time variation: no difference-in-differences. Employers in mandate states differ in other ways."],
      ["Few, uneven clusters", `${NCL} employers, the largest ${pct1(BIG_SHARE)} of rows. Every p-value comes from the wild cluster bootstrap; ${BIG} is also dropped as a check.`],
    ];
    const cw = (CW - 0.3) / 2, ch = 1.85;
    items.forEach(([h, b], i) => {
      const x = M + (i % 2) * (cw + 0.3), y = 1.75 + Math.floor(i / 2) * (ch + 0.3);
      R(s, { x, y, w: cw, h: ch, fill: { color: i === 1 ? TINT : CREAM } });
      badge(s, i + 1, x + 0.25, y + 0.25);
      T(s, h, { x: x + 0.9, y: y + 0.25, w: cw - 1.1, h: 0.46, fontSize: 17, bold: true, valign: "middle" });
      T(s, b, { x: x + 0.9, y: y + 0.82, w: cw - 1.15, h: ch - 0.95, fontSize: 13 });
    });
    caption(s, `Also: pay is nominal in the headline model (a price-adjusted re-estimate, N = ${fmt(A.models.real_pay.n)}, is in the robustness table); scope widened in response to the data, with every change dated in the pre-registration; four Chicago-area employers on iCIMS are absent.`, 6.25);
    notes(s, `Four threats. First, the outcome is advertised pay, not what anyone is paid. Second, and most important, disclosure is selected: where there is no law, only ${pct0(nShare)} of postings state pay, so every pay coefficient describes the postings that chose to disclose. That is why disclosure is modelled as an outcome rather than assumed away. ` +
      "Third, the mandate contrast is associational. Fourth, there are few employer clusters of uneven size, which is why every p-value comes from the wild cluster bootstrap and the largest employer is dropped as a check. " +
      "The other threats in the paper's section 6 are on the caption: nominal pay, scope changes made after seeing data and recorded as dated amendments, and the iCIMS employers who could not be collected under their terms.");
  }

  // ======================================================== 18. Conclusion
  {
    const s = content("Conclusion", "Conclusion", "Conclusion");
    const tk = [
      [`${pct0(mShare)} vs. ${pct0(nShare)}`, "Disclosure follows the law",
        `Where a law requires it, ${pct1(mShare)} of postings state pay; elsewhere ${pct1(nShare)}. Stable at ${Math.min(...Object.values(DISC).map((d) => d.gap * 100)).toFixed(0)}–${Math.max(...Object.values(DISC).map((d) => d.gap * 100)).toFixed(0)} points across every cut. Associational.`],
      [`${sgn(pe(CORE.seniority_rank))}%`, "Seniority and experience set the level",
        `Per seniority step, and ${sgn(pe(CORE.yrs_exp_min))}% per year of required experience, as pre-registered. A cloud skill adds ${sgn(pe(CORE.skill_cloud))}% (exploratory).`],
      ["Did not hold", "Several expected premiums", [
        OVER.length ? `${OVER.map((k) => LABEL[k]).join(", ")}: overturned by the bootstrap.` : "",
        CORE.degree_required && CORE.degree_required.coef < 0 && BOOT.degree_required.p_value >= 0.05 ? "Degree requirement: wrong sign." : "",
        NOMINAL.length ? `${NOMINAL.map((k) => LABEL[k].replace(" (vs. Midwest)", "")).join(", ")}: nominal pay only.` : "",
      ].filter(Boolean).join(" ")],
    ];
    const cw = (CW - 0.6) / 3;
    tk.forEach(([big, h, b], i) => {
      const x = M + i * (cw + 0.3);
      R(s, { x, y: 1.75, w: cw, h: 2.95, fill: { color: i === 0 ? TINT : CREAM } });
      T(s, big, { x: x + 0.3, y: 1.9, w: cw - 0.6, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: CRIMSON, valign: "middle" });
      T(s, h, { x: x + 0.3, y: 2.75, w: cw - 0.6, h: 0.6, fontSize: 16, bold: true });
      T(s, b, { x: x + 0.3, y: 3.35, w: cw - 0.6, h: 1.3, fontSize: 13 });
    });
    T(s, `Across ${fmt(N)} postings from ${NCL} employers, the sharpest regularity is not how much pay is advertised, but whether it is named at all.`,
      { x: M, y: 4.9, w: CW, h: 0.75, fontFace: HEAD, fontSize: 18, italic: true, color: INK, valign: "middle" });
    R(s, { x: M, y: 5.85, w: CW, h: 0.6, fill: { color: PALE } });
    T(s, [{ text: "AI disclosure: ", options: { bold: true } },
      { text: "the collection and analysis code and this deck were produced with Claude Code, Anthropic's AI coding assistant. Study design, decisions and interpretation are the author's." }],
    { x: M + 0.2, y: 5.85, w: CW - 0.4, h: 0.6, fontSize: 11, color: INK, valign: "middle" });
    notes(s, `Three takeaways. First, disclosure tracks the law: a gap of ${(GAP * 100).toFixed(1)} points that is stable under every cut, though associational. ` +
      `Second, within postings that state pay, ${joinNames(ROBUST.map((k) => `${PHRASE[k] || k} (${sgn(pe(CORE[k]))}%)`))} hold under every check. ` +
      `Third, what did not hold: ${tk[2][2]} ` +
      "The sharpest regularity is about whether pay is named at all. Finally, a disclosure: an AI coding assistant was used to build the collection and analysis code and this deck; design and interpretation are the author's.");
  }

  // ======================================================== Appendix
  divider("Appendix", "Appendix", "Appendix", "Full model tables, definitions, data quality and the employer list.");

  const coefTable = (s, coefs, opts) => {
    const keys = Object.keys(coefs).filter((k) => k !== "const");
    const hdr = ["Attribute", "Coef.", "Std. err.", "Clustered p"].concat(opts.boot ? ["Bootstrap p"] : []).concat(["% effect"])
      .map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i ? "right" : "left" } }));
    const body = keys.map((k, i) => {
      const c = coefs[k];
      const bp = opts.boot && BOOT[k] ? BOOT[k].p_value : null;
      const sig = (opts.boot && bp !== null ? bp : c.p_value) < 0.05;
      return [LABEL[k] || k, num(c.coef, 4), c.std_err.toFixed(4), pv(c.p_value)].concat(opts.boot ? [pv(bp)] : []).concat([sgn(pe(c)) + "%"])
        .map((t, j) => ({ text: t, options: { align: j ? "right" : "left", bold: sig && j === 0, color: sig ? CRIMSON_DK : INK, fill: { color: i % 2 ? WHITE : "FAFAFA" } } }));
    });
    s.addTable([hdr, ...body], Object.assign({ fontFace: BODY, color: INK, valign: "middle", margin: [0, 0.07, 0, 0.07], border: { type: "none" } }, opts.table));
  };

  // A1 core model
  {
    const s = content("Appendix", "Appendix · A1", "Core model (pre-specified): log advertised pay");
    coefTable(s, CORE, { boot: true, table: { x: M, y: 1.65, w: 9.2, colW: [3.2, 1.1, 1.1, 1.25, 1.25, 1.3], rowH: 0.27, fontSize: 11 } });
    const rx = 10.1, rw = W - M - rx;
    [[fmt(N), "observations"], [String(NCL), "employer clusters"], [A.models.core.r_squared.toFixed(3), "R²"], [String(A.power.min_detectable_std_effect_log_points), "minimum detectable effect (log points)"]].forEach(([v, l], i) => {
      const y = 1.65 + i * 1.1;
      R(s, { x: rx, y, w: rw, h: 0.95, fill: { color: CREAM } });
      T(s, v, { x: rx + 0.15, y, w: rw - 0.3, h: 0.55, fontFace: HEAD, fontSize: 24, bold: true, color: CRIMSON, valign: "bottom" });
      T(s, l, { x: rx + 0.15, y: y + 0.53, w: rw - 0.3, h: 0.4, fontSize: 10, color: MUTED });
    });
    caption(s, `Crimson rows: bootstrap p < 0.05. Constant ${num(CORE.const.coef, 3)}. Wild cluster bootstrap: restricted, Rademacher weights, ${fmt(A.wild_cluster_bootstrap.reps_requested)} draws, seed ${A.wild_cluster_bootstrap.seed}. Regions relative to the Midwest.`, 6.3);
  }
  // A2 extended model, two columns
  {
    const s = content("Appendix", "Appendix · A2", `Extended model: ${Object.keys(EXT).length - 1} regressors (clustered SEs, no bootstrap)`);
    const keys = Object.keys(EXT).filter((k) => k !== "const");
    const halfN = Math.ceil(keys.length / 2);
    [keys.slice(0, halfN), keys.slice(halfN)].forEach((ks, i) => {
      const sub = Object.fromEntries(ks.map((k) => [k, EXT[k]]));
      coefTable(s, sub, { boot: false, table: { x: M + i * 6.15, y: 1.65, w: 5.95, colW: [2.35, 0.85, 0.85, 0.95, 0.95], rowH: 0.3, fontSize: 10.5 } });
    });
    caption(s, `N = ${fmt(A.models.extended.n)}, R² = ${A.models.extended.r_squared.toFixed(3)}. Crimson rows: clustered p < 0.05. Estimated because the sample supports it (${A.obs_per_regressor} observations per core regressor); inference in the main slides uses the core model.`, 6.3);
  }
  // A3 disclosure LPM and price-adjusted comparison
  {
    const s = content("Appendix", "Appendix · A3", "Disclosure model and the price-adjusted pay model");
    const lk = Object.keys(LPM).filter((k) => k !== "const");
    const hdr = ["Disclosure (LPM)", "Coef.", "95% CI", "p"].map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i ? "right" : "left" } }));
    const body = lk.map((k, i) => [LABEL[k], num(LPM[k].coef, 3), `[${num(LPM[k].ci_low, 2)}, ${num(LPM[k].ci_high, 2)}]`, pv(LPM[k].p_value)]
      .map((t, j) => ({ text: t, options: { align: j ? "right" : "left", color: LPM[k].p_value < 0.05 ? CRIMSON_DK : INK, fill: { color: i % 2 ? WHITE : "FAFAFA" } } })));
    s.addTable([hdr, ...body], { x: M, y: 1.65, w: 5.7, colW: [2.4, 0.9, 1.5, 0.9], rowH: 0.3, fontFace: BODY, fontSize: 11, color: INK, valign: "middle", margin: [0, 0.07, 0, 0.07], border: { type: "none" } });
    T(s, `N = ${fmt(A.models.disclosure_lpm.n)}, R² = ${A.models.disclosure_lpm.r_squared.toFixed(3)}; clustered by employer.`, { x: M, y: 4.45, w: 5.7, h: 0.3, fontSize: 10, color: MUTED });
    const rk = Object.keys(REAL).filter((k) => k !== "const");
    const h2 = ["Pay model", "Nominal p (boot.)", "Real coef.", "Real p"].map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i ? "right" : "left" } }));
    const b2 = rk.map((k, i) => [LABEL[k], pv(BOOT[k] ? BOOT[k].p_value : null), num(REAL[k].coef, 3), pv(REAL[k].p_value)]
      .map((t, j) => ({ text: t, options: { align: j ? "right" : "left", color: (BOOT[k] && BOOT[k].p_value < 0.05) && REAL[k].p_value >= 0.05 ? CRIMSON : INK,
        bold: (BOOT[k] && BOOT[k].p_value < 0.05) && REAL[k].p_value >= 0.05, fill: { color: i % 2 ? WHITE : "FAFAFA" } } })));
    s.addTable([h2, ...b2], { x: 6.7, y: 1.65, w: W - M - 6.7, colW: [2.63, 1.4, 1.0, 1.0], rowH: 0.27, fontFace: BODY, fontSize: 10.5, color: INK, valign: "middle", margin: [0, 0.07, 0, 0.07], border: { type: "none" } });
    caption(s, `Real pay divides by BEA regional price parities by state (N = ${fmt(A.models.real_pay.n)}; nationwide-remote postings have no state and drop out). Crimson rows: significant in nominal pay, not in real pay.`, 6.3);
  }
  // A4 who discloses
  {
    const sel = A.selection;
    const s = content("Appendix", "Appendix · A4", `Who discloses pay: ${fmt(sel.n_disclosed)} postings that state it vs. ${fmt(sel.n_withheld)} that do not`);
    const keys = Object.keys(sel.by_variable);
    const hdr = ["Attribute", "Mean, disclosed", "Mean, withheld", "Difference", "p"].map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON }, align: i ? "right" : "left" } }));
    const body = keys.map((k, i) => { const v = sel.by_variable[k];
      return [LABEL[k] || k.replace(/_/g, " "), v.mean_disclosed.toFixed(3), v.mean_withheld.toFixed(3), sgn(v.diff, 3), pv(v.p_value)]
        .map((t, j) => ({ text: t, options: { align: j ? "right" : "left", color: v.p_value < 0.05 ? CRIMSON_DK : INK, fill: { color: i % 2 ? WHITE : "FAFAFA" } } })); });
    s.addTable([hdr, ...body], { x: M, y: 1.65, w: 8.6, colW: [3.0, 1.45, 1.45, 1.4, 1.3], rowH: 0.27, fontFace: BODY, fontSize: 10.5, color: INK, valign: "middle", margin: [0, 0.07, 0, 0.07], border: { type: "none" } });
    const rx = 9.6, rw = W - M - rx;
    R(s, { x: rx, y: 1.65, w: rw, h: 2.2, fill: { color: TINT } });
    T(s, "Why it matters", { x: rx + 0.2, y: 1.8, w: rw - 0.4, h: 0.35, fontSize: 14, bold: true, color: CRIMSON_DK });
    T(s, "Postings that state pay differ from those that do not, most of all in location and mandate coverage. Pay coefficients describe the disclosing postings only.",
      { x: rx + 0.2, y: 2.2, w: rw - 0.4, h: 1.55, fontSize: 12 });
    caption(s, `Disclosure rate ${pct1(sel.disclosure_rate)}. Crimson rows: difference significant at 5% (two-sample test).`, 6.3);
  }
  // A5 variable definitions
  {
    const s = content("Appendix", "Appendix · A5", "How the attributes are coded");
    const defs = [
      ["Pay (dependent variable)", "Midpoint of the advertised range, annualized to US dollars (hourly × 2,080); logged."],
      ["Seniority (per step)", "Ordinal from the title: 1 entry, 2 mid or unlevelled, 3 senior, 4 staff/principal, 5 manager, 6 director, 7 VP and above."],
      ["Required experience", "Minimum years parsed from the text; 0 when unstated, with an indicator for stating one at all."],
      ["Requires a degree / STEM degree", "A bachelor's or higher is required (not “or equivalent experience”); the degree must be in a STEM field."],
      ["Cloud skill / ML/AI skill", "AWS, Azure or Google Cloud named; machine learning or artificial intelligence named."],
      ["Pay-transparency mandate", "Any listed work location in a state whose posting law was in force on the day the posting was seen."],
      ["Region", "Census region of the work location; Midwest is the reference."],
      ["Data-center operator / AI/ML role family", "Employer's industry category; role family from the title taxonomy."],
    ];
    const hdr = [{ text: "Attribute", options: { bold: true, color: WHITE, fill: { color: CRIMSON } } }, { text: "Coding rule", options: { bold: true, color: WHITE, fill: { color: CRIMSON } } }];
    const body = defs.map(([a, b], i) => [{ text: a, options: { bold: true, fill: { color: i % 2 ? WHITE : "FAFAFA" } } }, { text: b, options: { fill: { color: i % 2 ? WHITE : "FAFAFA" } } }]);
    s.addTable([hdr, ...body], { x: M, y: 1.65, w: CW, colW: [3.6, CW - 3.6], rowH: 0.5, fontFace: BODY, fontSize: 12, color: INK, valign: "middle", margin: [0, 0.1, 0, 0.1], border: { type: "none" } });
    caption(s, "Coded from posting text by word-boundary patterns in config/regressors.yaml; every coded value keeps the pattern that produced it. Full definitions: docs/codebook.md.", 6.3);
  }
  // A6 pay distribution and the four conditions
  {
    const s = content("Appendix", "Appendix · A6", "Advertised pay, and the sample-size conditions");
    const hist = D.pay_hist.filter((b) => b.lo <= D.pay_stats.max);
    s.addChart(p.charts.BAR, [{ name: "Postings", labels: hist.map((b) => usdK(b.lo)), values: hist.map((b) => b.n) }], {
      x: M, y: 1.65, w: 7.6, h: 4.5, barDir: "col", chartColors: [CRIMSON], barGapWidthPct: 15,
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontSize: 10, dataLabelFontFace: "Arial",
      catAxisLabelColor: INK, catAxisLabelFontSize: 10, catAxisLabelFontFace: "Arial", valAxisHidden: true,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, valAxisMinVal: 0,
      showTitle: true, title: `Range midpoints, $25k bins (N = ${fmt(N)})`, titleFontSize: 12, titleColor: INK, titleFontFace: "Arial",
    });
    const rx = 8.6, rw = W - M - rx;
    T(s, "PRE-REGISTERED CONDITIONS (ALL PASS)", { x: rx, y: 1.65, w: rw, h: 0.3, fontSize: 10, bold: true, color: CRIMSON, charSpacing: 1.5 });
    const conds = [
      [A.obs_per_regressor.toFixed(1), "observations per regressor", "need ≥ 20"],
      [String(NCL), "employer clusters", "need ≥ 30"],
      [pct1(BIG_SHARE), "largest employer's share", "need ≤ 25%"],
      [String(A.power.min_detectable_std_effect_log_points), "minimum detectable effect", "need ≤ 0.25 log points"],
    ];
    conds.forEach(([v, l, n], i) => {
      const y = 2.05 + i * 1.02;
      R(s, { x: rx, y, w: rw, h: 0.88, fill: { color: CREAM } });
      T(s, v, { x: rx + 0.15, y, w: 1.45, h: 0.88, fontFace: HEAD, fontSize: 24, bold: true, color: CRIMSON, valign: "middle" });
      T(s, [{ text: l, options: { bold: true, breakLine: true } }, { text: n, options: { color: MUTED } }], { x: rx + 1.65, y, w: rw - 1.8, h: 0.88, fontSize: 12, valign: "middle" });
    });
    caption(s, `Mean ${usd(D.pay_stats.mean)}, median ${usd(D.pay_stats.median)}, SD ${usd(D.pay_stats.sd)}, range ${usd(D.pay_stats.min)}–${usd(D.pay_stats.max)}. Interpretable: ${A.interpretable ? "yes" : "no"}.`, 6.3);
  }
  // A7-A8 audit rounds
  {
    const rounds = D.audit_rounds;
    const halves = [rounds.slice(0, Math.ceil(rounds.length / 2)), rounds.slice(Math.ceil(rounds.length / 2))];
    halves.forEach((rs, hi) => {
      const s = content("Appendix", `Appendix · A${7 + hi}`, `Data quality: ${rounds.length} rounds of hand-auditing (${hi ? "rounds " + rs[0].round + "–" + rs[rs.length - 1].round : "rounds 1–" + rs[rs.length - 1].round})`);
      const hdr = ["#", "What was audited", "What it found"].map((t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: CRIMSON } } }));
      const body = rs.map((r, i) => [String(r.round), r.target.replace(/`/g, ""), r.result.replace(/`/g, "")]
        .map((t, j) => ({ text: t, options: { bold: j === 0, color: j === 0 ? CRIMSON : INK, fill: { color: i % 2 ? WHITE : "FAFAFA" } } })));
      s.addTable([hdr, ...body], { x: M, y: 1.65, w: CW, colW: [0.45, 3.0, CW - 3.45], fontFace: BODY, fontSize: 11, color: INK, valign: "middle", margin: [0.03, 0.08, 0.03, 0.08], border: { type: "none" } });
      caption(s, "Every defect found is pinned by a regression test built from the real title or location string that produced it. Full log: docs/audit-log.md.", 6.45);
    });
  }
  // A9 employers
  {
    const emps = D.employers_with_pay;
    const s = content("Appendix", "Appendix · A9", `The ${emps.length} employers in the pay sample (postings stating pay)`);
    const perCol = Math.ceil(emps.length / 4), colW = CW / 4;
    for (let c = 0; c < 4; c++) {
      const slice = emps.slice(c * perCol, (c + 1) * perCol);
      T(s, slice.map((e, i) => ({ text: `${e.employer} (${e.n})`, options: { breakLine: i < slice.length - 1 } })),
        { x: M + c * colW, y: 1.65, w: colW - 0.15, h: 4.75, fontSize: 10, color: INK, valign: "top" });
    }
    caption(s, `Ordered by postings. ${BIG} is the largest at ${pct1(BIG_SHARE)}; a robustness check drops it.`, 6.45);
  }
  // A10 references
  {
    const s = content("Appendix", "Appendix · A10", "References");
    const refs = [
      ["Arnold, D., Quach, S., & Taska, B. (2025).", " The impact of pay transparency in job postings on the labor market. NBER Working Paper 34480."],
      ["Cameron, A. C., Gelbach, J. B., & Miller, D. L. (2008).", " Bootstrap-based improvements for inference with clustered errors. Review of Economics and Statistics, 90(3), 414–427."],
      ["Cullen, Z. (2024).", " Is pay transparency good? Journal of Economic Perspectives, 38(1), 153–180."],
      ["Cullen, Z. B., & Pakzad-Hurson, B. (2023).", " Equilibrium effects of pay transparency. Econometrica, 91(3), 765–802."],
      ["U.S. Bureau of Economic Analysis.", " Regional price parities by state (used to price-adjust pay)."],
    ];
    T(s, refs.map(([a, b], i) => [{ text: a, options: { bold: true } }, { text: b, options: { breakLine: i < refs.length - 1 } }]).flat(),
      { x: M, y: 1.75, w: CW, h: 3.6, fontSize: 14, paraSpaceAfter: 12 });
    caption(s, "Data, code and every generated deliverable: the study repository (pre-registration, codebook, audit log and limitations in docs/).", 6.45);
  }
  return p;
}

// Write the theme's colour slots so the deck edits in IU colours, not Office's.
async function applyTheme(file) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const name = "ppt/theme/theme1.xml";
  const slots = { dk1: INK, lt1: WHITE, dk2: CRIMSON_DK, lt2: CREAM, accent1: CRIMSON, accent2: MUTED,
    accent3: GRAY, accent4: "B33A3A", accent5: "D98C8C", accent6: INK, hlink: CRIMSON, folHlink: CRIMSON_DK };
  let xml = await zip.file(name).async("string");
  const body = Object.entries(slots).map(([k, v]) => `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`).join("");
  xml = xml.replace(/<a:clrScheme name="[^"]*">[\s\S]*?<\/a:clrScheme>/, `<a:clrScheme name="Indiana University">${body}</a:clrScheme>`);
  zip.file(name, xml);
  // pptxgenjs numbers its title placeholders from 100. A title placeholder
  // conventionally carries no index (0), and tools that look for the slide
  // title by index find none, so drop it in layouts and slides alike; the two
  // still match on type="title".
  for (const f of Object.keys(zip.files).filter((n) => /^ppt\/(slides\/slide|slideLayouts\/slideLayout)\d+\.xml$/.test(n))) {
    const x = await zip.file(f).async("string");
    const y = x.replace(/<p:ph\s+idx="\d+"\s+type="title"/g, '<p:ph type="title"');
    if (y !== x) zip.file(f, y);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  const outs = [[false, path.join(ROOT, "paper", "presentation.pptx")],
    [true, path.join(ROOT, "paper", "presentation_with_notes.pptx")]];
  for (const [withNotes, out] of outs) {
    await build(withNotes).writeFile({ fileName: out });
    await applyTheme(out);
    console.log("wrote " + out);
  }
})();
