import { KEY, DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, THEMES, WALLS, FONT_SCALES, EXERCISES, SKIP, TUTORIAL } from "./catalog.js?v=20260911f";
import {
  cloudEnabled,
  oauthStart,
  signUpEmail,
  signInEmail,
  currentAuthUser,
  cloudSignOut,
  upsertUserRow,
  pullUserRow,
  pushBundle,
  pullBundle,
  pushInvite,
  findInvite,
  pushLink,
  pullLinkForPhysio
} from "./cloud.js?v=20260911f";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function exById(id) {
  return EXERCISES.find((e) => e.id === id);
}
function hasUsableHand(limbs) {
  const noLeft = limbs.includes("left_hand") || limbs.includes("left_above_elbow");
  const noRight = limbs.includes("right_hand") || limbs.includes("right_above_elbow");
  return !(noLeft && noRight);
}
function hasLower(limbs) {
  return limbs.some((l) => l.includes("knee"));
}
function hasBelowKnee(limbs) {
  return limbs.some((l) => l.includes("below_knee"));
}
function hasKit(need, owned) {
  if (!need.length) return true;
  return need.some((n) => owned.includes(n));
}
function availableExercises(profile) {
  return EXERCISES.filter((ex) => {
    if (!hasKit(ex.equipment, profile.equipment)) return false;
    if (ex.tag === "grip") return hasUsableHand(profile.amputatedLimbs);
    if (ex.tag === "bka") return hasBelowKnee(profile.amputatedLimbs);
    if (ex.tag === "lower") return hasLower(profile.amputatedLimbs);
    return true;
  });
}
function defaultPlan(profile) {
  const avail = availableExercises(profile);
  const ordered = hasBelowKnee(profile.amputatedLimbs)
    ? [...avail.filter((e) => e.tag === "bka"), ...avail.filter((e) => e.tag !== "bka")]
    : avail;
  return ordered.map((ex, i) => ({
    exerciseId: ex.id,
    enabled: i < 6,
    sets: ex.defaultSets,
    prescribedValue: ex.defaultValue,
    bandLevel: "light",
    restSeconds: 60,
    sortOrder: i,
    updatedBy: "owner"
  }));
}
function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function inThisWeek(iso) {
  const t = new Date(iso).getTime();
  const start = weekStart().getTime();
  return t >= start && t < start + 7 * 86400000;
}
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBack(n) {
  const out = [];
  const today = startOfDay();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}
function completedSets() {
  return sessions().filter((s) => s.status === "completed").flatMap((s) =>
    (s.sets || []).filter((set) => set.completed).map((set) => ({ ...set, at: s.startedAt }))
  );
}
function dailyExerciseCounts(n = 7) {
  const days = daysBack(n);
  const sets = completedSets();
  return days.map((d) => {
    const key = dayKey(d);
    const ids = new Set(sets.filter((s) => dayKey(s.at) === key).map((s) => s.exerciseId));
    return { date: d, key, label: DAYS[d.getDay()], count: ids.size };
  });
}
function volumeInRange(exerciseId, from, to) {
  return completedSets()
    .filter((s) => s.exerciseId === exerciseId && new Date(s.at) >= from && new Date(s.at) < to)
    .reduce((n, s) => n + (s.actualValue || 0), 0);
}
function exerciseTrends(periodDays) {
  const now = startOfDay();
  const currFrom = new Date(now);
  currFrom.setDate(currFrom.getDate() - (periodDays - 1));
  const prevFrom = new Date(currFrom);
  prevFrom.setDate(prevFrom.getDate() - periodDays);
  const enabled = plan().filter((p) => p.enabled);
  return enabled.map((p) => {
    const curr = volumeInRange(p.exerciseId, currFrom, new Date(now.getTime() + 86400000));
    const prev = volumeInRange(p.exerciseId, prevFrom, currFrom);
    let pct = null;
    if (prev > 0) pct = Math.round(((curr - prev) / prev) * 100);
    else if (curr > 0) pct = "new";
    const today = volumeInRange(p.exerciseId, now, new Date(now.getTime() + 86400000));
    const yestDate = new Date(now);
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterday = volumeInRange(p.exerciseId, yestDate, now);
    let dayPct = null;
    if (yesterday > 0) dayPct = Math.round(((today - yesterday) / yesterday) * 100);
    else if (today > 0) dayPct = "new";
    return { exerciseId: p.exerciseId, curr, prev, pct, today, yesterday, dayPct };
  });
}

