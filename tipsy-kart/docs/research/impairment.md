# Tipsy Kart: Impairment Model Spec (research lane)

Status: implementation-ready spec for the coding agent. No game code lives here.
Owner lane: `research-impairment`. Applies to HUMAN slots 0-3 only. CPUs are never touched.

---

## 0. TL;DR for the implementer

1. Each human has an integer `drinks` that goes up by 1 on every `raceFinished`. Race 1 = 0 drinks (sober), race 2 = 1, race 3 = 2, and so on.
2. The drink count, optionally scaled by body weight/sex, becomes a continuous **impairment level `L` in [0, 5]**. `L = 0` means the filter returns its input unchanged.
3. Every parameter (latency, wander, overshoot, deadzone, missed presses, blur, double vision...) is a **piecewise-linear lookup on `L`** with knots at 0, 1, 2, 3, 4 and 5 (table in section 3). `L` is clamped at 5, so from race 6 onward (5+ drinks) difficulty plateaus: very hard, but finishable.
4. Between 1 and 2 drinks there is a deliberate **cliff**: added latency jumps from 30 to 130 ms, steering becomes underdamped (zeta 0.5) and wander roughly triples. Section 4 shows why that pushes a human steering loop from "fine" to "marginally stable". That is the "physically difficult from race 3" requirement.
5. The randomness is seeded per session, slot and race, so every player wobbles differently and every run can be replayed exactly.
6. The display BAC uses a simplified Widmark formula. A default adult reads 0.030 % per drink, so 2 drinks gives about 0.060 % (over the 0.05 limit) and 3 drinks gives about 0.090 % (over the US 0.08 limit).

Suggested module layout (the integration lane may move these): `tipsy-kart/src/impairment/{bac.js, params.js, rng.js, filter.js, visual.js, drinks.js}` and `tipsy-kart/tests/impairment.test.js`. Use pure ES modules with no dependencies, so every piece runs under `node --test` without a browser.

---

## 1. Research basis (what the literature says, and how we use it)

### 1.1 BAC effects by level

The NHTSA "ABCs of BAC" table (DOT HS 809 844) lists the BAC at which each effect is *first observed*:

| BAC (g/dL) | Predictable effects on driving (NHTSA) | Our game mapping |
|---|---|---|
| 0.02 | Decline in visual functions (rapid tracking of a moving target); decline in divided attention | 1 drink: faint blur, tiny sway, 30 ms latency |
| 0.05 | Reduced coordination; reduced ability to track moving objects; **difficulty steering**; reduced response to emergencies | 2 drinks: the cliff. Steering overshoot, wander, 130 ms latency, double vision begins |
| 0.08 | Concentration and short-term memory loss; **speed control**; reduced information processing (signal detection, visual search); impaired perception | 3 drinks: throttle wobble, pedal lag, more missed button presses, tunnel vision |
| 0.10 | Reduced ability to **maintain lane position and brake appropriately** | 4 drinks: big wander, inverted-steer moments start |
| 0.15 | **Substantial impairment in vehicle control**, attention, visual/auditory processing | 5+ drinks: the cap |

- Moskowitz & Fiorentino (NHTSA DOT HS 809 028, 2000) reviewed 112 studies. They found that some skills are impaired at any significant departure from zero BAC, most studies found significant impairment by 0.05, and more than 94 % found it by 0.08. This supports a monotone curve that starts at drink 1.
- Crash risk grows faster than linearly: adjusted crash risk is about 2.07x at a BrAC of 0.05 and about 3.93x at 0.08 (Lacey et al., NHTSA DOT HS 812 355, 2016). This justifies the 1-to-2-drink cliff and front-loaded escalation.

### 1.2 Lane keeping (SDLP), steering, speed

- **SDLP** (standard deviation of lateral position, or "weaving") is the most alcohol-sensitive driving measure. In both a simulator and on a test track it shows the largest effect size, with a clear dose-response (SINTEF simulator vs test-track study, BAC about 0.05 and 0.09).
- A pooled analysis of 9 on-road studies found **SDLP rose by about 2.5 cm (95 % CI 2.0 to 2.9) at a BAC near 0.05**. Increases above 2.4 cm are treated as clinically relevant (Jongen et al., Maastricht pooled analysis).
- One citation, attributed to Irwin et al. 2017, says SDLP degrades from about 0.021 % BAC and then rises by about 0.7 cm per +0.01 %.
- A 2022 placebo-controlled simulator study found a mean BAC of 0.07 % raised SDLP by **4.06 cm** and the SD of speed by **0.69 km/h**. A mean of 0.04 % was not significant (Psychopharmacology, doi:10.1007/s00213-022-06260-z).
- A Japanese simulator study predicted that SDLP rises 9.23 cm from 0 to 0.05 %, dose-dependently (Psychopharmacology 2020, doi:10.1007/s00213-020-05730-6). The size of the effect therefore depends heavily on the method.
- In a NADS study with 108 drinkers, normalized lane deviation was 46.8 at 0.00, 49.8 at 0.05 and 54.3 at 0.10 (ClinicalTrials NCT00477984).
- Steering-wheel reversal rate rose with ethanol in a simulator (SINTEF), but evidence for it is weaker than for SDLP. Van Dyke & Fillmore (2015) report more SDLP, a higher steering rate and more lane exceedances at a BrAC of 0.08 or above.
- **Design consequence:** the primary steering impairment is a *low-frequency lateral wander* that the player must actively cancel (SDLP), not jitter. Secondary effects are overcorrection (steering rate and reversals) and speed variability.

### 1.3 Reaction time and latency

- In a VR avoidance task, a typical sober recognition-and-response takes about 320 ms. At 0.05 % it took **+50 to 70 ms** longer (Commissaris, Wayne State, reported via press). In a four-choice reaction-time test, impairment appeared at 0.07 % but not at 0.04 %.
- Game-latency studies find that tracking error starts to rise from **about 110 ms** of added latency, while target acquisition degrades above about 50 ms (Pavlovych & Gutwin, Graphics Interface). Variations of about 50 ms are hard to notice (Regensburg, CHI Play).
- **Design consequence:** 30 ms at 1 drink sits below the noticeable threshold, which counts as "buzzed". 130 ms at 2 drinks is above the roughly 110 ms tracking-degradation threshold, which counts as "over the limit". That is about 2x the real 0.05 % effect, a deliberate exaggeration so it is felt in a game.

### 1.4 Vision

