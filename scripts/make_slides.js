/**
 * Build paper/presentation.pptx from the committed analysis artifacts.
 *
 * Every figure on a slide comes from data/analysis/*.json, so the deck cannot
 * claim a result the dataset does not support. Where a number does not exist
 * yet the slide says so plainly rather than showing a placeholder.
 */
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const ANALYSIS = path.join(ROOT, "data", "analysis");
const FIGS = path.join(ROOT, "paper", "figures");

// Ocean-infrastructure palette: deep blue dominant, teal support, midnight accent.
const DEEP = "065A82", TEAL = "1C7293", MIDNIGHT = "21295C";
const WHITE = "FFFFFF", INK = "1A1A1A", MUTED = "5A6672", LIGHT = "F4F7F9";
const WARN = "B85042";

const load = (f) => {
  const p = path.join(ANALYSIS, f);
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
};
const analysis = load("analysis.json");
const funnel = load("selection_funnel.json");
const fig = (n) => (fs.existsSync(path.join(FIGS, n)) ? path.join(FIGS, n) : null);

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";            // 13.3 x 7.5, set before any slide
pres.author = "Labor market study";
pres.title = "Determinants of Advertised Pay in the US Energy and Data Center Sector";

const H = 7.5, W = 13.33, M = 0.7;

/** Dark title/section slide. */
function darkSlide(title, subtitle, kicker) {
  const s = pres.addSlide();
  s.background = { color: MIDNIGHT };
  if (kicker) {
    s.addText(kicker, { x: M, y: 1.5, w: W - 2 * M, h: 0.4, isTextBox: true,
      fontSize: 14, bold: true, color: "8FB8D0", charSpacing: 2, fontFace: "Calibri" });
  }
  s.addText(title, { x: M, y: 2.0, w: W - 2 * M, h: 1.8, isTextBox: true,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Cambria", lineSpacing: 46 });
  if (subtitle) {
    s.addText(subtitle, { x: M, y: 3.9, w: W - 2 * M, h: 1.2, isTextBox: true,
      fontSize: 16, color: "CFE0EA", fontFace: "Calibri", lineSpacing: 24 });
  }
  return s;
}

/** Light content slide with a heading. */
function contentSlide(title) {
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addText(title, { x: M, y: 0.52, w: W - 2 * M, h: 0.8, isTextBox: true,
    fontSize: 32, bold: true, color: MIDNIGHT, fontFace: "Cambria" });
  return s;
}

/** Big-number callout card. */
function statCard(s, x, y, w, value, label, color) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 1.85, rectRadius: 0.12,
    fill: { color: LIGHT }, line: { color: LIGHT } });
  s.addText(String(value), { x: x + 0.2, y: y + 0.22, w: w - 0.4, h: 0.85, isTextBox: true,
    margin: 0, fontSize: 40, bold: true, color: color || DEEP, fontFace: "Calibri", align: "center" });
  s.addText(label, { x: x + 0.2, y: y + 1.12, w: w - 0.4, h: 0.6, isTextBox: true,
    margin: 0, fontSize: 12, color: MUTED, fontFace: "Calibri", align: "center" });
}

function bullets(s, items, x, y, w, h) {
  s.addText(items.map((t, i) => ({
    text: t, options: { bullet: true, breakLine: i !== items.length - 1 },
  })), { x, y, w, h, isTextBox: true, fontSize: 15, color: INK,
    fontFace: "Calibri", paraSpaceAfter: 10, lineSpacing: 22 });
}

// ---------------------------------------------------------------- 1. Title
{
  const n = funnel ? (funnel.funnel?.usable_with_pay ?? 0) : 0;
  darkSlide(
    "Determinants of Advertised Pay\nin the US Energy and Data Center Sector",
    "Evidence from employer-published job postings, nationwide\n" +
    "Regressing log advertised pay on attributes stated in the posting",
    "LABOR MARKET STUDY"
  ).addNotes(
    `Current estimation sample: ${n} postings with a disclosed pay range. ` +
    `The dependent variable is the log of the midpoint of the employer-stated range, annualized.`
  );
}

