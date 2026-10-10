// Host settings snippet: a self-contained, self-injecting DOM panel.
// Controls: intensity (Lightweight 0.6 / Standard 1.0 / Hardcore 1.25), limit
// line (0.05 / 0.08), comfort visuals, phone "swim", plus per-player drinks
// [-]/[+], water mode, body weight and sex, and a "New night" button.
// Also shows the "Round!" banner after each race and the race-3 toast.
//
// It talks to the engine ONLY through `game.impairment` (see install.js), never
// edits engine HTML, and does nothing if there is no `document` (Node tests).

const STORE_KEY = 'tipsy.impairment.settings.v1';
const INTENSITIES = [['Lightweight', 0.6], ['Standard', 1.0], ['Hardcore', 1.25]];
const LIMITS = [['0.05 %', 0.05], ['0.08 %', 0.08]];

/** Saved host preferences (a per-device convenience; failures are ignored). */
export function loadSavedSettings(storage) {
  try {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!st) return null;
    const raw = st.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function saveSettings(settings, storage) {
  try {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (st) st.setItem(STORE_KEY, JSON.stringify(settings));
  } catch (e) { /* private mode etc. */ }
}

function h(doc, tag, props, ...kids) {
  const el = doc.createElement(tag);
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (k === 'style') Object.assign(el.style, v);
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'className') el.className = v;
      else el[k] = v;
    }
  }
  for (const kid of kids) if (kid) el.appendChild(kid);
  return el;
}

function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

