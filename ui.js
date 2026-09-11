import { html, render } from "https://esm.sh/htm/preact/standalone";
import {
  DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, THEMES, WALLS,
  exById, availableExercises, weekStart,
  state, hooks, setRenderer, subscribe, me, profile, plan, sessions, note, link, isPhysio,
  setView, signOut, updateProfile, setOneHanded, setLook,
  updatePlanItem, setNote, deleteSession,
  generateInvite, revokeInvite, unlink, joinWithCode
} from "./store.js";
import { AuthPage, RolePage, OnboardingPage, TodayPage, SessionPage, preactState } from "./ui-session.js";

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
              <div><h3 style="margin:0">${ex.name}</h3><div class="tiny">${ex.category} · ${ex.position}</div></div>
              <button class=${"toggle " + (item.enabled ? "on" : "")} onClick=${() => updatePlanItem(ex.id, { enabled: !item.enabled })}><i /></button>
            </div>
            ${item.enabled && html`
              <p class="muted" style="margin:8px 0">${ex.cue}</p>
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

function weeksBack(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = weekStart();
    d.setDate(d.getDate() - i * 7);
    out.push({ start: d, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }
  return out;
}

function ProgressPage() {
  hooks.key = "progress";
  hooks.cursor = 0;
  const enabled = plan().filter((p) => p.enabled);
  const [exId, setExId] = preactState(enabled[0]?.exerciseId || "");
  const weeks = weeksBack(8);
  const goal = profile()?.weeklySessionGoal || 3;
  const sessionSeries = weeks.map((w) => {
    const completed = sessions().filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return s.status === "completed" && t >= w.start.getTime() && t < w.start.getTime() + 7 * 86400000;
    }).length;
    return { ...w, completed, goal };
  });
  const volumeSeries = weeks.map((w) => {
    let vol = 0;
    sessions().forEach((s) => {
      const t = new Date(s.startedAt).getTime();
      if (s.status !== "completed") return;
      if (t < w.start.getTime() || t >= w.start.getTime() + 7 * 86400000) return;
      s.sets.forEach((set) => {
        if (set.exerciseId === exId && set.completed) vol += set.actualValue;
      });
    });
    return { ...w, vol };
  });
  const thisWeek = sessionSeries[sessionSeries.length - 1];
  const pct = Math.min(100, Math.round(((thisWeek?.completed || 0) / Math.max(goal, 1)) * 100));
  const maxBar = Math.max(goal, ...sessionSeries.map((s) => s.completed), 1);
  const maxVol = Math.max(...volumeSeries.map((s) => s.vol), 1);
  const history = [...sessions()].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  return html`
    <div class="page">
      <div class="eyebrow">Progress</div>
      <div class="hero-num" style="margin:6px 0 4px">${pct}<small>%</small></div>
      <p class="muted">Adherence this week · ${thisWeek?.completed || 0} of ${goal} sessions</p>
      <div class="card">
        <h3>Sessions vs goal</h3>
        <svg class="chart" viewBox="0 0 320 160">
          ${sessionSeries.map((s, i) => {
            const x = 16 + i * 36;
            const hGoal = (s.goal / maxBar) * 110;
            const hDone = (s.completed / maxBar) * 110;
            return html`<g key=${s.label}>
              <rect x=${x} y=${130 - hGoal} width="28" height=${hGoal} rx="6" fill="#ece6df" />
              <rect x=${x} y=${130 - hDone} width="28" height=${hDone} rx="6" fill="#C45C26" />
              <text x=${x + 14} y="148" text-anchor="middle" font-size="9" fill="#5c5c5c">${s.label}</text>
            </g>`;
          })}
        </svg>
        <div class="tiny">Grey = goal · terracotta = completed</div>
      </div>
      <div class="card">
        <div class="row space">
          <h3 style="margin:0">Per exercise</h3>
          <select value=${exId} onChange=${(e) => setExId(e.target.value)} style="width:auto">
            ${enabled.map((p) => html`<option value=${p.exerciseId}>${exById(p.exerciseId)?.name}</option>`)}
          </select>
        </div>
        <svg class="chart" viewBox="0 0 320 160">
          ${volumeSeries.map((s, i) => {
            const x = 20 + i * 38;
            const y = 130 - (s.vol / maxVol) * 110;
            const next = volumeSeries[i + 1];
            return html`<g key=${s.label}>
              ${next && html`<line x1=${x} y1=${y} x2=${x + 38} y2=${130 - (next.vol / maxVol) * 110} stroke="#C45C26" stroke-width="3" />`}
              <circle cx=${x} cy=${y} r="4" fill="#1E3A4C" />
              <text x=${x} y="148" text-anchor="middle" font-size="9" fill="#5c5c5c">${s.label}</text>
            </g>`;
          })}
        </svg>
        <div class="tiny">Completed reps or seconds for the selected exercise</div>
      </div>
      <div class="card">
        <div class="row space">
          <h3 style="margin:0">History</h3>
          <button class="btn ghost" style="min-height:36px" onClick=${() => setView("history")}>All</button>
        </div>
        ${history.slice(0, 5).map((s) => html`
          <div class="list-item" key=${s.id}>
            <div>
              <div style="font-weight:700">${s.status === "completed" ? "Completed" : s.status === "skipped" ? "Skipped" : "Open"}</div>
              <div class="tiny">${new Date(s.startedAt).toLocaleString()}${s.skipReason ? " · " + s.skipReason : ""}</div>
            </div>
            <div class="tiny">${s.sets.filter((x) => x.completed).length} sets</div>
          </div>
        `)}
        ${!history.length && html`<p class="muted">No sessions yet.</p>`}
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
          <p class="muted">${s.sets.filter((x) => x.completed).length} sets logged${s.skipReason ? " · " + s.skipReason : ""}</p>
          ${canDelete && html`<button class="btn ghost full" onClick=${() => deleteSession(s.id)}>Delete mistaken session</button>`}
        </div>`;
      })}
    </div>
  `;
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
      <div class="eyebrow">Profile</div>
      <h2 style="margin-top:4px">${u.displayName}</h2>
      <p class="muted">${u.email} · ${u.role === "owner" ? "Athlete" : "Clinician"}</p>
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
  const showTabs = !!u && !["auth", "role", "onboard", "join", "session", "share", "history"].includes(view);
  const page =
    view === "auth" ? AuthPage() :
    view === "role" ? RolePage() :
    view === "onboard" ? OnboardingPage() :
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
    <div class=${"app " + (u?.oneHanded ? "one-handed" : "")} data-theme=${u?.theme || "clay"} data-wall=${u?.wall || "linen"}>
      ${view !== "auth" && html`<div class="topbar"><div class="brand">Ca<span>ppie</span></div><div class="tiny">${u?.role === "physio" ? "Clinician" : u?.role === "owner" ? "Athlete" : ""}</div></div>`}
      ${page}
      ${showTabs && html`
        <nav class="tabs">
          <button class=${view === "today" ? "on" : ""} onClick=${() => setView("today")}>Today</button>
          <button class=${view === "plan" ? "on" : ""} onClick=${() => setView("plan")}>Plan</button>
          <button class=${view === "progress" ? "on" : ""} onClick=${() => setView("progress")}>Progress</button>
          <button class=${view === "profile" ? "on" : ""} onClick=${() => setView("profile")}>Profile</button>
        </nav>
      `}
    </div>
  `;
}

function renderApp() {
  hooks.cursor = 0;
  render(App(), document.getElementById("root"));
}

window.__cappieRender = renderApp;
setRenderer(renderApp);
subscribe(renderApp);
renderApp();