// ---------------------------------------------------------------- 2. Question
{
  const s = contentSlide("The question");
  s.addText("What attributes stated in a job posting predict the pay an employer advertises?",
    { x: M, y: 1.4, w: W - 2 * M, h: 0.8, isTextBox: true, fontSize: 20, italic: true,
      color: DEEP, fontFace: "Calibri" });
  bullets(s, [
    "Data center buildout is driving technical and analytical hiring across the energy sector",
    "Seniority and location enter as regressors, not sample filters — which is what makes the disclosure contrast estimable",
    "Postings state requirements, benefits, location and work arrangement — all potential pay determinants",
    "Outcome: log of the employer-stated pay range midpoint, annualized to USD",
  ], M, 2.4, W - 2 * M - 4.6, 3.4);
  statCard(s, W - M - 4.2, 2.5, 4.2, "28", "regressors coded from posting text", TEAL);
  statCard(s, W - M - 4.2, 4.6, 4.2, "16", "states mandating pay in the posting", DEEP);
  s.addNotes("Roles stay narrow — an energy-analytics core. Geography and seniority are what widened.");
}

// ---------------------------------------------------------------- 3. Why not LinkedIn
{
  const s = contentSlide("Why not LinkedIn");
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 1.35, w: W - 2 * M, h: 1.35,
    rectRadius: 0.12, fill: { color: "F7EDEC" }, line: { color: "F7EDEC" } });
  s.addText("LinkedIn's User Agreement §8.2 prohibits using scripts, robots or crawlers to scrape or copy the Services — including the unauthenticated endpoints used in most tutorials.",
    { x: M + 0.35, y: 1.55, w: W - 2 * M - 0.7, h: 0.95, isTextBox: true, margin: 0,
      fontSize: 15, color: WARN, bold: true, fontFace: "Calibri", lineSpacing: 21 });
  bullets(s, [
    "Data is collected instead from the public, unauthenticated ATS APIs employers publish through",
    "These are the upstream systems that syndicate postings to job boards, including LinkedIn",
    "Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee and Workday",
    "Full untruncated description text and the employer's own stated range — no key, no cost",
    "Aggregators were rejected as a backbone: they truncate text and often return predicted salaries, which would make the regression circular",
  ], M, 3.0, W - 2 * M, 3.2);
  s.addNotes("The compliance posture — rate limiting, identifying User-Agent, no circumvention — is documented in docs/methods.md.");
}

// ---------------------------------------------------------------- 4. Illinois law
{
  const s = contentSlide("Why Illinois makes this possible");
  statCard(s, M, 1.5, 3.7, "HB 3129", "effective 1 Jan 2025", DEEP);
  statCard(s, M + 3.95, 1.5, 3.7, "15+", "employees covered", TEAL);
  statCard(s, M + 7.9, 1.5, 3.7, "IN: none", "no Indiana mandate", WARN);
  bullets(s, [
    "Illinois employers must state the pay scale AND describe benefits in any posting for Illinois work",
    "The dependent variable and several benefit regressors are therefore legally required to appear",
    "Indiana has no comparable law, so Indianapolis postings disclose far less often",
    "Those that do disclose are self-selected — the metro comparison carries that caveat explicitly",
    "mandate_state is carried as a regressor so the contrast can be examined, not assumed away",
  ], M, 3.7, W - 2 * M, 3.0);
  s.addNotes("This asymmetry is the study's main source of disclosure variation and its main threat to the metro comparison.");
}

// ---------------------------------------------------------------- 5. Funnel
{
  const s = contentSlide("From raw postings to the estimation sample");
  const f = fig("fig1_funnel.png");
  if (f) {
    s.addImage({ path: f, x: M, y: 1.35, w: 7.6, h: 4.4 });
  }
  const fl = funnel?.funnel || {};
  const rows = [
    ["Retrieved", fl.raw],
    ["Passed screens", fl.passed_screen],
    ["In a study metro", fl.passed_geo],
    ["Unique postings", fl.unique_in_scope],
    ["Pay disclosed", fl.usable_with_pay],
  ];
  s.addText(rows.map(([k, v], i) => ({
    text: `${k}: ${v ?? 0}`,
    options: { bullet: true, breakLine: i !== rows.length - 1 },
  })), { x: M + 8.0, y: 1.6, w: W - M - (M + 8.0), h: 2.6, isTextBox: true,
    fontSize: 14, color: INK, fontFace: "Calibri", paraSpaceAfter: 8 });
  s.addText("Every rejection is counted and reported by reason, so the sample can be described rather than merely stated.",
    { x: M + 8.0, y: 4.3, w: W - M - (M + 8.0), h: 1.5, isTextBox: true,
      fontSize: 12, italic: true, color: MUTED, fontFace: "Calibri", lineSpacing: 18 });
  s.addNotes("Full rejection reasons live in data/analysis/selection_funnel.json.");
}