const CSS = {
  btn: {
    position: 'fixed', left: '10px', bottom: '10px', zIndex: '9998', padding: '6px 10px',
    font: '600 12px system-ui, sans-serif', color: '#1b1033', background: '#ffc93c',
    border: '0', borderRadius: '14px', cursor: 'pointer', opacity: '0.85',
  },
  panel: {
    position: 'fixed', left: '10px', bottom: '48px', zIndex: '9998', width: '340px',
    maxHeight: '70vh', overflowY: 'auto', boxSizing: 'border-box', padding: '10px 12px',
    font: '12px/1.4 system-ui, sans-serif', color: '#fff', background: 'rgba(27,16,51,0.94)',
    border: '1px solid #ffc93c', borderRadius: '10px', display: 'none',
  },
  row: { display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0', flexWrap: 'wrap' },
  small: { padding: '2px 8px', cursor: 'pointer' },
  toasts: {
    position: 'fixed', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: '9999',
    pointerEvents: 'none', textAlign: 'center', font: '700 13px/1.3 system-ui, sans-serif',
    color: '#fff', textShadow: '0 1px 3px #000', maxWidth: '90vw',
  },
  toastLine: { margin: '2px 0', padding: '2px 10px', background: 'rgba(27,16,51,0.78)', borderRadius: '8px' },
};

export function mountHostSettings(game, opts = {}) {
  const doc = opts.document || (typeof document !== 'undefined' ? document : null);
  if (!doc || !game || !game.impairment) return null;
  const imp = game.impairment;
  const root = opts.parent || doc.body;
  if (!root) return null;
  const settings = () => game.session.settings;
  const players = () => (game.session.players || []).filter((p) => p && p.slot >= 0 && p.slot <= 3);

  const btn = h(doc, 'button', { text: 'Tipsy', title: 'Impairment settings', style: CSS.btn });
  const panel = h(doc, 'div', { style: CSS.panel });
  const toasts = h(doc, 'div', { style: CSS.toasts });
  let open = false;

  function setOpen(v) {
    open = !!v;
    panel.style.display = open ? 'block' : 'none';
    if (open) render();
  }
  btn.addEventListener('click', () => setOpen(!open));

  function persist() { saveSettings(settings(), opts.storage); }

  function choice(label, list, current, onPick) {
    const row = h(doc, 'div', { style: CSS.row }, h(doc, 'span', { text: label, style: { width: '70px' } }));
    for (const [name, val] of list) {
      const active = Math.abs(val - current) < 1e-9;
      row.appendChild(h(doc, 'button', {
        text: name, style: Object.assign({}, CSS.small, active ? { background: '#ffc93c', color: '#1b1033' } : {}),
        onclick: () => { onPick(val); persist(); render(); },
      }));
    }
    return row;
  }

  function playerRow(p) {
    const st = imp.getImpairmentStatus(p.slot);
    const row = h(doc, 'div', { style: Object.assign({}, CSS.row, { borderTop: '1px solid #4a3a73', paddingTop: '4px' }) });
    row.appendChild(h(doc, 'span', {
      text: `${p.name || 'P' + (p.slot + 1)}`, style: { width: '64px', fontWeight: '700', color: p.color || '#fff' },
    }));
    row.appendChild(h(doc, 'button', { text: '-', style: CSS.small, onclick: () => { imp.adjustDrinks(p.slot, -1); render(); } }));
    row.appendChild(h(doc, 'span', { text: String(st.drinks), style: { minWidth: '18px', textAlign: 'center', opacity: st.water ? '0.45' : '1' } }));
    row.appendChild(h(doc, 'button', { text: '+', style: CSS.small, onclick: () => { imp.adjustDrinks(p.slot, 1); render(); } }));
    const wl = h(doc, 'label', { style: { cursor: 'pointer' } });
    wl.appendChild(h(doc, 'input', { type: 'checkbox', checked: !!st.water, onchange: (e) => { imp.setWaterMode(p.slot, e.target.checked); render(); } }));
    wl.appendChild(h(doc, 'span', { text: ' water' }));
    row.appendChild(wl);
    row.appendChild(h(doc, 'span', { text: `${st.bac.toFixed(3)}% ${st.tierLabel}`, style: { opacity: '0.8', width: '130px' } }));
    const kg = h(doc, 'input', {
      type: 'number', min: '40', max: '200', placeholder: 'kg', value: p.bodyKg == null ? '' : String(p.bodyKg),
      style: { width: '52px' }, onchange: (e) => { imp.setBody(p.slot, { bodyKg: e.target.value }); render(); },
    });
    row.appendChild(kg);
    const sx = h(doc, 'select', { onchange: (e) => { imp.setBody(p.slot, { sex: e.target.value || null }); render(); } },
      h(doc, 'option', { value: '', text: 'sex?' }), h(doc, 'option', { value: 'f', text: 'f' }), h(doc, 'option', { value: 'm', text: 'm' }));
    sx.value = p.sex || '';
    row.appendChild(sx);
    return row;
  }

  function render() {
    clear(panel);
    panel.appendChild(h(doc, 'div', { text: 'Impairment', style: { fontWeight: '700', color: '#ffc93c', marginBottom: '4px' } }));
    panel.appendChild(choice('Intensity', INTENSITIES, settings().intensity, (v) => imp.setSettings({ intensity: v })));
    panel.appendChild(choice('Limit line', LIMITS, settings().limitLine, (v) => imp.setSettings({ limitLine: v })));
    const cv = h(doc, 'label', { style: CSS.row });
    cv.appendChild(h(doc, 'input', { type: 'checkbox', checked: !!settings().comfortVisuals, onchange: (e) => { imp.setSettings({ comfortVisuals: e.target.checked }); persist(); } }));
    cv.title = 'Halves camera sway, FOV wobble and camera lag. Controls stay impaired.';
    cv.appendChild(h(doc, 'span', { text: ' Comfort visuals' }));
    panel.appendChild(cv);
    const sw = h(doc, 'label', { style: CSS.row });
    sw.appendChild(h(doc, 'input', { type: 'checkbox', checked: settings().phoneSwim !== false, onchange: (e) => { imp.setSettings({ phoneSwim: e.target.checked }); persist(); } }));
    sw.appendChild(h(doc, 'span', { text: ' Phone buttons swim' }));
    panel.appendChild(sw);
    for (const p of players()) panel.appendChild(playerRow(p));
    panel.appendChild(h(doc, 'div', { style: CSS.row },
      h(doc, 'button', {
        text: 'New night (reset drinks)', style: CSS.small,
        onclick: () => { imp.newNight(); render(); },
      })));
    panel.appendChild(h(doc, 'div', { text: imp.DISCLAIMER, style: { opacity: '0.6', fontSize: '10px', marginTop: '4px' } }));
  }

  function showText(text, ms) {
    const line = h(doc, 'div', { text, style: CSS.toastLine });
    toasts.appendChild(line);
    const timer = (opts.setTimeout || (typeof setTimeout !== 'undefined' ? setTimeout : null));
    if (timer) timer(() => { if (line.parentNode) line.parentNode.removeChild(line); }, ms);
  }

  const offs = [];
  offs.push(imp.on('toast', (t) => showText(t.text, 5000)));
  offs.push(imp.on('round', (r) => {
    if (!r.lines.length) return;
    showText('Round!', 6000);
    for (const l of r.lines) showText(l.text, 6000);
  }));
  const refresh = () => { if (open) render(); };
  offs.push(imp.on('drinksChanged', refresh));
  offs.push(imp.on('settingsChanged', refresh));

  // Keep the button out of the split-screen HUD while a race is running.
  const syncVisibility = () => {
    const racing = game.phase === 'countdown' || game.phase === 'racing';
    btn.style.display = racing ? 'none' : '';
    if (racing && open) setOpen(false);
  };
  if (typeof game.on === 'function') {
    for (const evt of ['stateChanged', 'raceStart', 'raceFinished', 'cupFinished']) {
      const off = game.on(evt, () => syncVisibility());
      if (typeof off === 'function') offs.push(off);
    }
  }
  syncVisibility();

  root.appendChild(btn);
  root.appendChild(panel);
  root.appendChild(toasts);

  return {
    btn, panel, toasts, render, setOpen,
    destroy() {
      offs.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
      for (const el of [btn, panel, toasts]) if (el.parentNode) el.parentNode.removeChild(el);
    },
  };
}
