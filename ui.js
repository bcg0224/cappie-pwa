import { html, render } from "https://esm.sh/htm/preact/standalone";
import {
  DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, THEMES, WALLS, FONT_SCALES,
  exById, availableExercises, weekStart,
  state, hooks, setRenderer, subscribe, me, profile, plan, sessions, note, link, isPhysio,
  setView, signOut, updateProfile, setOneHanded, setLook,
  updatePlanItem, setNote, deleteSession,
  generateInvite, revokeInvite, unlink, joinWithCode,
  dailyExerciseCounts, exerciseTrends, moodHistory, moodAverage, reopenTutorial, applyChrome
} from "./store.js?v=20260911e";
import { AuthPage, RolePage, OnboardingPage, TutorialPage, TodayPage, SessionPage, preactState } from "./ui-session.js?v=20260911e";

let installPrompt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    if (window.__cappieRender) window.__cappieRender();
  });
}
async function installApp() {
  if (!installPrompt) return;
  installPrompt.prompt();
  try { await installPrompt.userChoice; } catch {}
  installPrompt = null;
  if (window.__cappieRender) window.__cappieRender();
}

function PlanPage() {
  hooks.key = "plan";
  hooks.cursor = 0;
  const [draft, setDraft] = preactState(note()?.body || "");
  const prof = profile();
  if (!prof) return html`<div class="page"></div>`;
  const catalog = availableExercises(prof);
  return html`
    <div class="page">
      <div class="eyebrow">Plan</div>
      <h2 style="margin-top:4px">Days, dose, and load</h2>
      <div class="card">
        <h3>Training days</h3>
        <div class="grid3">
          ${DAYS.map((d, i) => html`
            <button key=${d} class=${"chip " + (prof.trainingDays.includes(i) ? "on" : "")} onClick=${() => {
              const on = prof.trainingDays.includes(i);
              updateProfile({ trainingDays: on ? prof.trainingDays.filter((x) => x !== i) : [...prof.trainingDays, i].sort() });
            }}>${d}</button>
          `)}
        </div>
      </div>
      <div class="card">
        <h3>Weekly session goal</h3>
        <div class="stepper">
          <button onClick=${() => updateProfile({ weeklySessionGoal: Math.max(1, prof.weeklySessionGoal - 1), frequencyCap: Math.max(1, prof.frequencyCap - 1) })}>−</button>
          <div class="val">${prof.weeklySessionGoal}</div>
          <button onClick=${() => updateProfile({ weeklySessionGoal: Math.min(7, prof.weeklySessionGoal + 1), frequencyCap: Math.min(7, prof.frequencyCap + 1) })}>+</button>
        </div>
      </div>
      ${catalog.map((ex) => {
        const item = plan().find((p) => p.exerciseId === ex.id);
        if (!item) return null;
        return html`
          <div class="card" key=${ex.id}>
            <div class="row space">
              <div class="row" style="gap:12px;align-items:center;min-width:0">
              <div><h3 style="margin:0">${ex.name}</h3><div class="tiny">${ex.category} · ${ex.position}</div></div>
              </div>
              <button class=${"toggle " + (item.enabled ? "on" : "")} onClick=${() => updatePlanItem(ex.id, { enabled: !item.enabled })}><i /></button>
            </div>
            ${item.enabled && html`
              <p class="muted" style="margin:8px 0">${ex.description || ex.cue}</p>
              ${ex.how?.length ? html`<ol class="how-list compact">${ex.how.slice(0, 3).map((s) => html`<li key=${s}>${s}</li>`)}</ol>` : null}
              <div class="row space" style="margin-bottom:8px">
                <span class="tiny">Sets</span>
                <div class="stepper">
                  <button onClick=${() => updatePlanItem(ex.id, { sets: Math.max(1, item.sets - 1) })}>−</button>
                  <div class="val" style="font-size:22px">${item.sets}</div>
                  <button onClick=${() => updatePlanItem(ex.id, { sets: item.sets + 1 })}>+</button>
                </div>
              </div>
              <div class="row space">
                <span class="tiny">${ex.metric}</span>
                <div class="stepper">
                  <button onClick=${() => updatePlanItem(ex.id, { prescribedValue: Math.max(1, item.prescribedValue - 1) })}>−</button>
                  <div class="val" style="font-size:22px">${item.prescribedValue}</div>
                  <button onClick=${() => updatePlanItem(ex.id, { prescribedValue: item.prescribedValue + 1 })}>+</button>
                </div>
              </div>
              ${ex.category === "band" && html`
                <div class="grid3" style="margin-top:10px">
                  ${["light", "medium", "heavy"].map((b) => html`<button key=${b} class=${"chip " + (item.bandLevel === b ? "on" : "")} onClick=${() => updatePlanItem(ex.id, { bandLevel: b })}>${b}</button>`)}
                </div>
              `}
              <div class="tiny" style="margin-top:8px">Last edited as ${item.updatedBy}</div>
            `}
          </div>
        `;
      })}
      <div class="card">
        <h3>Clinician note</h3>
        ${isPhysio() ? html`
          <textarea value=${draft} onInput=${(e) => setDraft(e.target.value)} maxlength="280"></textarea>
          <button class="btn accent full" style="margin-top:8px" onClick=${() => setNote(draft)}>Save note</button>
        ` : html`<p class="muted">${note()?.body || "No note yet."}</p>`}
      </div>
    </div>
  `;
}