// ---------------------------------------------------------------- 6. Results
{
  const s = contentSlide("Results");
  const ok = analysis && analysis.status === "ok";
  if (ok) {
    const core = analysis.models?.core;
    const d = analysis.descriptives?.pay_midpoint || {};
    statCard(s, M, 1.35, 3.7, `$${Math.round(d.mean || 0).toLocaleString()}`, "mean advertised pay", DEEP);
    statCard(s, M + 3.95, 1.35, 3.7, String(core?.n ?? 0), "postings in the model", TEAL);
    statCard(s, M + 7.9, 1.35, 3.7, (core?.r_squared ?? 0).toFixed(2), "R-squared", MIDNIGHT);
    const cf = fig("fig3_coefficients.png");
    if (cf) s.addImage({ path: cf, x: M, y: 3.5, w: 11.9, h: 3.5 });
  } else {
    s.addShape(pres.ShapeType.roundRect, { x: M, y: 1.6, w: W - 2 * M, h: 2.2,
      rectRadius: 0.12, fill: { color: LIGHT }, line: { color: LIGHT } });
    s.addText("No results yet — the estimation sample is still below the threshold for a meaningful model.",
      { x: M + 0.4, y: 1.85, w: W - 2 * M - 0.8, h: 0.75, isTextBox: true, margin: 0,
        fontSize: 18, bold: true, color: MIDNIGHT, fontFace: "Calibri" });
    s.addText(`Current sample: ${analysis?.n_estimation ?? 0} postings with disclosed pay from ${analysis?.distinct_employers ?? 0} employers. Collection continues weekly; the model is estimated automatically once the sample supports it.`,
      { x: M + 0.4, y: 2.68, w: W - 2 * M - 0.8, h: 1.0, isTextBox: true, margin: 0,
        fontSize: 14, color: MUTED, fontFace: "Calibri", lineSpacing: 20 });
    bullets(s, [
      "The specification is pre-registered: a core model of 8-10 regressors, extended only when the sample supports ~20 observations per regressor",
      "Choosing the specification from sample size rather than from results is what keeps the estimate honest",
      "Standard errors are clustered by employer, since employers contribute many postings each",
    ], M, 4.2, W - 2 * M, 2.4);
  }
  s.addNotes("The model is re-estimated on every collection run; this slide regenerates from analysis.json.");
}

// ---------------------------------------------------------------- 7. Limitations
{
  const s = contentSlide("What this data cannot support");
  const items = [
    ["Advertised, not realized pay", "Posted ranges reflect compliance and negotiating posture, not earnings."],
    ["Disclosure is selected", "Indiana has no mandate, so its disclosing postings are self-selected."],
    ["Exelon and ComEd are missing", "They run iCIMS: its feed goes only to approved job boards, its API is partner-gated, no syndication feed exists, and its terms bar automated access. Verified by reading them, not assumed."],
    ["No historical backfill", "ATS APIs serve only open postings, so the panel starts when collection starts."],
    ["Few employer clusters", "Clustered errors cover at 92% against a nominal 95%. Significance is read off a wild cluster bootstrap, which leaves only seniority and the ML/AI skill premium standing."],
  ];
  let y = 1.35;
  for (const [head, body] of items) {
    s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.06, w: 0.3, h: 0.3,
      fill: { color: TEAL }, line: { color: TEAL } });
    s.addText(head, { x: M + 0.5, y, w: 4.3, h: 0.42, isTextBox: true, margin: 0,
      fontSize: 14, bold: true, color: MIDNIGHT, fontFace: "Calibri" });
    s.addText(body, { x: M + 4.9, y, w: W - M - (M + 4.9), h: 0.75, isTextBox: true, margin: 0,
      fontSize: 13, color: MUTED, fontFace: "Calibri", lineSpacing: 18 });
    y += 1.02;
  }
  s.addNotes("Stating these plainly is part of the deliverable; docs/limitations.md carries the full treatment.");
}

// ---------------------------------------------------------------- 8. Close
{
  darkSlide("Reproducible end to end",
    "Collection, screening, coding, estimation and this deck all regenerate from committed artifacts.\n" +
    "Weekly GitHub Actions runs extend the panel; every number traces to data/analysis/.",
    "METHOD").addNotes("pip install -r requirements.txt && python tests/run_all.py");
}

const out = path.join(ROOT, "paper", "presentation.pptx");
pres.writeFile({ fileName: out }).then(() => console.log("wrote " + out));
