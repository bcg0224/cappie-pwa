import { html } from "https://esm.sh/htm/preact/standalone";
import {
  DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, SKIP, TUTORIAL,
  exById, inThisWeek,
  state, hooks, me, profile, plan, sessions, note, link, isPhysio,
  setView, signUp, signIn, saveOnboarding,
  startSession, logSet, finishSession, skipSession,
  timerSeconds, startTimer, pauseTimer, resetTimer,
  cloudEnabled, startOAuth, setRole, setLook, completeTutorial
} from "./store.js?v=20260911f";

const hookBuckets = new Map();
function preactState(init) {
  const bucket = hookBuckets.get(hooks.key) || [];
  const i = hooks.cursor++;
  if (bucket[i] === undefined) bucket[i] = typeof init === "function" ? init() : init;
  hookBuckets.set(hooks.key, bucket);
  const set = (v) => {
    bucket[i] = typeof v === "function" ? v(bucket[i]) : v;
    hooks.cursor = 0;
    if (typeof window !== "undefined" && window.__cappieRender) window.__cappieRender();
  };
  return [bucket[i], set];
}

function GoogleMark() {
  return html`<svg class="g-mark" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.9 2-1.8 2.6v2.2h3c1.8-1.6 2.6-4 2.6-6.4z"/>
    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H1v2.3C2.4 16.1 5.5 18 9 18z"/>
    <path fill="#FBBC05" d="M4 10.8c-.2-.6-.3-1.2-.3-1.8S3.8 7.8 4 7.2V4.9H1C.4 6.1 0 7.5 0 9s.4 2.9 1 4.1l3-2.3z"/>
    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3C13.5.9 11.4 0 9 0 5.5 0 2.4 1.9 1 4.9l3 2.3C4.7 5.2 6.7 3.6 9 3.6z"/>
  </svg>`;
}

function AuthPage() {
  hooks.key = "auth";
  hooks.cursor = 0;
  const [mode, setMode] = preactState("up");
  const [email, setEmail] = preactState("");
  const [password, setPassword] = preactState("");
  const [name, setName] = preactState("");
  const [busy, setBusy] = preactState(false);
  const [err, setErr] = preactState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const msg = mode === "in" ? await signIn(email, password) : await signUp(email, password, name);
    setErr(msg);
    setBusy(false);
  };
  return html`
    <div class="page" style="padding-top:0">
      <div class="auth-hero">
        <div class="eyebrow">Training log</div>
        <h1>Cappie<span class="dot">.</span></h1>
        <p class="muted">Home training for grip, bands, and below-knee work. Google, or email as backup, then tap I train.</p>
      </div>
      <div class="card">
        ${cloudEnabled && html`
          <button class="btn full oauth google" type="button" disabled=${busy} onClick=${async () => { setBusy(true); setErr(await startOAuth("google")); setBusy(false); }}>
            <${GoogleMark} /> Continue with Google
          </button>
          <div class="or-line"><span>or email</span></div>
        `}
        <div class="row" style="margin-bottom:14px">
          <button class=${"chip " + (mode === "up" ? "on" : "")} onClick=${() => setMode("up")}>Create account</button>
          <button class=${"chip " + (mode === "in" ? "on" : "")} onClick=${() => setMode("in")}>Sign in</button>
        </div>
        <form onSubmit=${submit}>
          ${mode === "up" && html`
            <label class="field"><span>Name</span><input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="Your name" autocomplete="name" /></label>
          `}
          <label class="field"><span>Email</span><input type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="you@email.com" autocomplete="email" /></label>
          <label class="field"><span>Password</span><input type="password" value=${password} onInput=${(e) => setPassword(e.target.value)} autocomplete=${mode === "up" ? "new-password" : "current-password"} /></label>
          ${err && html`<p class="err">${err}</p>`}
          <button class="btn accent full" type="submit" disabled=${busy}>${busy ? "Please wait…" : mode === "in" ? "Sign in with email" : "Create email account"}</button>
        </form>
      </div>
      <p class="disclaimer">Cappie is a training log, not medical advice. Follow the limits your clinician gave you.</p>
    </div>
  `;
}

function RolePage() {
  return html`
    <div class="page">
      <div class="eyebrow">Account</div>
      <h2 style="margin:6px 0 10px">How will you use Cappie?</h2>
      <p class="muted">Athletes log sessions. A clinician account is only for viewing someone else’s plan.</p>
      <button class="btn accent full" style="margin-top:12px" onClick=${() => setRole("owner")}>I train</button>
      <button class="btn ghost full" style="margin-top:8px" onClick=${() => setRole("physio")}>I’m a clinician</button>
    </div>
  `;
}

