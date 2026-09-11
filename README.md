# Cappie

Phone-first training log for amputees using grip devices, resistance bands, and a below-knee home program.

Live source: https://github.com/bcg0224/cappie

Dad’s phone URL: https://bcg0224.github.io/

The running build is static HTML + ES modules (`ui.js`, `ui-session.js`, `store.js`, `catalog.js`, `cloud.js`). Open it through a static host. `src/` is a typed draft, not the live app.

## What is in v1

- Multi-limb profile. Below-knee selection unlocks the Heleen Groenewald BKA set (4 Sep 2026), with cropped sheet photos and a how-to on every exercise.
- Equipment filter: grippers, pinch block, putty, bands, chair, mat.
- Training days, weekly session goal, reps / holds, skip reasons.
- Session timer and exercise descriptions (Dead bug and the rest).
- Stats: exercises per day, week/month improvement vs the period before, today vs yesterday.
- Clinician invite code (one linked physio).
- Themes (Clay, Forest, Ink, Dusk), wallpapers, night mode. Settings save on the phone and to the cloud account.
- Optional one-handed mode.
- Short tutorial after first setup; replay it from Settings.
- Email accounts on Supabase. Role is chosen after sign-in: I train / I’m a clinician.
- Google Sign-in is in the app. It works after the Google Cloud + Supabase steps below.

## Dad can log in today (email)

Email works as soon as confirm-email is off in Supabase.

1. Supabase → Authentication → Providers → Email: enabled.
2. Authentication → Sign In / Providers → **Confirm email: off** (otherwise he waits on a mail link).
3. Authentication → URL Configuration:
   - Site URL = `https://bcg0224.github.io`
   - Redirect URLs include `https://bcg0224.github.io` and `https://bcg0224.github.io/`
4. On his phone open https://bcg0224.github.io/ → **Create account** → name, email, password (6+ characters) → **I train** → select amputated limbs (below knee unlocks the home program) → chair + mat → training days → walk through the tutorial → start.

He can add the site to the Home Screen. Same email on another phone keeps the log. Theme, night mode, and the tutorial flag save automatically.

## Google Sign-in

The **Continue with Google** button is live. Google will error until this is done once in Google Cloud and Supabase.

### A. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and pick (or create) a project.
2. APIs & Services → OAuth consent screen. User type **External**. App name **Cappie**. Add your Gmail as a test user.
3. APIs & Services → Credentials → **Create credentials** → **OAuth client ID** → Application type **Web application**.
4. Authorized JavaScript origins:
   - `https://bcg0224.github.io`
   - `https://obchkmxbamqaxkmulmmp.supabase.co`
5. Authorized redirect URIs (this exact path, nothing else):
   - `https://obchkmxbamqaxkmulmmp.supabase.co/auth/v1/callback`
6. Create. Copy the **Client ID** and **Client secret**.

### B. Supabase

1. Authentication → Providers → **Google** → enable.
2. Paste Client ID and Client secret. Save.
3. Authentication → URL Configuration: Site URL `https://bcg0224.github.io`. Redirect URLs include that origin.

After that, **Continue with Google** on https://bcg0224.github.io/ signs in, then asks I train / I’m a clinician.

## Catalog credit

Below-knee mat and chair work is transcribed from sheets provided by Heleen Groenewald, 4 Sep 2026. Photos are cropped from those sheets at source resolution (not upscaled). Cappie is a log, not medical advice.