- **Pursuit/tracking:** smooth-pursuit gain is impaired from about 0.015 % BAC. Pursuit is up to about 10 ms later and up to about 25 % weaker, partly made up for by catch-up saccades. Saccade peak velocity drops from about 0.035 % (Tyson et al. 2021, J Physiol 599:1225; NASA NTRS preprints). In the game this becomes a **delayed or "swimming" chase camera** (`camLagS`) plus a slow sway, so the image lags behind where the player expects it.
- **Double vision:** vergence and fusional reserves fall at 0.05 % and fall further at 0.10 %, and distance heterophoria shifts toward esophoria by about 2.2 prism dioptres at 0.10 % (Munsamy et al. 2016, African Vision & Eye Health). We use a **horizontal offset ghost** that grows with level and starts at 2 drinks.
- **Tunnel vision:** reports of peripheral field loss are consistent but small, and appear around 0.08 %. The mechanism is mainly *attentional*: periphery is missed when the centre is busy (Moskowitz & Sharma 1974, via SWOV; a 1985 Klin Monbl Augenheilkd study found concentric restriction above 1 per mille). In the game this becomes a **vignette** that grows from 2 drinks and is capped so the centre always stays clear.
- **Blur:** blur is a near-universal game shorthand. It is not a strong clinical finding at low BAC, so it is kept mild and pulsing.

### 1.5 How games do it