function OnboardingPage() {
  hooks.key = "onboard";
  hooks.cursor = 0;
  const [step, setStep] = preactState(0);
  const [limbs, setLimbs] = preactState([]);
  const [kit, setKit] = preactState(["chair", "mat"]);
  const [days, setDays] = preactState([1, 3, 5]);
  const [goal, setGoal] = preactState(3);
  const toggle = (list, item, set) => set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const u = me();
  return html`
    <div class="page">
      <div class="eyebrow">Setup ${step + 1} / 3</div>
      <h2 style="margin:6px 0 16px">
        ${step === 0 ? `Welcome, ${u?.displayName || ""}. Which limbs are amputated?` : step === 1 ? "What equipment do you have?" : "When do you want to train?"}
      </h2>
      ${step === 0 && html`
        <p class="muted">Select every side that applies. Below-knee unlocks the home chair and mat program.</p>
        ${["upper", "lower"].map((g) => html`
          <div class="card" key=${g}>
            <h3>${g === "upper" ? "Arm and hand" : "Leg"}</h3>
            ${LIMB_OPTIONS.filter((l) => l.group === g).map((l) => html`
              <button key=${l.id} class=${"chip " + (limbs.includes(l.id) ? "on" : "")} style="width:100%;margin-bottom:8px" onClick=${() => toggle(limbs, l.id, setLimbs)}>${l.label}</button>
            `)}
          </div>
        `)}
        <button class="btn accent full" disabled=${!limbs.length} onClick=${() => setStep(1)}>Next</button>
      `}
      ${step === 1 && html`
        ${EQUIPMENT_OPTIONS.map((e) => html`
          <button key=${e.id} class=${"chip " + (kit.includes(e.id) ? "on" : "")} style="width:100%;margin-bottom:8px" onClick=${() => toggle(kit, e.id, setKit)}>${e.label}</button>
        `)}
        <button class="btn accent full" disabled=${!kit.length} onClick=${() => setStep(2)}>Next</button>
      `}
      ${step === 2 && html`
        <div class="card">
          <h3>Training days</h3>
          <div class="grid3">
            ${DAYS.map((d, i) => html`<button key=${d} class=${"chip " + (days.includes(i) ? "on" : "")} onClick=${() => toggle(days, i, setDays)}>${d}</button>`)}
          </div>
        </div>
        <div class="card">
          <h3>Sessions this week</h3>
          <div class="stepper">
            <button onClick=${() => setGoal(Math.max(1, goal - 1))}>−</button>
            <div class="val">${goal}</div>
            <button onClick=${() => setGoal(Math.min(7, goal + 1))}>+</button>
          </div>
        </div>
        <button class="btn accent full" disabled=${!days.length} onClick=${() => saveOnboarding({ amputatedLimbs: limbs, equipment: kit, trainingDays: days, frequencyCap: goal, weeklySessionGoal: goal })}>Create my plan</button>
      `}
    </div>
  `;
}

function TutorialPage() {
  hooks.key = "tutorial";
  hooks.cursor = 0;
  const [step, setStep] = preactState(0);
  const t = TUTORIAL[step];
  const last = step === TUTORIAL.length - 1;
  return html`
    <div class="page">
      <div class="eyebrow">How Cappie works · ${step + 1} / ${TUTORIAL.length}</div>
      <h2 style="margin:6px 0 10px">${t.title}</h2>
      <div class="card">
        <p class="muted" style="margin:0">${t.body}</p>
        ${t.steps?.length ? html`<ol class="how-list">${t.steps.map((s) => html`<li key=${s}>${s}</li>`)}</ol>` : null}
      </div>
      <div class="progress-bar" style="margin-bottom:16px"><span style=${{ width: ((step + 1) / TUTORIAL.length) * 100 + "%" }}></span></div>
      <button class="btn accent full" onClick=${() => last ? completeTutorial() : setStep(step + 1)}>${last ? "Start using Cappie" : "Next"}</button>
      <button class="btn ghost full" style="margin-top:8px" onClick=${completeTutorial}>Skip tutorial</button>
    </div>
  `;
}