function deltaLabel(pct) {
  if (pct === "new") return "New";
  if (pct === null || pct === undefined) return "—";
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}

function ProgressPage() {
  hooks.key = "progress";
  hooks.cursor = 0;
  const [period, setPeriod] = preactState(7);
  const days = dailyExerciseCounts(7);
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const trends = exerciseTrends(period);
  const todayCount = days[days.length - 1]?.count || 0;
  return html`
    <div class="page">
      <div class="eyebrow">Stats</div>
      <div class="hero-num" style="margin:6px 0 4px">${todayCount}</div>
      <p class="muted">Exercises logged today</p>
      <div class="card">
        <h3>Exercises per day</h3>
        <svg class="chart" viewBox="0 0 320 160">
          ${days.map((d, i) => {
            const x = 18 + i * 42;
            const h = (d.count / maxDay) * 110;
            return html`<g key=${d.key}>
              <rect x=${x} y=${130 - h} width="28" height=${Math.max(h, 2)} rx="6" fill="var(--accent)" />
              <text x=${x + 14} y="148" text-anchor="middle" font-size="9" fill="var(--muted)">${d.label}</text>
            </g>`;
          })}
        </svg>
        <div class="tiny">Distinct exercises with a completed set</div>
      </div>
      <div class="card">
        <div class="row space">
          <h3 style="margin:0">Improvement</h3>
          <div class="row" style="gap:6px">
            <button class=${"chip " + (period === 7 ? "on" : "")} onClick=${() => setPeriod(7)}>Week</button>
            <button class=${"chip " + (period === 30 ? "on" : "")} onClick=${() => setPeriod(30)}>Month</button>
          </div>
        </div>
        <p class="tiny" style="margin:8px 0 12px">This ${period === 7 ? "week" : "month"} vs the ${period === 7 ? "week" : "month"} before. Day column is today vs yesterday.</p>
        ${trends.map((t) => {
          const ex = exById(t.exerciseId);
          const up = t.pct === "new" || (t.pct || 0) > 0;
          const down = typeof t.pct === "number" && t.pct < 0;
          return html`<div class="list-item" key=${t.exerciseId}>
            <div>
              <div style="font-weight:700">${ex?.name}</div>
              <div class="tiny">Load ${t.curr} · prior ${t.prev} · today ${t.today}</div>
            </div>
            <div style="text-align:right">
              <div class=${"delta " + (up ? "up" : down ? "down" : "")}>${deltaLabel(t.pct)}</div>
              <div class="tiny">day ${deltaLabel(t.dayPct)}</div>
            </div>
          </div>`;
        })}
        ${!trends.length && html`<p class="muted">Turn on exercises in Plan to track them.</p>`}
      </div>
      <div class="card">
        <h3>Mood</h3>
        <div class="hero-num" style="font-size:36px;margin:4px 0">${moodAverage(7) ?? "—"}</div>
        <p class="muted">Week average after a full session. Optional, 1 is low, 10 is great.</p>
        <svg class="chart" viewBox="0 0 320 160">
          ${moodHistory(7).map((d, i) => {
            const x = 18 + i * 42;
            const h = d.avg != null ? (d.avg / 10) * 110 : 2;
            return html`<g key=${d.key}>
              <rect x=${x} y=${130 - h} width="28" height=${Math.max(h, 2)} rx="6" fill=${d.avg != null ? "var(--accent)" : "var(--line)"} />
              <text x=${x + 14} y="148" text-anchor="middle" font-size="9" fill="var(--muted)">${d.label}</text>
            </g>`;
          })}
        </svg>
        ${moodAverage(7) == null ? html`<div class="tiny">Log a mood when you finish every set.</div>` : null}
      </div>
      <div class="card">
        <div class="row space">
          <h3 style="margin:0">History</h3>
          <button class="btn ghost" style="min-height:36px" onClick=${() => setView("history")}>All</button>
        </div>
        ${[...sessions()].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)).slice(0, 5).map((s) => html`
          <div class="list-item" key=${s.id}>
            <div>
              <div style="font-weight:700">${s.status === "completed" ? "Completed" : s.status === "skipped" ? "Skipped" : "Open"}</div>
              <div class="tiny">${new Date(s.startedAt).toLocaleString()}${s.skipReason ? " · " + s.skipReason : ""}${s.mood != null ? " · mood " + s.mood : ""}</div>
            </div>
            <div class="tiny">${s.sets.filter((x) => x.completed).length} sets</div>
          </div>
        `)}
        ${!sessions().length && html`<p class="muted">No sessions yet.</p>`}
      </div>
    </div>
  `;
}