- **Sea of Thieves** (grog): progressive drunkenness, slight blur, the character sways left and right without input, and equipment handling (the ship's wheel and so on) becomes "involuntary". Vomiting increases blur (community wiki).
- **GTA IV:** drunk motion is simulated procedurally, not canned, so each instance differs. The camera "moves irregularly" while driving (Rockstar via TechCrunch 2008; GTA wiki).
- **Shader mods and Unreal forums:** the common split is (a) a post-process layer (double vision, motion trails, blinking) scaled by intoxication and (b) a separate camera drift or sway transform.
- **Takeaways:** the effect must be **progressive**, **procedural and seeded**, and come from **two layers**, input and vision. Most of the *difficulty* should sit in the input layer so a comfort toggle can tone the visuals down without making the game easy.

### 1.6 Motion-sickness and accessibility

Commercial games commonly offer camera-shake sliders, reduced camera sway and motion-blur toggles (Cult of the Lamb, Overwatch, WoW). We ship a host **"Comfort visuals"** toggle (section 3.4) that halves sway, FOV wobble and camera lag. It does not touch the control impairment.

### 1.7 Phone haptics

The `navigator.vibrate` API works on Android Chrome but is **not supported on iOS Safari**. Feature-detect it and fall back to a CSS shake of the controller UI (section 6.2).

---

## 2. Drinks to estimated BAC

### 2.1 Data model (additions to `window.game.session.players[i]`)

```js
{
  slot, name, color, connected, racesCompleted,   // existing contract
  drinks: 0,            // integer >= 0. THE value the engine passes as ctx.drinks
  water: false,         // "Water / designated sober" opt-out (2.5)
  bodyKg: null,         // optional, 40..200; null = default 75
  sex: null,            // optional 'm' | 'f' | null(unspecified)
  drinkLog: [],         // ms timestamps (Date.now()) of each counted drink, for BAC elimination
  impairIntensity: 1.0  // read from host settings (3.4); same for everyone unless host changes
}
// session-level additions
window.game.session.seed      // uint32, chosen once when the session (night) is created
window.game.session.settings  // { intensity: 1.0, comfortVisuals: false, limitLine: 0.05 }
```

### 2.2 Simplified Widmark estimate (display only)

```
A_g      = 14 * drinks                      // US standard drink = 14 g ethanol (NIAAA)
r        = sex==='m' ? 0.68 : sex==='f' ? 0.55 : 0.62   // Widmark factors; 0.62 = unspecified midpoint
W_g      = (bodyKg ?? 75) * 1000
hours    = drinks>0 ? (now - drinkLog[0]) / 3.6e6 : 0
beta     = 0.015                            // %BAC per hour, common population average
estBAC   = max(0, (A_g / (r * W_g)) * 100 - beta * hours)   // in g/dL (%), e.g. 0.060
```

- **Instant absorption** is the classic Widmark simplification (the formula assumes all alcohol is absorbed). We use it on purpose so the meter reacts the moment a drink is counted. Real absorption takes 30 min to 2 h. Label the number "est. BAC" and treat it as an upper-bound party estimate. Individual r and beta vary by 10 to 20 % or more.
- With the defaults (75 kg, r 0.62), each drink adds **0.0301 %**. Two drinks read **0.060** (over the 0.05 line) and three read **0.090** (over the US 0.08 line). Elimination over a typical 12-minute stretch removes only about 0.003, so race 3 still reads over 0.05.
- Reference values for tests: 75 kg male is 0.02745 per drink; 60 kg female is 0.04242 per drink; default 2 drinks is 0.06022, falling to 0.04522 after 1 h.
- `settings.limitLine` defaults to **0.05** (most of Europe, Australia, Utah). The host can set 0.08. This only moves the HUD tick; gameplay is unaffected.

### 2.3 Gameplay impairment level `L`

Gameplay is driven by drinks, not by the noisy BAC estimate, so it stays deterministic and testable.

```
REF = 0.62 * 75                                   // = 46.5 (r*W of the default adult)
bodyScale = clamp(REF / (r * (bodyKg ?? 75)), 0.80, 1.25)   // 1.0 when nothing is set
I = drinks * bodyScale
if (drinks >= 2) I = max(I, 2.0)                  // RACE-3 FLOOR: everyone is "over the limit" by race 3
L_target = water ? 0 : clamp(I * settings.intensity, 0, 5)
```

- The floor guarantees the requirement for heavy players as well (a 120 kg male gets bodyScale 0.80, so 2 drinks would otherwise be only 1.6). `I(drinks)` stays monotone non-decreasing.
- `intensity` is a host option: **Lightweight 0.6 / Standard 1.0 (default) / Hardcore 1.25**. The race-3 guarantee is stated for Standard.
- **Smoothing:** the filter keeps `Ls` and moves it toward `L_target` with time constant 2 s: `Ls += (L_target - Ls) * (1 - exp(-dt/2))`. At the first frame of a race (when `ctx.raceIndex` changes) it snaps `Ls = L_target`. This makes a mid-race manual +1 ease in instead of popping.
- Elimination does **not** reduce `L` automatically (the party framing is one drink per race). The host or the player can press -1 to "sober up".

### 2.4 Incrementing on `raceFinished`

```js
game.on('raceFinished', (ev) => {               // ev = {raceIndex, results?:[{slot,isCpu,dnf,...}]}
  const s = game.session;
  if (s._drinksAwardedFor === ev.raceIndex) return;   // idempotent: one award per race
  s._drinksAwardedFor = ev.raceIndex;
  const humansInRace = ev.results
    ? ev.results.filter(r => !r.isCpu && r.slot >= 0 && r.slot <= 3).map(r => r.slot)
    : s.players.filter(p => p.connected).map(p => p.slot);
  for (const p of s.players) {
    if (!humansInRace.includes(p.slot)) continue;      // didn't race: no drink
    p.racesCompleted += 1;                              // (if engine doesn't already)
    if (p.water) { p.waters = (p.waters||0) + 1; continue; }
    p.drinks += 1;
    p.drinkLog.push(Date.now());
  }
  game.emit?.('drinksChanged', s.players.map(p => ({slot:p.slot, drinks:p.drinks})));
});
// cupFinished: do NOT reset drinks. Only an explicit host "New night" resets drinks, drinkLog and seed.
```

- DNF players still raced, so they still get the drink. Players who join mid-cup start at 0.
- On the results screen show a "Round!" banner: `P1 +1 -> 2 drinks · est 0.060% · OVER THE LIMIT`, or `+1 water` for water players.

### 2.5 Manual adjust and water opt-out

- **Host lobby/pause screen:** per-player `[-] 2 [+]` buttons and a Water toggle. **Phone:** the same controls behind a **0.8 s press-and-hold** so a stray tap doesn't change them. Allowed at any time; mid-race changes ease in via `Ls` smoothing.
- `+1` pushes `Date.now()` to `drinkLog`; `-1` pops the latest entry. Clamp `drinks` to 0..15.
- **Water mode** (`water: true`): no increments, and `L_target = 0` while the flag is on, so the filter is identity and the visuals are zero. The current `drinks` value is kept (greyed out) and resumes counting if water is switched off. A water glass icon replaces the beer mug on the HUD.

---

## 3. Impairment parameter table

### 3.1 Lookup rule

`paramsAt(L)`: for each parameter, linearly interpolate between the knots at `L = 0, 1, 2, 3, 4, 5`. Clamp `L` to [0, 5] first, so 5+ drinks equals the L=5 column (the **cap**). All values at L=0 are the identity/neutral value.

### 3.2 Control (input) parameters

| Key | Meaning | L=0 | 1 | **2 (race 3)** | 3 | 4 | 5+ (cap) |
|---|---|---|---|---|---|---|---|
| `delayMs` | Added latency on ALL channels (ring buffer) | 0 | 30 | **130** | 180 | 230 | 280 |
| `deadzone` | Steer deadzone (then rescaled) | 0 | 0.03 | **0.10** | 0.14 | 0.18 | 0.22 |
| `steerGain` | Steer gain (twitchiness) | 1.00 | 1.03 | **1.12** | 1.18 | 1.24 | 1.30 |
| `steerTn` (s) | 1/omega_n of the 2nd-order steer response (0 = bypass) | 0 | 0.033 | **0.091** | 0.111 | 0.133 | 0.154 |
| `steerZeta` | Damping ratio (lower means more overshoot/overcorrection) | 1.00 | 0.80 | **0.50** | 0.42 | 0.36 | 0.32 |
| `wanderFastSd` | OU wander, tau = 0.7 s, steer units | 0 | 0.03 | **0.10** | 0.14 | 0.18 | 0.22 |
| `wanderSlowSd` | OU wander, tau = 4.0 s ("lean") | 0 | 0.02 | **0.06** | 0.08 | 0.10 | 0.12 |
| `leanBias` | Per-player constant pull, times the seeded sign | 0 | 0.005 | **0.012** | 0.018 | 0.024 | 0.030 |
| `pedalTau` (s) | 1st-order lag on throttle and brake | 0 | 0.03 | **0.15** | 0.22 | 0.30 | 0.38 |
| `throttleWobbleSd` | OU (tau 1.2 s); throttle times (1 - abs(n)) | 0 | 0 | **0.06** | 0.09 | 0.12 | 0.15 |
| `missEdgeP` | P(a press of drift/useItem is ignored) | 0 | 0 | **0.08** | 0.12 | 0.16 | 0.20 |
| `itemExtraMs` | Extra delay on useItem after delayMs | 0 | 0 | **60** | 100 | 140 | 180 |
| `driftHoldMs` | Hold needed before drift engages ("sluggish trigger") | 0 | 0 | **90** | 140 | 190 | 240 |
| `hiccupPerMin` | Steer kick +/-0.35 for 120 ms plus camera jolt | 0 | 0 | **0.6** | 0.9 | 1.2 | 1.5 |
| `lapsePerMin` | "Micro-sleep": inputs frozen and screen blinks | 0 | 0 | 0 | 0.8 | 1.5 | 2.2 |
| `lapseDurS` | Mean lapse length (uniform +/-0.1 s) | 0 | 0 | 0 | 0.40 | 0.50 | 0.60 |
| `invertPerMin` | "Which way is left?" inverted steer | 0 | 0 | 0 | 0 | 0.5 | 0.9 |
| `invertDurS` | Mean inversion length (uniform +/-0.15 s, 150 ms cross-fade in and out) | 0 | 0 | 0 | 0 | 0.70 | 0.85 |

Derived checks: the combined steady-state steer noise is sqrt(fast^2 + slow^2), which gives **0.036 / 0.117 / 0.161 / 0.206 / 0.251** for L = 1 to 5. Lapses occupy at most 2.2 x 0.6 s, about 1.3 s per minute (2.2 % of race time). Inversions occupy at most about 1.3 % of race time.

### 3.3 Visual parameters (`visualFx[slot]`)

Contract fields plus **proposed extras** (marked +). The engine should ignore unknown fields. Pixel values are for a 1080 px-tall viewport; multiply by `viewportH/1080`.

| Key | Meaning | L=0 | 1 | **2** | 3 | 4 | 5+ (cap) |
|---|---|---|---|---|---|---|---|
| `blurPx` | Gaussian blur, pulsing x(0.8 + 0.2 sin(2 pi t/3.7)) | 0 | 0.4 | **1.2** | 1.8 | 2.4 | 3.0 |
| `doubleVision` | 0..1 ghost strength. Ghost alpha = 0.5 x dv | 0 | 0 | **0.30** | 0.45 | 0.60 | 0.75 |
| `swayDeg` | Camera roll amplitude (signed value per frame) | 0 | 0.6 | **1.8** | 2.6 | 3.4 | 4.2 |
| `tunnel` | Vignette 0..1 (max(tunnel, 0.92 x blink)) | 0 | 0.05 | **0.22** | 0.32 | 0.42 | 0.52 |
| `hueShift` | Hue-rotate amplitude in degrees, period 11 s | 0 | 0 | **8** | 12 | 16 | 20 |
| + `camLagS` | Chase-camera yaw follow delay ("swimming" camera) | 0 | 0.03 | **0.10** | 0.14 | 0.18 | 0.22 |
| + `fovWobbleDeg` | FOV breathing amplitude, period 6.3 s | 0 | 0 | **1.5** | 2.5 | 3.5 | 4.5 |
| + `saturate` | CSS saturate() | 1 | 1.02 | **1.12** | 1.18 | 1.24 | 1.30 |
| + `ghostDx`,`ghostDy` | Ghost offset px (computed, 3.5) | 0 | 0 | ... | ... | ... | ... |
| + `zoom` | Scale to hide rotated corners (computed) | 1 | ... | ... | ... | ... | <=1.13 |
| + `blink` | 0..1 lapse eyelid (computed from events) | 0 | 0 | 0 | ev | ev | ev |
| + `joltPx` | Vertical camera bump on hiccup (6 px x envelope) | 0 | 0 | ev | ev | ev | ev |

### 3.4 Host options and caps

- **Comfort visuals** (host toggle, default off): multiply `swayDeg`, `fovWobbleDeg` and `camLagS` by 0.5 and the ghost oscillation speed by 0.5. Gameplay difficulty stays mostly intact because it lives in the input layer.
- **Hard caps.** Assert these in tests. Tuning may never exceed them:

| Item | Cap |
|---|---|
| delayMs | 300 ms |
| total steer noise | 0.26 |
| deadzone | 0.25 |
| missEdgeP | 0.20 |
| lapse | 2.5 per min, 0.7 s max each |
| inversion | 1.0 per min, 1.0 s max each |
| blurPx@1080 | 3.0 |
| tunnel | 0.55 (centre 45 % always clear) |
| ghost alpha | 0.40 |
| sway | 4.5 deg |
| camLagS | 0.25 s |

- **Finishability guards (always on):**
  1. No lapse, inversion or hiccup in the first 4 s after GO, while `kartState.respawning`, or within 2 s after a respawn.
  2. No event while `speedNorm < 0.2`, so a stuck kart is never also frozen.
  3. Minimum gap of **8 s** between any two events.
  4. Wander is scaled by `0.35 + 0.65*speedNorm` and, if the kart has been below `speedNorm 0.1` for over 2 s, by a further 0.3 until it moves again.
  5. On respawn, reset the OU states and the spring state to 0.
  6. Full steer authority is preserved: the output is clamped to [-1, 1] but never scaled down below the full range.

---

## 4. Calibration rationale: why race 3 (L=2) is "physically difficult"

### 4.1 Control-loop argument (McRuer crossover model)

A human steering a vehicle behaves roughly like `gain x integrator x pure delay` around a crossover frequency `wc`. In compensatory tracking the effective human delay is about 0.1 to 0.3 s and `wc` is a few rad/s (McRuer/Jex crossover-model literature; TU Delft and MIT course notes). Stability needs phase margin. **Extra phase lag at wc = 3 rad/s that our filter adds** is `wc * delay` plus the 2nd-order steer lag `atan2(2 zeta r, 1 - r^2)`, where `r = wc / wn`:

| L | Delay lag | Spring lag | **Added lag** | Effect |
|---|---|---|---|---|
| 1 | 5.2 deg | 9.2 deg | **14 deg** | Feels slightly floaty. A normal player keeps their margin. |
| 2 | 22.3 deg | 16.4 deg | **39 deg** | Uses up roughly the whole ~40 deg margin a sober driver typically runs with. Steering the "normal" way now oscillates (overcorrection), so the player must slow their corrections down, which weakens their rejection of the wander. |
| 3 | 30.9 deg | 17.5 deg | **48 deg** | Must steer deliberately and early. |
| 4 | 39.5 deg | 18.9 deg | **58 deg** | Big, slow, anticipatory inputs only. |
| 5 | 48.1 deg | 20.6 deg | **69 deg** | Crossover pushed to about 1 rad/s: "steering a boat". Wide kart tracks still allow it. |

Meanwhile the wander disturbance gets stronger (sigma 0.036, then 0.117, then 0.251) exactly while the player's ability to reject it shrinks. That double squeeze between drinks 1 and 2 is the cliff. The deadzone of 0.10 at L=2 also swallows the small corrections a sober player relies on, so drift builds until a large, delayed and overshooting correction follows. That is the weaving pattern measured as SDLP.

### 4.2 Relation to the real numbers (and the exaggeration)

- Real 0.05 % effects are subtle: SDLP +2 to 2.5 cm on road, reaction time +50 to 70 ms. Our L=2 uses about 2x the real latency and an SDLP rise of 2x or more against a sober baseline. That is roughly **a 5 to 10x comedic exaggeration** of the real lane-keeping effect, chosen to meet the user's requirement that crossing the limit makes driving *physically difficult in the game*.
- The *shape* follows the literature: impairment starts at drink 1 (Moskowitz & Fiorentino), is clearly significant by the legal limit (pooled SDLP; NHTSA "difficulty steering" at 0.05), then speed control (0.08), lane and braking (0.10) and substantial loss of control (0.15). Lapses and inversions are game inventions to stand in for 0.15 %+ "substantial impairment" and are restricted to L>=3 and L>=4.

### 4.3 Automated calibration harness (test driver)

Build `tests/calibration/` as a Node script, not part of the engine build:

- **Track:** an oval of 2 x 120 m straights joined by two 180-degree arcs of radius 30 m, width 12 m (a kart is 1.2 m wide), so off-track means `|lateral| > 6 m`. If the engine exposes a headless step function, also run on the real track 1.
- **Kart:** kinematic, `vmax = 25 m/s`, `yawRate = steer * 1.6 rad/s * min(1, v/8)`, throttle to accel 8 m/s^2, brake 15 m/s^2, off-track drag that halves vmax.
- **Bot ("CPU-like test driver"):** pure-pursuit steering, lookahead `La` m, steering gain `k`, an intrinsic human-like reaction delay of 0.15 s and 2 % sensor noise. Its *raw* command is passed through `createImpairment(slot).filter` exactly like a human's, using `drinks = 0..5`, 20 seeds each, 3 laps.
- **Adaptation** (stands in for humans slowing down): for each level, run the grid `k in {1.0, 0.7, 0.5}`, `La in {8, 12, 16}` and throttle cap `{1.0, 0.85, 0.7}`, and report the **best** combination (the "adapted" bot) and the `k=1, La=8, cap=1` combination (the "naive" bot).
- **Metrics per lap:** lap-time ratio vs L=0, % time off-track, SDLP (m), steering reversals per minute (reversal = a sign change of d(steer) with amplitude > 0.05), wall or off-track excursions per lap.

**Targets (Standard intensity, adapted bot, mean over 20 seeds):**

| Drinks | Lap-time ratio | Off-track % | SDLP vs sober | Reversals vs sober | Notes |
|---|---|---|---|---|---|
| 0 | 1.00 | 0 | 1.0x | 1.0x | identity |
| 1 | 1.00 to 1.04 | <=1 | <=1.3x | <=1.2x | "buzzed" |
| **2** | **1.08 to 1.18** | **3 to 10** | **>=2.0x** | **>=1.5x** | **Gate:** the naive bot must show >=1 off-track excursion per lap OR SDLP >=2.5x sober |
| 3 | 1.15 to 1.28 | 6 to 15 | >=2.6x | >=1.7x | |
| 4 | 1.22 to 1.38 | 9 to 20 | >=3.2x | >=1.9x | |
| 5+ | 1.30 to 1.50 | 12 to 25 | >=3.8x | >=2.0x | **Finishable:** 20/20 seeds finish 3 laps within 2.0x sober time |

Also required: `SDLP(L=2) / SDLP(L=1) >= 1.6` (the cliff is real).

**Tuning order when out of band** (stay within the caps): 1) `wanderFastSd`, 2) `delayMs`, 3) `steerZeta`, 4) `deadzone`. Change one knob per iteration, keep the table monotone, and record the final numbers in this file's table.