function moodHistory(n = 7) {
  const days = daysBack(n);
  const logged = sessions().filter((s) => s.status === "completed" && s.mood != null);
  return days.map((d) => {
    const key = dayKey(d);
    const moods = logged.filter((s) => dayKey(s.startedAt) === key).map((s) => Number(s.mood));
    const avg = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null;
    return { date: d, key, label: DAYS[d.getDay()], avg, count: moods.length };
  });
}
function moodAverage(n = 7) {
  const vals = moodHistory(n).map((d) => d.avg).filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
function makeCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return `CAP-${s}`;
}
function emptyDb() {
  return { users: [], sessionUserId: null, profiles: {}, plans: {}, notes: {}, sessions: {}, invites: [], links: [], physioTarget: {} };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyDb(), ...JSON.parse(raw) } : emptyDb();
  } catch {
    return emptyDb();
  }
}
function persist(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  scheduleCloudPush();
}

const DAY_CANVAS = "#f7f3ee";
const NIGHT_CANVAS = "#14181c";
let zoomLocked = false;
function lockZoom() {
  if (zoomLocked || typeof document === "undefined") return;
  zoomLocked = true;
  const stop = (e) => e.preventDefault();
  document.addEventListener("gesturestart", stop, { passive: false });
  document.addEventListener("gesturechange", stop, { passive: false });
  document.addEventListener("gestureend", stop, { passive: false });
}
function applyChrome() {
  if (typeof document === "undefined") return;
  lockZoom();
  const u = me();
  const night = !!u?.night;
  const font = u?.fontScale || "md";
  const root = document.documentElement;
  const standalone = !!(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);
  root.dataset.night = night ? "1" : "0";
  root.dataset.font = font;
  root.dataset.standalone = standalone ? "1" : "0";
  root.style.colorScheme = night ? "dark" : "light";
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", night ? NIGHT_CANVAS : DAY_CANVAS);
}

function ownerBundle(id) {
  const u = state.db.users.find((x) => x.id === id);
  return {
    profile: dbSliceProfile(id),
    plan: state.db.plans[id] || [],
    sessions: state.db.sessions[id] || [],
    notes: state.db.notes[id] || null,
    invites: state.db.invites.filter((i) => i.ownerId === id),
    links: state.db.links.filter((l) => l.ownerId === id),
    look: u
      ? {
          theme: u.theme || "clay",
          wall: u.wall || "linen",
          night: !!u.night,
          oneHanded: !!u.oneHanded,
          tutorialSeen: !!u.tutorialSeen,
          fontScale: u.fontScale || "md"
        }
      : null
  };
}
function dbSliceProfile(id) {
  return state.db.profiles[id] || null;
}

let syncTimer = null;
function scheduleCloudPush() {
  if (!cloudEnabled) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const u = me();
    if (!u) return;
    try { await upsertUserRow(u); } catch { return; }
    const oid = ownerId();
    if (oid) {
      try { await pushBundle(oid, ownerBundle(oid)); } catch {}
    }
    const activeInvite = state.db.invites.find((i) => i.ownerId === u.id && !i.revokedAt);
    if (activeInvite) {
      pushInvite({
        code: activeInvite.code,
        owner_id: activeInvite.ownerId,
        physio_id: activeInvite.physioId,
        expires_at: activeInvite.expiresAt,
        used_at: activeInvite.usedAt,
        revoked_at: activeInvite.revokedAt
      }).catch(() => {});
    }
    const mine = state.db.links.find((l) => l.ownerId === u.id || l.physioId === u.id);
    if (mine) {
      pushLink({
        owner_id: mine.ownerId,
        physio_id: mine.physioId,
        physio_name: mine.physioName,
        linked_at: mine.linkedAt
      }).catch(() => {});
    }
  }, 500);
}