function HistoryPage() {
  const history = [...sessions()].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  return html`
    <div class="page">
      <button class="btn ghost" onClick=${() => setView("progress")}>Back</button>
      <h2>History</h2>
      ${history.map((s) => {
        const age = Date.now() - new Date(s.startedAt).getTime();
        const canDelete = !isPhysio() && age < 24 * 3600 * 1000;
        return html`<div class="card" key=${s.id}>
          <div class="row space"><strong>${s.status}</strong><span class="tiny">${new Date(s.startedAt).toLocaleString()}</span></div>
          <p class="muted">${s.sets.filter((x) => x.completed).length} sets logged${s.skipReason ? " · " + s.skipReason : ""}${s.mood != null ? " · mood " + s.mood : ""}</p>
          ${canDelete && html`<button class="btn ghost full" onClick=${() => deleteSession(s.id)}>Delete mistaken session</button>`}
        </div>`;
      })}
    </div>
  `;
}

function TabGlyph({ name }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "tab-ico" };
  if (name === "today") return html`<svg ...${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
  if (name === "plan") return html`<svg ...${common}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>`;
  if (name === "stats") return html`<svg ...${common}><path d="M5 20V10M12 20V4M19 20v-7"/></svg>`;
  return html`<svg ...${common}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
}

function ProfilePage() {
  hooks.key = "profile";
  hooks.cursor = 0;
  const [openLimbs, setOpenLimbs] = preactState(false);
  const [openKit, setOpenKit] = preactState(false);
  const u = me();
  const prof = profile();
  if (!u) return html`<div class="page"></div>`;
  return html`
    <div class="page">
      <div class="eyebrow">Settings</div>
      <h2 style="margin-top:4px">${u.displayName}</h2>
      <p class="muted">${u.email} · ${u.role === "owner" ? "Athlete" : "Clinician"}</p>
      <div class="card">
        <div class="row space">
          <div><h3 style="margin:0">Night mode</h3><div class="tiny">Darker screen. Also on Today.</div></div>
          <button class=${"toggle " + (u.night ? "on" : "")} onClick=${() => setLook({ night: !u.night })} aria-pressed=${!!u.night}><i /></button>
        </div>
      </div>
      <div class="card">
        <h3>Text size</h3>
        <p class="tiny">Words only. Buttons stay the same size to tap.</p>
        <div class="grid4">
          ${FONT_SCALES.map((f) => html`<button key=${f.id} class=${"chip center " + ((u.fontScale || "md") === f.id ? "on" : "")} onClick=${() => setLook({ fontScale: f.id })}>${f.label}</button>`)}
        </div>
      </div>
      <div class="card">
        <div class="row space">
          <div><h3 style="margin:0">One-handed mode</h3><div class="tiny">Larger tap targets. No drag gestures.</div></div>
          <button class=${"toggle " + (u.oneHanded ? "on" : "")} onClick=${() => setOneHanded(!u.oneHanded)}><i /></button>
        </div>
      </div>
      <div class="card">
        <h3>Theme</h3>
        <div class="grid2">
          ${THEMES.map((t) => html`<button key=${t.id} class=${"chip " + ((u.theme || "clay") === t.id ? "on" : "")} onClick=${() => setLook({ theme: t.id })}>${t.label}</button>`)}
        </div>
      </div>
      <div class="card">
        <h3>Wallpaper</h3>
        <div class="grid2">
          ${WALLS.map((w) => html`<button key=${w.id} class=${"chip " + ((u.wall || "linen") === w.id ? "on" : "")} onClick=${() => setLook({ wall: w.id })}>${w.label}</button>`)}
        </div>
      </div>
      <div class="card">
        <h3>On your Home Screen</h3>
        <p class="muted">Add Cappie so it opens like any other app, with the mountain icon.</p>
        <ol class="how-list">
          <li><strong>iPhone.</strong> Open this page in Safari (not Chrome). Tap Share — the square with the arrow — then Add to Home Screen, then Add.</li>
          <li><strong>Android.</strong> Open this page in Chrome. Tap the three-dot menu, then Add to Home screen or Install app, then Add.</li>
        </ol>
        ${installPrompt && html`<button class="btn accent full" style="margin-top:8px" onClick=${installApp}>Install Cappie</button>`}
      </div>
      <div class="card">
        <h3>How Cappie works</h3>
        <p class="muted">A short walkthrough of Today, a session, Plan, Stats, Settings, and adding Cappie to the Home Screen.</p>
        <button class="btn ghost full" onClick=${reopenTutorial}>Replay tutorial</button>
      </div>
      ${u.role === "owner" && html`
        <div class="card">
          <h3>Share with a clinician</h3>
          <p class="muted">${link() ? "Linked to " + link().physioName : "Generate a code they can enter."}</p>
          <button class="btn accent full" onClick=${() => setView("share")}>Open sharing</button>
        </div>
      `}
      ${u.role === "owner" && prof && html`
        <div class="card">
          <div class="row space"><h3 style="margin:0">Amputated limbs</h3>
            <button class="btn ghost" style="min-height:36px" onClick=${() => setOpenLimbs(!openLimbs)}>${openLimbs ? "Done" : "Edit"}</button>
          </div>
          <p class="tiny">${prof.amputatedLimbs.length} selected</p>
          ${openLimbs && LIMB_OPTIONS.map((o) => html`
            <button key=${o.id} class=${"chip " + (prof.amputatedLimbs.includes(o.id) ? "on" : "")} style="width:100%;margin-top:8px"
              onClick=${() => {
                const on = prof.amputatedLimbs.includes(o.id);
                updateProfile({ amputatedLimbs: on ? prof.amputatedLimbs.filter((x) => x !== o.id) : [...prof.amputatedLimbs, o.id] });
              }}>${o.label}</button>
          `)}
        </div>
        <div class="card">
          <div class="row space"><h3 style="margin:0">Equipment</h3>
            <button class="btn ghost" style="min-height:36px" onClick=${() => setOpenKit(!openKit)}>${openKit ? "Done" : "Edit"}</button>
          </div>
          <p class="tiny">${prof.equipment.length} selected</p>
          ${openKit && EQUIPMENT_OPTIONS.map((o) => html`
            <button key=${o.id} class=${"chip " + (prof.equipment.includes(o.id) ? "on" : "")} style="width:100%;margin-top:8px"
              onClick=${() => {
                const on = prof.equipment.includes(o.id);
                updateProfile({ equipment: on ? prof.equipment.filter((x) => x !== o.id) : [...prof.equipment, o.id] });
              }}>${o.label}</button>
          `)}
        </div>
      `}
      <p class="disclaimer">Cappie is a training log, not medical advice. Follow the limits your clinician gave you.</p>
      <button class="btn ghost full" onClick=${signOut}>Sign out</button>
    </div>
  `;
}

