import { KEY, DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, EXERCISES, SKIP } from "./catalog.js";

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
function hasKit(need, owned) {
  return need.some((n) => owned.includes(n));
}
function availableExercises(profile) {
  return EXERCISES.filter((ex) => {
    if (!hasKit(ex.equipment, profile.equipment)) return false;
    if (ex.tag === "grip") return hasUsableHand(profile.amputatedLimbs);
    if (ex.tag === "lower") return hasLower(profile.amputatedLimbs);
    return true;
  });
}
function defaultPlan(profile) {
  return availableExercises(profile).map((ex, i) => ({
    exerciseId: ex.id,
    enabled: i < 5,
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
}

function seedDemoIfEmpty() {
  const db = load();
  if (db.users.length) return;
  const owner = { id: "demo-owner", email: "athlete@cappie.app", password: "demo", displayName: "Alex", role: "owner", oneHanded: false, createdAt: new Date().toISOString() };
  const physio = { id: "demo-physio", email: "physio@cappie.app", password: "demo", displayName: "Sam PT", role: "physio", oneHanded: false, createdAt: new Date().toISOString() };
  const profile = { ownerId: owner.id, amputatedLimbs: ["left_below_elbow"], equipment: ["gripper", "putty", "loop_band", "tube_band", "chair"], trainingDays: [1, 3, 5], frequencyCap: 3, weeklySessionGoal: 3, onboarded: true };
  const plan = defaultPlan(profile);
  const sessions = [];
  for (let w = 0; w < 6; w++) {
    const done = w === 0 ? 1 : w % 2 === 0 ? 3 : 2;
    for (let s = 0; s < done; s++) {
      const day = new Date();
      day.setDate(day.getDate() - w * 7 - s);
      sessions.push({
        id: `seed-${w}-${s}`,
        ownerId: owner.id,
        startedAt: day.toISOString(),
        endedAt: day.toISOString(),
        status: "completed",
        skipReason: null,
        sets: plan.filter((p) => p.enabled).flatMap((p) =>
          Array.from({ length: p.sets }, (_, i) => ({
            exerciseId: p.exerciseId, setIndex: i, prescribedValue: p.prescribedValue, actualValue: p.prescribedValue, completed: true
          }))
        )
      });
    }
  }
  persist({
    users: [owner, physio],
    sessionUserId: null,
    profiles: { [owner.id]: profile },
    plans: { [owner.id]: plan },
    notes: { [owner.id]: { body: "Keep the gripper light this week. Stop if the residual reddens.", updatedAt: new Date().toISOString(), updatedByName: "Sam PT" } },
    sessions: { [owner.id]: sessions },
    invites: [{ code: "CAP-DEMO", ownerId: owner.id, physioId: physio.id, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), usedAt: new Date().toISOString(), revokedAt: null }],
    links: [{ ownerId: owner.id, physioId: physio.id, physioName: "Sam PT", linkedAt: new Date().toISOString() }],
    physioTarget: { [physio.id]: owner.id }
  });
}

seedDemoIfEmpty();

const state = { db: load(), view: "auth" };
const listeners = new Set();
const hooks = { cursor: 0, key: "root" };
let renderUI = () => {};
function setRenderer(fn) {
  renderUI = fn;
}
function refresh() {
  persist(state.db);
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
  if (u.role === "physio") return state.db.physioTarget[u.id] ? "today" : "join";
  if (!state.db.profiles[u.id]?.onboarded) return "onboard";
  return "today";
}
state.view = bootView();

function signUp(email, password, displayName, role) {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return "Enter a valid email.";
  if (password.length < 4) return "Password must be at least 4 characters.";
  if (state.db.users.some((u) => u.email === e)) return "That email is already in use.";
  const user = { id: uid(), email: e, password, displayName: displayName.trim() || e.split("@")[0], role, oneHanded: false, createdAt: new Date().toISOString() };
  state.db.users.push(user);
  state.db.sessionUserId = user.id;
  state.view = role === "physio" ? "join" : "onboard";
  refresh();
  return null;
}
function signIn(email, password) {
  const e = email.trim().toLowerCase();
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
  refresh();
}
function saveOnboarding(p) {
  const u = me();
  if (!u || u.role !== "owner") return;
  const prof = { ...p, ownerId: u.id, onboarded: true };
  state.db.profiles[u.id] = prof;
  state.db.plans[u.id] = defaultPlan(prof);
  state.db.sessions[u.id] = state.db.sessions[u.id] || [];
  state.view = "today";
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
  const session = { id: uid(), ownerId: id, startedAt: new Date().toISOString(), endedAt: null, status: "in_progress", skipReason: null, sets };
  state.db.sessions[id] = [session, ...(state.db.sessions[id] || [])];
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
function finishSession() {
  const id = ownerId();
  if (!id) return;
  state.db.sessions[id] = (state.db.sessions[id] || []).map((s) =>
    s.status === "in_progress" ? { ...s, status: "completed", endedAt: new Date().toISOString() } : s
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
  const invite = state.db.invites.find((i) => i.code === c && !i.revokedAt && !i.usedAt && new Date(i.expiresAt).getTime() > Date.now());
  if (!invite) return "That code is not valid or has expired.";
  state.db.invites = state.db.invites.map((i) => (i.code === c ? { ...i, usedAt: new Date().toISOString(), physioId: u.id } : i));
  state.db.links = state.db.links.filter((l) => l.ownerId !== invite.ownerId);
  state.db.links.push({ ownerId: invite.ownerId, physioId: u.id, physioName: u.displayName, linkedAt: new Date().toISOString() });
  state.db.physioTarget[u.id] = invite.ownerId;
  state.view = "today";
  refresh();
  return null;
}

export {
  DAYS, LIMB_OPTIONS, EQUIPMENT_OPTIONS, EXERCISES, SKIP,
  uid, exById, availableExercises, defaultPlan, weekStart, inThisWeek,
  state, hooks, setRenderer, refresh, subscribe, me, ownerId, profile, plan, sessions, note, link, isPhysio,
  setView, bootView, signUp, signIn, signOut, saveOnboarding, updateProfile, setOneHanded,
  updatePlanItem, setNote, startSession, logSet, finishSession, skipSession, deleteSession,
  generateInvite, revokeInvite, unlink, joinWithCode
};