const state = { db: load(), view: "auth", timer: { running: false, startedAt: 0, elapsed: 0 } };
const listeners = new Set();
const hooks = { cursor: 0, key: "root" };
let renderUI = () => {};
function setRenderer(fn) {
  renderUI = fn;
}
function refresh() {
  persist(state.db);
  applyChrome();
  listeners.forEach((fn) => fn());
  renderUI();
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function me() {
  return state.db.users.find((u) => u.id === state.db.sessionUserId) || null;
}
function ownerId() {
  const u = me();
  if (!u) return null;
  return u.role === "owner" ? u.id : state.db.physioTarget[u.id] || null;
}
function profile() {
  const id = ownerId();
  return id ? state.db.profiles[id] || null : null;
}
function plan() {
  const id = ownerId();
  return id ? state.db.plans[id] || [] : [];
}
function sessions() {
  const id = ownerId();
  return id ? state.db.sessions[id] || [] : [];
}
function note() {
  const id = ownerId();
  return id ? state.db.notes[id] : undefined;
}
function link() {
  const id = ownerId();
  return id ? state.db.links.find((l) => l.ownerId === id) : undefined;
}
function isPhysio() {
  return me()?.role === "physio";
}
function setView(v) {
  state.view = v;
  refresh();
}
function bootView() {
  const u = me();
  if (!u) return "auth";
  if (!u.role) return "role";
  if (u.role === "physio") return state.db.physioTarget[u.id] ? "today" : "join";
  if (!state.db.profiles[u.id]?.onboarded) return "onboard";
  if (!u.tutorialSeen) return "tutorial";
  return "today";
}
state.view = bootView();
if (typeof document !== "undefined") applyChrome();

function applyAuthUser(authUser, provider) {
  const email = (authUser.email || "").toLowerCase();
  let user = state.db.users.find((u) => u.id === authUser.id || (email && u.email === email));
  if (!user) {
    user = {
      id: authUser.id,
      authId: authUser.id,
      email,
      password: "",
      displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || (email ? email.split("@")[0] : "Athlete"),
      role: null,
      provider: provider || authUser.app_metadata?.provider || "oauth",
      oneHanded: false,
      theme: "clay",
      wall: "linen",
      night: false,
      tutorialSeen: false,
      fontScale: "md",
      createdAt: new Date().toISOString()
    };
    state.db.users.push(user);
  } else {
    user = {
      ...user,
      id: user.id || authUser.id,
      authId: authUser.id,
      email: email || user.email,
      displayName: user.displayName || authUser.user_metadata?.full_name || user.email,
      provider: provider || user.provider
    };
    state.db.users = state.db.users.map((x) => (x.id === user.id || x.email === user.email ? user : x));
  }
  state.db.sessionUserId = user.id;
  return user;
}

async function applyRemoteBundle(ownerKey, remote) {
  if (!remote?.payload) return;
  const p = remote.payload;
  if (p.profile) state.db.profiles[ownerKey] = p.profile;
  if (p.plan) state.db.plans[ownerKey] = p.plan;
  if (p.sessions) state.db.sessions[ownerKey] = p.sessions;
  if (p.notes) state.db.notes[ownerKey] = p.notes;
  if (Array.isArray(p.invites)) {
    const others = state.db.invites.filter((i) => i.ownerId !== ownerKey);
    state.db.invites = [...others, ...p.invites];
  }
  if (Array.isArray(p.links)) {
    const others = state.db.links.filter((l) => l.ownerId !== ownerKey);
    state.db.links = [...others, ...p.links];
  }
  if (p.look) {
    state.db.users = state.db.users.map((x) =>
      x.id === ownerKey
        ? {
            ...x,
            theme: p.look.theme || x.theme,
            wall: p.look.wall || x.wall,
            night: p.look.night ?? x.night,
            oneHanded: p.look.oneHanded ?? x.oneHanded,
            tutorialSeen: p.look.tutorialSeen ?? x.tutorialSeen,
            fontScale: p.look.fontScale || x.fontScale || "md"
          }
        : x
    );
  }
}

async function hydrateFromCloud() {
  if (!cloudEnabled) return;
  const auth = await currentAuthUser();
  if (!auth) return;
  applyAuthUser(auth);
  const row = await pullUserRow(auth.id);
  if (row) {
    state.db.users = state.db.users.map((x) =>
      x.id === auth.id
        ? {
            ...x,
            displayName: row.display_name || x.displayName,
            role: row.role || x.role,
            oneHanded: !!row.one_handed,
            theme: row.theme || x.theme,
            wall: row.wall || x.wall,
            night: x.night,
            tutorialSeen: x.tutorialSeen
          }
        : x
    );
  }
  const u = me();
  if (u?.role === "physio") {
    const linkRow = await pullLinkForPhysio(u.id);
    if (linkRow) {
      state.db.physioTarget[u.id] = linkRow.owner_id;
      const existing = state.db.links.find((l) => l.ownerId === linkRow.owner_id);
      if (!existing) {
        state.db.links.push({
          ownerId: linkRow.owner_id,
          physioId: linkRow.physio_id,
          physioName: linkRow.physio_name,
          linkedAt: linkRow.linked_at
        });
      }
      await applyRemoteBundle(linkRow.owner_id, await pullBundle(linkRow.owner_id));
    }
  } else if (u) {
    await applyRemoteBundle(u.id, await pullBundle(u.id));
  }
  state.view = bootView();
  persist(state.db);
  applyChrome();
  renderUI();
}

hydrateFromCloud().catch(() => {});

function friendlyAuthError(err) {
  let raw = err?.message || err?.msg || err?.error_description || "";
  if (typeof raw === "object") raw = JSON.stringify(raw);
  const trimmed = String(raw || "").trim();
  let parsed = null;
  if (trimmed.startsWith("{")) {
    try { parsed = JSON.parse(trimmed); } catch { parsed = null; }
  }
  const text = String(parsed?.msg || parsed?.error_description || parsed?.message || trimmed).toLowerCase();
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
    return "Google is not switched on for this app yet. Use email below — it saves to the same Cappie cloud account.";
  }
  if (text.includes("popup") || text.includes("redirect")) {
    return "Google sign-in did not finish. Try again, or use email.";
  }
  return parsed?.msg || trimmed || "Could not start sign-in.";
}

