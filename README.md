# Cappie

Phone-first training log for amputees using grip devices, resistance bands, and a below-knee home program.

Live source: https://github.com/bcg0224/cappie

Dad’s phone URL: https://bcg0224.github.io/

The running build is static HTML + ES modules (`ui.js`, `ui-session.js`, `store.js`, `catalog.js`, `cloud.js`). Open it through a static host. `src/` is a typed draft, not the live app.

## What is in v1

- Multi-limb profile. Below-knee selection unlocks the Heleen Groenewald BKA set (4 Sep 2026).
- Equipment filter: grippers, pinch block, putty, bands, chair, mat.
- Training days, weekly session goal, reps / holds, skip reasons.
- Session timer.
- Progress charts: sessions vs goal, volume per exercise.
- Clinician invite code (one linked physio).
- Themes (Clay, Forest, Ink, Dusk) and wallpapers (Linen, Sand, Slate, Meadow).
- Optional one-handed mode.
- Email accounts on Supabase. Role is chosen after sign-in: I train / I’m a clinician.
- Google and Apple stay off until those providers are configured.

## Dad can log in today (email)

Email works as soon as confirm-email is off in Supabase.

1. Supabase → Authentication → Providers → Email: enabled.
2. Authentication → Sign In / Providers → **Confirm email: off** (otherwise he waits on a mail link).
3. Authentication → URL Configuration: Site URL = `https://bcg0224.github.io`. Redirect URLs include that origin and `http://localhost:4173`.
4. On his phone open https://bcg0224.github.io/ → **Create account** → name, email, password (6+ characters) → **I train** → select amputated limbs (below knee unlocks the home program) → chair + mat → training days → start.

He can add the site to the Home Screen. Same email on another phone keeps the log.

## Google (optional, later)

1. Google Cloud → Web OAuth client.
2. Authorized redirect URI:
   `https://obchkmxbamqaxkmulmmp.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → Client ID and Secret.

## Catalog credit

Below-knee mat and chair work is transcribed from sheets provided by Heleen Groenewald, 4 Sep 2026. Cappie is a log, not medical advice.
