import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = cloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function redirectTo() {
  const { origin, pathname } = window.location;
  return origin + pathname;
}

async function oauthStart(provider) {
  if (!supabase) {
    throw new Error("Cloud is not wired yet. Add SUPABASE_URL and SUPABASE_ANON_KEY in config.js.");
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo() }
  });
  if (error) throw error;
}

async function signUpEmail(email, password, displayName) {
  if (!supabase) throw new Error("Cloud is not wired yet.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo(),
      data: { full_name: displayName, display_name: displayName }
    }
  });
  if (error) throw error;
  return data;
}

async function signInEmail(email, password) {
  if (!supabase) throw new Error("Cloud is not wired yet.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function currentAuthUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user || null;
}

async function cloudSignOut() {
  if (supabase) await supabase.auth.signOut();
}

async function upsertUserRow(user) {
  if (!supabase || !user?.id) return;
  await supabase.from("cappie_users").upsert({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
    one_handed: !!user.oneHanded,
    theme: user.theme || "clay",
    wall: user.wall || "linen"
  });
}

async function pullUserRow(id) {
  if (!supabase) return null;
  const { data } = await supabase.from("cappie_users").select("*").eq("id", id).maybeSingle();
  return data || null;
}

async function pushBundle(ownerId, payload) {
  if (!supabase || !ownerId) return;
  await supabase.from("cappie_bundles").upsert({
    owner_id: ownerId,
    payload,
    updated_at: new Date().toISOString()
  });
}

async function pullBundle(ownerId) {
  if (!supabase || !ownerId) return null;
  const { data } = await supabase.from("cappie_bundles").select("payload, updated_at").eq("owner_id", ownerId).maybeSingle();
  return data || null;
}

async function pushInvite(invite) {
  if (!supabase || !invite) return;
  await supabase.from("cappie_invites").upsert(invite);
}

async function findInvite(code) {
  if (!supabase) return null;
  const { data } = await supabase.from("cappie_invites").select("*").eq("code", code).maybeSingle();
  return data || null;
}

async function pushLink(link) {
  if (!supabase || !link) return;
  await supabase.from("cappie_links").upsert(link);
}

async function pullLinkForPhysio(physioId) {
  if (!supabase) return null;
  const { data } = await supabase.from("cappie_links").select("*").eq("physio_id", physioId).maybeSingle();
  return data || null;
}

export {
  cloudEnabled,
  supabase,
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
};