function TodayPage() {
  const prof = profile();
  const u = me();
  if (!prof) return html`<div class="page"><p class="muted">No profile.</p></div>`;
  const today = new Date().getDay();
  const weekSessions = sessions().filter((s) => s.status === "completed" && inThisWeek(s.startedAt));
  const skipped = sessions().filter((s) => s.status === "skipped" && inThisWeek(s.startedAt));
  const done = weekSessions.length;
  const goal = prof.weeklySessionGoal;
  const capHit = done >= prof.frequencyCap;
  const open = sessions().find((s) => s.status === "in_progress");
  const enabled = plan().filter((p) => p.enabled);
  const pct = Math.min(100, Math.round((done / Math.max(goal, 1)) * 100));
  const isDay = prof.trainingDays.includes(today);
  return html`
    <div class="page">
      <div class="row space" style="align-items:center;margin-bottom:4px">
        <div class="eyebrow">${DAYS[today]}</div>
        <button class=${"night-toggle " + (u?.night ? "on" : "")} onClick=${() => setLook({ night: !u.night })} aria-pressed=${!!u?.night} aria-label=${u?.night ? "Switch to day" : "Switch to night"}>
          ${u?.night
            ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>`
            : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`}
          ${u?.night ? "Night" : "Day"}
        </button>
      </div>
      <div class="row space" style="align-items:flex-end;margin-bottom:12px">
        <div>
          <div class="hero-num">${done}<small>/ ${goal}</small></div>
          <div class="muted">sessions this week</div>
        </div>
        <div class="tiny">${pct}% of goal</div>
      </div>
      <div class="progress-bar" style="margin-bottom:16px"><span style=${{ width: pct + "%" }}></span></div>
      ${isPhysio() && html`<div class="banner">Viewing this athlete’s week. You can edit the plan, not log sets.</div>`}
      ${note()?.body && html`<div class="card"><div class="tiny">Note from ${note().updatedByName}</div><p class="muted" style="margin:6px 0 0">${note().body}</p></div>`}
      <div class="card">
        <h3>${open ? "Session in progress" : isDay ? "Today is a training day" : "No session scheduled today"}</h3>
        <p class="muted">${enabled.length} exercises in the plan${capHit ? " · weekly cap reached" : ""}${skipped.length ? ` · ${skipped.length} skipped` : ""}</p>
        ${!isPhysio() && html`
          <button class="btn accent full" style="margin-top:12px" disabled=${!enabled.length || (!open && capHit)} onClick=${startSession}>${open ? "Resume session" : "Start session"}</button>
          <button class="btn ghost full" style="margin-top:8px" onClick=${() => skipSession("time")}>Skip today</button>
        `}
      </div>
      <div class="card">
        <h3>Today’s work</h3>
        ${enabled.map((p) => {
          const ex = exById(p.exerciseId);
          if (!ex) return null;
          return html`<div class="list-item" key=${p.exerciseId}>
            <div>
              <div style="font-weight:700">${ex.name}</div>
              <div class="tiny">${p.sets} × ${p.prescribedValue} ${ex.metric}${ex.category === "band" ? " · " + p.bandLevel : ""}</div>
            </div>
            <div class="tiny">${ex.position}</div>
          </div>`;
        })}
        ${!enabled.length && html`<p class="muted">Turn on exercises in Plan.</p>`}
      </div>
      ${link() && !isPhysio() && html`<p class="tiny">Linked clinician: ${link().physioName}</p>`}
    </div>
  `;
}