async function startOAuth(provider) {
  try {
    await oauthStart(provider);
    return null;
  } catch (err) {
    return friendlyAuthError(err);
  }
}

function setRole(role) {
  const u = me();
  if (!u) return;
  state.db.users = state.db.users.map((x) => (x.id === u.id ? { ...x, role } : x));
  state.view = role === "physio" ? "join" : "onboard";
  refresh();
}

async function signUp(email, password, displayName) {
  const e = email.trim().toLowerCase();
  const name = (displayName || "").trim() || (e.includes("@") ? e.split("@")[0] : "Athlete");
  if (!e.includes("@")) return "Enter a valid email.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (cloudEnabled) {
    try {
      const data = await signUpEmail(e, password, name);
      if (!data.user || !data.session) {
        return "Check your email to confirm the account, then sign in.";
      }
      applyAuthUser(data.user, "email");
      state.db.users = state.db.users.map((x) =>
        x.id === data.user.id ? { ...x, displayName: name, password: "" } : x
      );
      state.view = "role";
      refresh();
      return null;
    } catch (err) {
      return err?.message || "Could not create the account.";
    }
  }
  if (state.db.users.some((u) => u.email === e)) return "That email is already in use.";
  const user = { id: uid(), email: e, password, displayName: name, role: null, provider: "email", oneHanded: false, theme: "clay", wall: "linen", night: false, tutorialSeen: false, fontScale: "md", createdAt: new Date().toISOString() };
  state.db.users.push(user);
  state.db.sessionUserId = user.id;
  state.view = "role";
  refresh();
  return null;
}
async function signIn(email, password) {
  const e = email.trim().toLowerCase();
  if (cloudEnabled) {
    try {
      const data = await signInEmail(e, password);
      if (!data.user) return "Email or password is wrong.";
      applyAuthUser(data.user, "email");
      const row = await pullUserRow(data.user.id);
      if (row) {
        state.db.users = state.db.users.map((x) =>
          x.id === data.user.id
            ? {
                ...x,
                displayName: row.display_name || x.displayName,
                role: row.role || x.role,
                oneHanded: !!row.one_handed,
                theme: row.theme || x.theme,
                wall: row.wall || x.wall,
                night: x.night,
                tutorialSeen: x.tutorialSeen
              }
            : x
        );
      }
      const u = me();
      if (u?.role === "physio") {
        const linkRow = await pullLinkForPhysio(u.id);
        if (linkRow) {
          state.db.physioTarget[u.id] = linkRow.owner_id;
          await applyRemoteBundle(linkRow.owner_id, await pullBundle(linkRow.owner_id));
        }
      } else if (u) {
        await applyRemoteBundle(u.id, await pullBundle(u.id));
      }
      state.view = bootView();
      refresh();
      return null;
    } catch (err) {
      return err?.message || "Email or password is wrong.";
    }
  }
  const user = state.db.users.find((u) => u.email === e && u.password === password);
  if (!user) return "Email or password is wrong.";
  state.db.sessionUserId = user.id;
  state.view = bootView();
  refresh();
  return null;
}
function signOut() {
  state.db.sessionUserId = null;
  state.view = "auth";
  cloudSignOut().catch(() => {});
  refresh();
}
function saveOnboarding(p) {
  const u = me();
  if (!u || u.role !== "owner") return;
  const prof = { ...p, ownerId: u.id, onboarded: true };
  state.db.profiles[u.id] = prof;
  state.db.plans[u.id] = defaultPlan(prof);
  state.db.sessions[u.id] = state.db.sessions[u.id] || [];
  state.view = "tutorial";
  refresh();
}
function completeTutorial() {
  const u = me();
  if (!u) return;
  state.db.users = state.db.users.map((x) => (x.id === u.id ? { ...x, tutorialSeen: true } : x));
  state.view = "today";
  refresh();
}
function reopenTutorial() {
  const u = me();
  if (!u) return;
  state.view = "tutorial";
  refresh();
}
function updateProfile(patch) {
  const id = ownerId();
  const prof = profile();
  if (!id || !prof) return;
  const next = { ...prof, ...patch };
  state.db.profiles[id] = next;
  if (patch.amputatedLimbs || patch.equipment) {
    const fresh = defaultPlan(next);
    const prev = state.db.plans[id] || [];
    state.db.plans[id] = fresh.map((item) => {
      const old = prev.find((p) => p.exerciseId === item.exerciseId);
      return old ? { ...item, ...old, exerciseId: item.exerciseId } : item;
    });
  }
  refresh();
}
function setOneHanded(v) {
  const u = me();
  if (!u) return;
  state.db.users = state.db.users.map((x) => (x.id === u.id ? { ...x, oneHanded: v } : x));
  refresh();
}
function setLook(patch) {
  const u = me();
  if (!u) return;
  state.db.users = state.db.users.map((x) => (x.id === u.id ? { ...x, ...patch } : x));
  refresh();
}