function SharePage() {
  hooks.key = "share";
  hooks.cursor = 0;
  const u = me();
  const active = state.db.invites.find((i) => i.ownerId === u?.id && !i.revokedAt && !i.usedAt);
  const [code, setCode] = preactState(active?.code || "");
  return html`
    <div class="page">
      <button class="btn ghost" onClick=${() => setView("profile")}>Back</button>
      <h2>Share access</h2>
      <p class="muted">Give this code to your clinician. They create a Cappie clinician account and enter it. One clinician at a time. Codes last 7 days.</p>
      <div class="card" style="text-align:center">
        <div class="eyebrow">Invite code</div>
        <div class="hero-num" style="font-size:36px;margin:12px 0">${code || "————"}</div>
        <button class="btn accent full" onClick=${() => { const inv = generateInvite(); if (inv) setCode(inv.code); }}>${code ? "Rotate code" : "Generate code"}</button>
      </div>
      ${link() && html`
        <div class="card">
          <h3>Linked clinician</h3>
          <p class="muted">${link().physioName}</p>
          <button class="btn ghost full" onClick=${() => { unlink(); setCode(""); }}>Unlink</button>
        </div>
      `}
      ${code && html`<button class="btn ghost full" onClick=${() => { revokeInvite(); setCode(""); }}>Revoke unused code</button>`}
    </div>
  `;
}