function SessionPage() {
  hooks.key = "session";
  hooks.cursor = 0;
  const [idx, setIdx] = preactState(0);
  const [showSkip, setShowSkip] = preactState(false);
  const [openHow, setOpenHow] = preactState(true);
  const [mood, setMood] = preactState(null);
  const open = sessions().find((s) => s.status === "in_progress");
  if (!open) {
    return html`<div class="page"><p class="muted">No open session.</p><button class="btn accent full" onClick=${() => setView("today")}>Back</button></div>`;
  }
  const ids = [...new Set(open.sets.map((s) => s.exerciseId))];
  const groups = ids.map((id) => ({ id, sets: open.sets.filter((s) => s.exerciseId === id) }));
  const current = groups[Math.min(idx, groups.length - 1)];
  const ex = current ? exById(current.id) : undefined;
  const doneSets = open.sets.filter((s) => s.completed).length;
  const allDone = open.sets.length > 0 && doneSets === open.sets.length;
  return html`
    <div class="page">
      <div class="eyebrow">Exercise ${Math.min(idx + 1, groups.length)} / ${groups.length} · ${doneSets}/${open.sets.length} sets</div>
      <h2 style="margin:4px 0 8px">${ex?.name || "Session"}</h2>
      <p class="lead">${ex?.description || ex?.cue}</p>
      ${ex?.how?.length && html`
        <div class="card">
          <button class="row space how-toggle" onClick=${() => setOpenHow(!openHow)}>
            <h3 style="margin:0">What needs to happen</h3>
            <span class="tiny">${openHow ? "Hide" : "Show"}</span>
          </button>
          ${openHow && html`<ol class="how-list">${ex.how.map((step) => html`<li key=${step}>${step}</li>`)}</ol>`}
        </div>
      `}
      <p class="tiny" style="margin-bottom:12px">${ex?.adaptation}${ex?.source ? " · " + ex.source : ""}</p>
      <div class="card">
        <div class="row space">
          <div>
            <div class="eyebrow">Timer</div>
            <div class="hero-num" style="font-size:36px;margin-top:4px">${String(Math.floor(timerSeconds() / 60)).padStart(2, "0")}:${String(timerSeconds() % 60).padStart(2, "0")}</div>
          </div>
        </div>
        <div class="grid3" style="margin-top:10px">
          <button class="btn accent" onClick=${startTimer}>Start</button>
          <button class="btn ghost" onClick=${pauseTimer}>Pause</button>
          <button class="btn ghost" onClick=${resetTimer}>Reset</button>
        </div>
      </div>
      ${current?.sets.map((set) => html`
        <div class="card" key=${set.exerciseId + "-" + set.setIndex}>
          <div class="row space"><h3>Set ${set.setIndex + 1}</h3><div class="tiny">prescribed ${set.prescribedValue} ${ex?.metric}</div></div>
          <div class="stepper" style="margin:8px 0 12px">
            <button disabled=${isPhysio()} onClick=${() => logSet(set.exerciseId, set.setIndex, Math.max(1, set.actualValue - 1), set.completed)}>−</button>
            <div class="val">${set.actualValue}</div>
            <button disabled=${isPhysio()} onClick=${() => logSet(set.exerciseId, set.setIndex, set.actualValue + 1, set.completed)}>+</button>
          </div>
          <button class=${"btn full " + (set.completed ? "teal" : "accent")} disabled=${isPhysio()} onClick=${() => logSet(set.exerciseId, set.setIndex, set.actualValue, !set.completed)}>
            ${set.completed ? "Set done" : "Mark set done"}
          </button>
        </div>
      `)}
      <div class="grid2">
        <button class="btn ghost" disabled=${idx === 0} onClick=${() => { setIdx(Math.max(0, idx - 1)); setOpenHow(true); }}>Previous</button>
        <button class="btn ghost" disabled=${idx >= groups.length - 1} onClick=${() => { setIdx(idx + 1); setOpenHow(true); }}>Next</button>
      </div>
      ${allDone && !isPhysio() ? html`
        <div class="card" style="margin-top:12px">
          <h3>How did that feel?</h3>
          <p class="muted">Optional. 1 is low, 10 is great. Skip if you would rather not say.</p>
          <div class="grid5" style="margin:10px 0 12px">
            ${[1,2,3,4,5,6,7,8,9,10].map((n) => html`<button key=${n} class=${"chip center " + (mood === n ? "on" : "")} onClick=${() => setMood(n)}>${n}</button>`)}
          </div>
          <button class="btn accent full" onClick=${() => finishSession(mood)}>Finish session</button>
        </div>
      ` : html`<button class="btn accent full" style="margin-top:12px" onClick=${() => finishSession(null)}>Finish remaining as-is</button>`}
      ${!isPhysio() && html`<button class="btn ghost full" style="margin-top:8px" onClick=${() => setShowSkip(true)}>Skip session</button>`}
      ${showSkip && html`
        <div class="card" style="margin-top:12px">
          <h3>Why skip?</h3>
          ${SKIP.map((r) => html`<button key=${r.id} class="chip" style="width:100%;margin-bottom:8px" onClick=${() => skipSession(r.id)}>${r.label}</button>`)}
        </div>
      `}
    </div>
  `;
}

export { AuthPage, RolePage, OnboardingPage, TutorialPage, TodayPage, SessionPage, preactState };