let timerId = null;
function timerSeconds() {
  if (state.timer.running) return Math.floor((Date.now() - state.timer.startedAt) / 1000);
  return state.timer.elapsed || 0;
}
function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  state.timer.startedAt = Date.now() - (state.timer.elapsed || 0) * 1000;
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => renderUI(), 250);
  renderUI();
}
function pauseTimer() {
  state.timer.elapsed = timerSeconds();
  state.timer.running = false;
  if (timerId) clearInterval(timerId);
  timerId = null;
  renderUI();
}
function resetTimer() {
  state.timer = { running: false, startedAt: 0, elapsed: 0 };
  if (timerId) clearInterval(timerId);
  timerId = null;
  renderUI();
}
function updatePlanItem(exerciseId, patch) {
  const id = ownerId();
  if (!id) return;
  state.db.plans[id] = (state.db.plans[id] || []).map((p) =>
    p.exerciseId === exerciseId ? { ...p, ...patch, updatedBy: me()?.role || "owner" } : p
  );
  refresh();
}
function setNote(body) {
  const id = ownerId();
  const u = me();
  if (!id || !u) return;
  state.db.notes[id] = { body: body.slice(0, 280), updatedAt: new Date().toISOString(), updatedByName: u.displayName };
  refresh();
}
function startSession() {
  const id = ownerId();
  if (!id || isPhysio()) return;
  const open = (state.db.sessions[id] || []).find((s) => s.status === "in_progress");
  if (open) {
    state.view = "session";
    refresh();
    return;
  }
  const enabled = (state.db.plans[id] || []).filter((p) => p.enabled);
  const sets = enabled.flatMap((p) =>
    Array.from({ length: p.sets }, (_, i) => ({
      exerciseId: p.exerciseId, setIndex: i, prescribedValue: p.prescribedValue, actualValue: p.prescribedValue, completed: false
    }))
  );
  const session = { id: uid(), ownerId: id, startedAt: new Date().toISOString(), endedAt: null, status: "in_progress", skipReason: null, mood: null, sets };
  state.db.sessions[id] = [session, ...(state.db.sessions[id] || [])];
  state.timer = { running: false, startedAt: 0, elapsed: 0 };
  state.view = "session";
  refresh();
}
function logSet(exerciseId, setIndex, actual, completed) {
  const id = ownerId();
  if (!id) return;
  state.db.sessions[id] = (state.db.sessions[id] || []).map((s) => {
    if (s.status !== "in_progress") return s;
    return {
      ...s,
      sets: s.sets.map((set) =>
        set.exerciseId === exerciseId && set.setIndex === setIndex ? { ...set, actualValue: actual, completed } : set
      )
    };
  });
  refresh();
}
function finishSession(mood) {
  const id = ownerId();
  if (!id) return;
  const value = mood == null || mood === "" ? null : Number(mood);
  state.db.sessions[id] = (state.db.sessions[id] || []).map((s) =>
    s.status === "in_progress"
      ? { ...s, status: "completed", endedAt: new Date().toISOString(), mood: Number.isFinite(value) ? value : null }
      : s
  );
  state.view = "today";
  refresh();
}
function skipSession(reason) {
  const id = ownerId();
  if (!id || isPhysio()) return;
  const open = (state.db.sessions[id] || []).find((s) => s.status === "in_progress");
  if (open) {
    state.db.sessions[id] = (state.db.sessions[id] || []).map((s) =>
      s.id === open.id ? { ...s, status: "skipped", skipReason: reason, endedAt: new Date().toISOString() } : s
    );
  } else {
    state.db.sessions[id] = [
      { id: uid(), ownerId: id, startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), status: "skipped", skipReason: reason, sets: [] },
      ...(state.db.sessions[id] || [])
    ];
  }
  state.view = "today";
  refresh();
}
function deleteSession(sid) {
  const id = ownerId();
  if (!id || isPhysio()) return;
  state.db.sessions[id] = (state.db.sessions[id] || []).filter((s) => s.id !== sid);
  refresh();
}
function generateInvite() {
  const u = me();
  if (!u || u.role !== "owner") return null;
  state.db.invites = state.db.invites.map((i) =>
    i.ownerId === u.id && !i.usedAt && !i.revokedAt ? { ...i, revokedAt: new Date().toISOString() } : i
  );
  const invite = { code: makeCode(), ownerId: u.id, physioId: null, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), usedAt: null, revokedAt: null };
  state.db.invites.push(invite);
  refresh();
  return invite;
}
function revokeInvite() {
  const u = me();
  if (!u || u.role !== "owner") return;
  state.db.invites = state.db.invites.map((i) =>
    i.ownerId === u.id && !i.usedAt && !i.revokedAt ? { ...i, revokedAt: new Date().toISOString() } : i
  );
  refresh();
}
function unlink() {
  const u = me();
  if (!u || u.role !== "owner") return;
  state.db.links = state.db.links.filter((l) => l.ownerId !== u.id);
  state.db.invites = state.db.invites.map((i) => (i.ownerId === u.id && !i.revokedAt ? { ...i, revokedAt: new Date().toISOString() } : i));
  state.db.physioTarget = Object.fromEntries(Object.entries(state.db.physioTarget).filter(([, oid]) => oid !== u.id));
  refresh();
}
function joinWithCode(code) {
  const u = me();
  if (!u || u.role !== "physio") return "Sign in as a clinician first.";
  const c = code.trim().toUpperCase();
  const finish = (invite) => {
    if (!invite || invite.revoked_at || invite.revokedAt || invite.used_at || invite.usedAt) return "That code is not valid or has expired.";
    const expires = invite.expires_at || invite.expiresAt;
    if (new Date(expires).getTime() <= Date.now()) return "That code is not valid or has expired.";
    const ownerKey = invite.owner_id || invite.ownerId;
    state.db.invites = [
      ...state.db.invites.filter((i) => i.code !== c),
      { code: c, ownerId: ownerKey, physioId: u.id, expiresAt: expires, usedAt: new Date().toISOString(), revokedAt: null }
    ];
    state.db.links = state.db.links.filter((l) => l.ownerId !== ownerKey);
    const linkRow = { ownerId: ownerKey, physioId: u.id, physioName: u.displayName, linkedAt: new Date().toISOString() };
    state.db.links.push(linkRow);
    state.db.physioTarget[u.id] = ownerKey;
    state.view = "today";
    refresh();
    pushInvite({ code: c, owner_id: ownerKey, physio_id: u.id, expires_at: expires, used_at: new Date().toISOString(), revoked_at: null }).catch(() => {});
    pushLink({ owner_id: ownerKey, physio_id: u.id, physio_name: u.displayName, linked_at: linkRow.linkedAt }).catch(() => {});
    pullBundle(ownerKey).then((remote) => applyRemoteBundle(ownerKey, remote)).catch(() => {});
    return null;
  };
  const local = state.db.invites.find((i) => i.code === c && !i.revokedAt && !i.usedAt && new Date(i.expiresAt).getTime() > Date.now());
  if (local) return finish(local);
  if (cloudEnabled) {
    findInvite(c).then((remote) => {
      const err = finish(remote);
      if (err) {
        state.view = "join";
        refresh();
      }
    }).catch(() => {});
    return null;
  }
  return "That code is not valid or has expired.";
}


export {
  DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, THEMES, WALLS, FONT_SCALES, EXERCISES, SKIP, TUTORIAL,
  uid, exById, availableExercises, defaultPlan, weekStart, inThisWeek, dayKey, dailyExerciseCounts, exerciseTrends, moodHistory, moodAverage,
  state, hooks, setRenderer, refresh, subscribe, me, ownerId, profile, plan, sessions, note, link, isPhysio,
  setView, bootView, signUp, signIn, signOut, saveOnboarding, updateProfile, setOneHanded, setLook,
  completeTutorial, reopenTutorial, applyChrome,
  timerSeconds, startTimer, pauseTimer, resetTimer,
  updatePlanItem, setNote, startSession, logSet, finishSession, skipSession, deleteSession,
  generateInvite, revokeInvite, unlink, joinWithCode,
  cloudEnabled, startOAuth, setRole
};