function JoinPage() {
  hooks.key = "join";
  hooks.cursor = 0;
  const [code, setCode] = preactState("");
  const [err, setErr] = preactState(null);
  return html`
    <div class="page">
      <div class="eyebrow">Clinician</div>
      <h2>Join an athlete</h2>
      <p class="muted">Enter the code they generated in Cappie.</p>
      <label class="field"><span>Invite code</span>
        <input value=${code} onInput=${(e) => setCode(e.target.value.toUpperCase())} placeholder="CAP-7K2M" />
      </label>
      ${err && html`<p class="err">${err}</p>`}
      <button class="btn accent full" onClick=${() => setErr(joinWithCode(code))}>Join</button>
      <button class="btn ghost full" style="margin-top:16px" onClick=${signOut}>Sign out</button>
    </div>
  `;
}

function App() {
  const view = state.view;
  const u = me();
  const showTabs = !!u && !["auth", "role", "onboard", "join", "session", "share", "history", "tutorial"].includes(view);
  const page =
    view === "auth" ? AuthPage() :
    view === "role" ? RolePage() :
    view === "onboard" ? OnboardingPage() :
    view === "tutorial" ? TutorialPage() :
    view === "join" ? JoinPage() :
    view === "today" ? TodayPage() :
    view === "session" ? SessionPage() :
    view === "plan" ? PlanPage() :
    view === "progress" ? ProgressPage() :
    view === "history" ? HistoryPage() :
    view === "share" ? SharePage() :
    view === "profile" ? ProfilePage() :
    AuthPage();
  return html`
    <div class=${"app " + (u?.oneHanded ? "one-handed" : "")} data-theme=${u?.theme || "clay"} data-wall=${u?.wall || "linen"} data-night=${u?.night ? "1" : "0"} data-font=${u?.fontScale || "md"}>
      ${view !== "auth" && html`<div class="topbar"><div class="brand">Cappie<span class="dot">.</span></div><div class="tiny">${u?.role === "physio" ? "Clinician" : u?.role === "owner" ? "Athlete" : ""}</div></div>`}
      ${page}
      ${showTabs && html`
        <nav class="tabs">
          <button class=${view === "today" ? "on" : ""} onClick=${() => setView("today")}><${TabGlyph} name="today" />Today</button>
          <button class=${view === "plan" ? "on" : ""} onClick=${() => setView("plan")}><${TabGlyph} name="plan" />Plan</button>
          <button class=${view === "progress" ? "on" : ""} onClick=${() => setView("progress")}><${TabGlyph} name="stats" />Stats</button>
          <button class=${view === "profile" ? "on" : ""} onClick=${() => setView("profile")}><${TabGlyph} name="settings" />Settings</button>
        </nav>
      `}
    </div>
  `;
}

function renderApp() {
  hooks.cursor = 0;
  applyChrome();
  render(App(), document.getElementById("root"));
}

window.__cappieRender = renderApp;
setRenderer(renderApp);
subscribe(renderApp);
renderApp();