---

## 5. Pseudocode

### 5.1 Seeded RNG (`rng.js`)

```js
// String hash (xmur3) -> 32-bit seed; mulberry32 PRNG. Both public-domain one-liners.
export function hash32(str){ let h=1779033703^str.length;
  for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); return (h^=h>>>16)>>>0; }
export function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function gauss(rng){ // Box-Muller
  let u=0; while(u===0) u=rng(); const v=rng();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

// Independent streams so changing one feature never reshuffles another
export function slotStreams(sessionSeed, slot, raceIndex){
  const race = hash32(`tipsy:${sessionSeed}:${slot}:${raceIndex}`);
  const who  = hash32(`tipsy-persona:${sessionSeed}:${slot}`);     // stable across races
  return {
    wander:  mulberry32(race ^ 0xA5A5A5A5),
    events:  mulberry32(race ^ 0x5BD1E995),
    buttons: mulberry32(race ^ 0x27D4EB2F),
    persona: mulberry32(who),       // visual phases + lean sign: "P2 always lists left"
  };
}
```

### 5.2 OU process (frame-rate independent, exact discretisation)

```js
class OU { constructor(){ this.x=0; }
  step(dt, sd, tau, rng, mean=0){
    if (sd<=0){ this.x += (mean-this.x)*(1-Math.exp(-dt/tau)); return this.x; }
    const a=Math.exp(-dt/tau);
    this.x = mean + (this.x-mean)*a + sd*Math.sqrt(1-a*a)*gauss(rng);
    return this.x; }
  reset(){ this.x=0; } }
```

### 5.3 `createImpairment(slot)` (filter plus shared state)

```js
import { paramsAt } from './params.js';   // piecewise-linear table of section 3
export function createImpairment(slot, game = window.game){
  const st = { t:0, Ls:0, race:null, buf:[], y:0, v:0,
    ouF:new OU(), ouS:new OU(), ouT:new OU(), thr:0, brk:0,
    prevDrift:false, driftDropped:false, driftPressT:0,
    prevItem:false, itemFireAt:null, itemUntil:0,
    lapseUntil:0, heldSteer:0, heldThr:0, invStart:-1, invEnd:-1,
    hicStart:-1, hicSign:1, lastEventT:-99, sinceGo:0, sinceRespawn:99, slowFor:0,
    rng:null, persona:null, phases:null, leanSign:1 };

  function level(ctx){
    const p = game.session.players.find(q=>q.slot===slot);
    if (!p || slot<0 || slot>3) return 0;
    return levelFor({ drinks: ctx.drinks ?? p.drinks, water:p.water, bodyKg:p.bodyKg, sex:p.sex },
                    game.session.settings?.intensity ?? 1);           // section 2.3
  }

  function filter(raw, dt, ctx){
    if (ctx?.kartState?.isCpu) return raw;                        // belt and braces: never CPUs
    dt = Math.min(Math.max(dt||0, 0), 0.1);                       // clamp hitches
    const Lt = level(ctx);
    if (ctx.raceIndex !== st.race){                               // new race: reseed and snap
      st.race = ctx.raceIndex; Object.assign(st, freshDynamicState());
      const s = slotStreams(game.session.seed>>>0, slot, ctx.raceIndex);
      st.rng = s; st.phases = Array.from({length:8}, ()=>s.persona()*2*Math.PI);
      st.leanSign = s.persona()<0.5 ? -1 : 1; st.Ls = Lt;
    }
    st.Ls += (Lt - st.Ls) * (1 - Math.exp(-dt/2));
    if (Lt === 0 && st.Ls < 1e-3){ st.Ls = 0; st.buf.length = 0; return raw; }  // IDENTITY PATH
    const P = paramsAt(st.Ls);
    st.t += dt;
    const k = ctx.kartState || {};
    const speedNorm = clamp01(k.speedNorm ?? (ctx.speed / (k.maxSpeed || 30)));
    st.sinceGo = k.raceTime ?? (st.sinceGo + dt);
    st.sinceRespawn = k.respawning ? 0 : st.sinceRespawn + dt;
    if (k.respawning){ st.ouF.reset(); st.ouS.reset(); st.y = st.v = 0; }
    st.slowFor = speedNorm < 0.1 ? st.slowFor + dt : 0;

    // 1) sanitize and push to the ring buffer (time-stamped by the internal clock)
    const r = sanitize(raw);      // clamp ranges, NaN -> 0/false
    st.buf.push({ t: st.t, ...r });
    // 2) read the delayed sample: the newest entry with entry.t <= now - delay
    const d = readDelayed(st.buf, st.t - P.delayMs/1000);   // falls back to oldest; prunes entries < now-0.5s (keeps 1)

    // 3) random events (Poisson per frame), with the guards from section 3.4
    const canEvent = st.sinceGo > 4 && st.sinceRespawn > 2 && speedNorm >= 0.2 && st.t - st.lastEventT > 8;
    const E = st.rng.events;
    const fire = (perMin) => perMin > 0 && E() < 1 - Math.exp(-perMin/60 * dt);
    if (canEvent && fire(P.lapsePerMin)){
      st.lapseUntil = st.t + P.lapseDurS + (E()*0.2 - 0.1); st.lastEventT = st.t; emitPhone('lapse');
    } else if (canEvent && fire(P.invertPerMin)){
      st.invStart = st.t; st.invEnd = st.t + P.invertDurS + (E()*0.3 - 0.15); st.lastEventT = st.t; emitPhone('invert');
    } else if (canEvent && fire(P.hiccupPerMin)){
      st.hicStart = st.t; st.hicSign = E()<0.5?-1:1; st.lastEventT = st.t; emitPhone('hiccup');
    }
    const lapse = st.t < st.lapseUntil;

    // 4) steering chain
    let s = deadzone(d.steer, P.deadzone);                    // sign(s)*max(0,|s|-dz)/(1-dz)
    s *= P.steerGain * invertMul(st);                         // 1 -> -1 cosine cross-fade, 150 ms in/out
    if (lapse) s = st.heldSteer; else st.heldSteer = s;       // micro-sleep: hands freeze
    if (st.t - st.hicStart < 0.12) s += 0.35 * st.hicSign;    // hiccup kick
    if (P.steerTn > 1e-4){                                    // underdamped spring = overcorrection
      const wn = 1/P.steerTn, n = Math.ceil(dt / (1/240)), h = dt/n;
      for (let i=0;i<n;i++){ const a = wn*wn*(s - st.y) - 2*P.steerZeta*wn*st.v; st.v += a*h; st.y += st.v*h; }
      s = st.y;
    } else { st.y = s; st.v = 0; }
    let wScale = 0.35 + 0.65*speedNorm; if (st.slowFor > 2) wScale *= 0.3;
    const W = st.rng.wander;
    s += wScale * ( st.ouF.step(dt, P.wanderFastSd, 0.7, W)
                  + st.ouS.step(dt, P.wanderSlowSd, 4.0, W, st.leanSign * P.leanBias) );
    s = clamp(s, -1, 1);

    // 5) pedals: lag plus throttle wobble (speed-control impairment)
    let thrIn = lapse ? st.heldThr : d.throttle; if (!lapse) st.heldThr = d.throttle;
    const aP = P.pedalTau > 1e-4 ? 1 - Math.exp(-dt/P.pedalTau) : 1;
    st.thr += (thrIn - st.thr) * aP;  st.brk += (d.brake - st.brk) * aP;
    const thr = clamp01(st.thr * (1 - Math.abs(st.ouT.step(dt, P.throttleWobbleSd, 1.2, W))));

    // 6) buttons (rising edges evaluated on the DELAYED stream)
    const B = st.rng.buttons;
    if (d.drift && !st.prevDrift){ st.driftDropped = lapse || B() < P.missEdgeP; st.driftPressT = st.t;
      if (st.driftDropped) emitPhone('fumble'); }
    if (!d.drift) st.driftDropped = false;
    const drift = d.drift && !st.driftDropped && (st.t - st.driftPressT) >= P.driftHoldMs/1000;
    st.prevDrift = d.drift;

    if (d.useItem && !st.prevItem){
      if (!lapse && B() >= P.missEdgeP) st.itemFireAt = st.t + P.itemExtraMs/1000; else emitPhone('fumble'); }
    st.prevItem = d.useItem;
    if (st.itemFireAt !== null && st.t >= st.itemFireAt){ st.itemActive = true; st.itemUntil = st.t + 0.1; st.itemFireAt = null; }
    if (st.itemActive && st.t >= st.itemUntil && !d.useItem) st.itemActive = false;  // >=100 ms pulse, longer while held
    const useItem = !!st.itemActive;

    return { steer: s, throttle: thr, brake: clamp01(st.brk), drift, useItem };
  }

  function visual(t = performance.now()/1000, vp = {w:1920, h:1080}){
    return computeVisualFx(st, t, vp, game.session.settings || {});   // 5.4
  }
  return { filter, visual, state: st };
}

// Wiring (done once per human slot by the integration lane)
for (let slot=0; slot<4; slot++){
  const imp = createImpairment(slot);
  window.game.inputFilters[slot] = imp.filter;
  window.game.visualFx[slot]     = imp.visual;   // a function returning the fx object
}
```

Notes:
- `freshDynamicState()` returns zeroed values for every field of `st` except `Ls`, `race`, `rng`, `phases` and `leanSign` (buffer, OU states, spring, pedals, button and event timers, with `lastEventT = -99`).
- Use the internal clock `st.t += dt` for the ring buffer and events, not `ctx.time`. This keeps the filter deterministic and frame-rate independent. A buffer of 256 entries covers 0.5 s at 240 Hz.
- `invertMul(st)`: if `invStart <= t < invEnd`, then `u = min(1, (t-invStart)/0.15, (invEnd-t)/0.15)` and the result is `cos(pi*u)`, which is 1 to -1 and back. Otherwise it is 1.
- `emitPhone(type)` sends `{type, slot}` to that player's phone (section 6.2) and also sets `st.lastEvent` for the visuals.
- The identity path returns the **same object** `raw` when `L == 0`. Tests assert both `out === raw` and deep equality.

### 5.4 Visual effects function

```js
function computeVisualFx(st, t, vp, settings){
  const L = st.Ls;
  if (L <= 1e-3) return { blurPx:0, swayDeg:0, doubleVision:0, tunnel:0, hueShift:0,
                          camLagS:0, fovWobbleDeg:0, saturate:1, ghostDx:0, ghostDy:0, zoom:1, blink:0, joltPx:0 };
  const P = paramsAt(L), ph = st.phases, TAU = 2*Math.PI, sc = vp.h/1080;
  const comfort = settings.comfortVisuals ? 0.5 : 1;
  const sway = comfort * P.swayDeg * (0.65*Math.sin(TAU*t/5.3 + ph[0]) + 0.35*Math.sin(TAU*t/2.3 + ph[1]));
  const blink = lapseEnvelope(st);          // 0..1, 80 ms ramps at the edges of st.lapseUntil window
  const dv = P.doubleVision, gs = comfort;  // ghost oscillation slowed in comfort mode
  const th = Math.abs(sway) * Math.PI/180, aspect = Math.max(vp.w/vp.h, vp.h/vp.w);
  return {
    blurPx:   P.blurPx * sc * (0.8 + 0.2*Math.sin(TAU*t/3.7 + ph[2])),
    swayDeg:  sway,
    doubleVision: dv,
    tunnel:   Math.max(P.tunnel, 0.92*blink),
    hueShift: P.hueShift * Math.sin(TAU*t/11 + ph[3]),
    // proposed extras
    camLagS:  comfort * P.camLagS,
    fovWobbleDeg: comfort * P.fovWobbleDeg * Math.sin(TAU*t/6.3 + ph[4]),
    saturate: P.saturate,
    ghostDx:  dv * 0.018 * vp.w * (0.6 + 0.4*Math.sin(gs*TAU*t/5.9 + ph[5])),
    ghostDy:  dv * 0.005 * vp.h * Math.sin(gs*TAU*t/7.7 + ph[6]),
    zoom:     Math.cos(th) + aspect*Math.sin(th),     // hides rotated corners (<=1.13 at 4.2 deg, 16:9)
    blink,
    joltPx:   6 * sc * hiccupEnvelope(st),             // 1 -> 0 over 250 ms after a hiccup
  };
}
```

**Applying it (renderer lane):**
- **Separate canvas per viewport:** set `canvas.style.filter = blur(Bpx) hue-rotate(Hdeg) saturate(S)` and `canvas.style.transform = translateY(joltPx) rotate(swayDeg) scale(zoom)`. Draw the tunnel as a sibling overlay `div` with `radial-gradient(ellipse at center, transparent ${(1-0.55*tunnel)*100}%, rgba(0,0,0,0.85) 100%)`. Do double vision with the shader below, or by drawing the WebGL canvas onto a 2D overlay with `globalAlpha = 0.5*dv` at `(ghostDx, ghostDy)` immediately after render in the same rAF.
- **One WebGL canvas with scissored viewports** (CSS can't target a sub-rect): add one post-process pass per viewport rect:

```glsl
// uniforms: uTex, uRect(x,y,w,h in uv), uDV, uGhost(vec2 uv offset), uTunnel, uHue(rad), uSat, uBlur(px), uTexel
vec3 c = blur9(uTex, uv, uBlur*uTexel);                 // 9-tap, skip when uBlur<0.05
if (uDV > 0.0) c = mix(c, blur9(uTex, uv + uGhost, uBlur*uTexel), 0.5*uDV);
c = hueRotate(c, uHue); c = mix(vec3(dot(c, vec3(.299,.587,.114))), c, uSat);
float r = length((uv - uRect.xy - 0.5*uRect.zw) / (0.5*uRect.zw)) / 1.4142;
c *= 1.0 - 0.85*smoothstep(1.0 - 0.55*uTunnel, 1.0, r);
```

  For sway and zoom in this mode, roll the camera itself (`camera.rotation.z`) and widen the FOV by `zoom`.
- `camLagS`: the chase camera targets the kart's yaw from `camLagS` seconds ago (a small yaw ring buffer). `fovWobbleDeg` is added to the base FOV.
- The HUD (drink counter, BAC, positions) is drawn in a **DOM layer that is not filtered**. Impairment never blurs the HUD.

---

## 6. HUD and phone feedback

### 6.1 Viewport HUD (per player, top corner, unfiltered)

- **Drink counter:** an original vector mug icon followed by `x2` (a water-glass icon with `x0` in water mode).
- **BAC meter:** a 120 x 10 px horizontal bar spanning 0.00 to 0.20 %, with a white tick at `settings.limitLine` labelled `LIMIT`. Fill is green below 0.03, amber from 0.03 to the limit, and red at or above the limit. The text reads `est. BAC 0.060%`.
- **Tier label** from `L`: 0 `Sober`, (0,1.5) `Buzzed`, [1.5,2.5) `Over the limit`, [2.5,3.5) `Wobbly`, [3.5,4.5) `Very wobbly`, 4.5+ `Legless`.
- **Race-start toast** at race 3 (the first race with any `L >= 2`): "Everyone's over the limit. Good luck." Show it once per night.

### 6.2 Phone controller

- The top strip mirrors the viewport: mug x N, the BAC bar, tier label, and `[-] [+]` plus a Water toggle (0.8 s hold).
- The host sends `{drinks, estBAC, tier, water}` on change and `{event:'lapse'|'invert'|'hiccup'|'fumble'}` on events.
- **Haptics** (if `'vibrate' in navigator`): hiccup `[30]`, fumble `[20,30,20]`, lapse `[60,40,60]`, invert `[200]`. On iOS (no vibration API), run a 150 ms CSS shake of the controller UI (translateX +/-4 px) instead.
- **Controller "swim"** (L>=2, default on, host can disable): buttons drift `(1 + L) px` max 6 px on slow sines. Hit areas move with the buttons and keep at least 64 px touch targets.
- **Do NOT add delay on the phone.** All latency lives in the host filter, so it is never double-counted and stays testable.

### 6.3 Title screen (exactly one line, small, bottom)

> Tipsy Kart is just a game. Never drink and drive in real life.

---

## 7. Test plan (`node --test`, no browser)

Expose pure functions: `paramsAt`, `levelFor`, `estimateBAC`, `createImpairment(slot, fakeGame)`, `computeVisualFx` and `installDrinkTracking(fakeGame)`.

| # | Test | Assertion |
|---|---|---|
| T1 | **Race-1 identity** | With drinks 0, feed 10,000 random raw inputs with random `dt` in [1/240, 1/20]. Every `out === raw` and deep-equals it. `visual(t)` returns the neutral object for 100 sample times. |
| T2 | **Water identity** | drinks 5, `water:true` behaves as T1. |
| T3 | **Param monotonicity** | For L from 0 to 5 in steps of 0.01, every param is non-decreasing except `steerZeta`, which is non-increasing. `steerTn` is non-decreasing. `paramsAt(7)` deep-equals `paramsAt(5)`. All L=0 values are neutral. |
| T4 | **Caps** | Every value of `paramsAt(5)` is within the cap table (3.4). The combined steer noise is <= 0.26. |
| T5 | **Level mapping** | `levelFor` is monotone in drinks for 6 body presets (50 kg f, 60 kg f, 75 kg unspecified, 90 kg m, 120 kg m, 200 kg m). **drinks=2 gives L >= 2 for all of them** (the race-3 floor). drinks=1 gives L < 2 for all of them. |
| T6 | **Behavioural monotonicity** | Using the calibration bot (4.3, a reduced set of 5 seeds and 1 lap), the mean SDLP and off-track % are non-decreasing over drinks 0..5 within a 5 % tolerance. `SDLP(2)/SDLP(1) >= 1.6`. |
| T7 | **Determinism** | The same `(seed, slot, raceIndex)` and input sequence give a bit-identical output. Different slots give a steer-noise correlation below 0.3. A different `raceIndex` gives a different sequence while the persona phases stay the same. |
| T8 | **Frame-rate independence** | Run 60 s at 30 Hz vs 144 Hz at L=3. The stationary OU SD matches within 10 %, the event counts over 60 simulated minutes are within +/-30 % of spec, and the measured step latency equals `delayMs` +/- one frame. |
| T9 | **Robustness** | Garbage input (NaN, undefined, steer 5, `dt` 0 or 1) never yields NaN, and outputs stay in range. |
| T10 | **Event gating** | Zero lapses at L<=2 and zero inversions at L<=3 (rates interpolate from 0 above those knots); zero hiccups at L<=1. No events in the first 4 s, during respawn, or at `speedNorm < 0.2`. The minimum gap is 8 s. |
| T11 | **CPUs never affected** | Engine integration: 4 humans plus 4 CPUs, all humans at drinks 5. Spy on `inputFilters`: it is called only with slots 0-3 that are human. The CPU control output equals the CPU AI raw output frame by frame. No CPU kart has a `visualFx` entry. Also, `filter(raw, dt, {kartState:{isCpu:true}})` returns `raw`. |
| T12 | **Drink increments** | `raceFinished` increments every human in the results, including DNF. Firing twice with the same `raceIndex` adds only +1. CPUs, absent players and water players are not incremented (water increments `waters`). `cupFinished` does not reset. |
| T13 | **BAC math** | Default 2 drinks gives `estimateBAC` 0.0602 +/- 0.0005. After 1 h it gives 0.0452 +/- 0.0005. 75 kg m is 0.0275 per drink and 60 kg f is 0.0424 per drink. The result is never negative. |
| T14 | **Calibration bands** | (slow, opt-in `npm run calibrate`) The full 4.3 grid hits every band in the targets table, and 20/20 seeds finish at L=5. |

---

## 8. Sources

- NHTSA, *The ABCs of BAC* (DOT HS 809 844): https://www.nhtsa.gov/sites/nhtsa.gov/files/809844-theabcsofbac.pdf
- NHTSA, Drunk driving overview: https://www.nhtsa.gov/risky-driving/drunk-driving
- Moskowitz & Fiorentino (2000), *A Review of the Literature on the Effects of Low Doses of Alcohol on Driving-Related Skills* (DOT HS 809 028): https://rosap.ntl.bts.gov/view/dot/1677
- Lacey et al. (2016), *Drug and Alcohol Crash Risk: A Case-Control Study* (DOT HS 812 355): https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/812355_drugalcoholcrashrisk.pdf
- Widmark factors and elimination rates (NIST forensic presentation): https://www.nist.gov/file/383406 ; pharmacokinetics notes: https://staff.science.uva.nl/~heck/research/alcohol/lesson/pharmacokinetics.pdf
- Illinois State Police BAC table (drinks vs BAC by weight): https://isp.illinois.gov/TrafficSafety/BacTable
- Pooled on-road SDLP analysis at BAC 0.05 (Maastricht): https://cris.maastrichtuniversity.nl/en/publications/a-pooled-analysis-of-on-the-road-highway-driving-studies-in-actua/
- Simulator vs test-track SDLP and steering reversals (SINTEF): https://www.sintef.no/en/publications/publication/1114709 ; https://sintef.no/en/publications/publication/1322515
- Alcohol SDLP and speed SD at 0.04/0.07 % (Psychopharmacology 2022): https://link.springer.com/10.1007/s00213-022-06260-z
- Japanese simulator SDLP dose-response (Psychopharmacology 2020): https://link.springer.com/doi/10.1007/s00213-020-05730-6
- SDLP threshold of about 0.021 % and 0.7 cm per 0.01 % (review citing Irwin 2017): https://pmc.ncbi.nlm.nih.gov/articles/PMC9671988/
- NADS alcohol simulator study (NCT00477984): https://clinicaltrials.gov/study/NCT00477984
- Van Dyke & Fillmore 2015 (steering rate, lane exceedances): https://pmc.ncbi.nlm.nih.gov/articles/PMC4618724
- Reaction time +50 to 70 ms at 0.05 % (Commissaris, Wayne State): https://cphs.wayne.edu/news/detroit-news-prof-randall-commissaris-research-prompts-call-to-drop-michigans-drunken-driving-limit-to-005-41978
- Pursuit and saccades at low BAC (Tyson et al. 2021; NASA): https://ntrs.nasa.gov/api/citations/20180008504/downloads/20180008504.pdf ; https://ntrs.nasa.gov/api/citations/20230013100/downloads/Stone_Berkeley_Presentation2.pdf
- Oculomotor deficits at 0.06/0.10 % (Bangor): https://research.bangor.ac.uk/en/publications/oculomotor-deficits-caused-by-006-and-010-blood-alcohol-concentra/
- Heterophoria and vergence at 0.05/0.10 % (Munsamy et al.): https://avehjournal.org/index.php/aveh/article/view/342
- Alcohol and peripheral vision as a function of attention (SWOV / TRID): https://swov.nl/en/publicatie/effects-alcohol-peripheral-vision-function-attention ; https://trid.trb.org/View/138699
- Concentric field restriction above 1 per mille (Klin Monbl Augenheilkd 1985): https://www.thieme-connect.com/products/ejournals/pdf/10.1055/s-2008-1050922.pdf
- Latency vs tracking/acquisition (Pavlovych & Gutwin): https://graphicsinterface.org/?p=5100 ; latency variation (Regensburg): https://hci.uni-regensburg.de/publications/small_latency_variations_do_not_affect_player_performance_in_first-person_shooters_2024
- Crossover model (course notes): https://ocw.tudelft.nl/wp-content/uploads/2014_Human_Controller_-_5_Frequency_Domain___Crossover.pdf ; https://ocw.mit.edu/courses/16-400-human-factors-engineering-fall-2011/287583c524e3f1d9f6a34dd5c113d57d_MIT16_400F11_lec10.pdf
- OU discretisation as a steering/accel disturbance (arXiv 2607.07844): https://arxiv.org/pdf/2607.07844
- Games: Sea of Thieves grog (wiki): https://seaofthieves.fandom.com/wiki/Grog?oldid=4510 ; GTA IV drunkenness (TechCrunch 2008): https://techcrunch.com/2008/02/21/gta-iv-drunkenness-to-use-dynamic-physics-engine ; GTA wiki: https://www.grandtheftwiki.com/Drinking ; drunk shader (CurseForge): https://www.curseforge.com/minecraft/shaders/henrys-drunk ; Unreal forum: https://forums.unrealengine.com/t/drunk-effect/320054
- Vibration API on iOS Safari (unsupported): https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari

Research note: this lane's sandbox blocked direct page fetches, so the figures above come from search-engine extracts of the cited pages. The exact numbers worth re-checking against primary text before quoting publicly are the SDLP figures (2.5 cm pooled, 4.06 cm, 9.23 cm) and the Lacey odds ratios. None of the game parameters depend on their precise values.
