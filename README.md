# Cappie

Phone-first training log for amputees using grip devices, resistance bands, and a below-knee home program.

Live source: https://github.com/bcg0224/cappie

Dad’s phone URL: https://bcg0224.github.io/

The running build is static HTML + ES modules (`ui.js`, `ui-session.js`, `store.js`, `catalog.js`, `cloud.js`). Open it through a static host. `src/` is a typed draft, not the live app.

## What is in v1

- Multi-limb profile. Below-knee selection unlocks the Heleen Groenewald BKA set (4 Sep 2026). Every exercise has a how-to written for residual and sound sides (published BKA and hand-therapy programmes).
- Equipment filter: grippers, pinch block, putty, bands, chair, mat.
- Training days, weekly session goal, reps / holds, skip reasons.
- Session timer.
- Stats: exercises per day, week/month improvement vs the period before, today vs yesterday, optional mood 1–10 after a full session.
- Clinician invite code (one linked physio).
- Wordmark **Cappie.** — the period follows the theme colour.
- Mountain app icon for the Home Screen (iOS 180 PNG, Android 192/512 + maskable).
- Themes (Clay, Forest, Ink, Dusk), wallpapers, night mode, text size. Settings save on this phone and to the cloud account.
- Optional one-handed mode.
- Tutorial after first setup, including Add to Home Screen for iPhone (Safari) and Android (Chrome). Replay from Settings.
- Home Screen iOS: content sits below the status overlay, night fills the status bar (no white strip), double-tap does not zoom. Pull down from the top to load an update.
- Google Sign-in first. Email / password on the same Supabase project is the backup.

## Dad can log in today (email)

Email works as soon as confirm-email is off in Supabase. If Google shows “not switched on yet”, use email — it is the same cloud account.

1. Supabase → Authentication → Providers → Email: enabled.
2. Authentication → Sign In / Providers → **Confirm email: off**.
3. Authentication → URL Configuration:
   - Site URL = `https://bcg0224.github.io`
   - Redirect URLs include `https://bcg0224.github.io` and `https://bcg0224.github.io/`
4. On his phone open https://bcg0224.github.io/ → email account → **I train** → limbs (below knee unlocks the home program) → chair + mat → training days → tutorial → start.

Add to Home Screen from the tutorial or Settings. Same email on another phone keeps the log.

## Google Sign-in

The button is first on the account screen. Until Google is enabled in Supabase it will say so in plain language and leave email as the backup.

The JSON error `Unsupported provider: provider is not enabled` means the Google provider toggle is still off.

### A. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and pick (or create) a project.
2. APIs & Services → OAuth consent screen. User type **External**. App name **Cappie**. Add the Gmail accounts that will test as test users.
3. APIs & Services → Credentials → **Create credentials** → **OAuth client ID** → Application type **Web application**.
4. Authorized JavaScript origins:
   - `https://bcg0224.github.io`
   - `https://obchkmxbamqaxkmulmmp.supabase.co`
5. Authorized redirect URIs (this exact path):
   - `https://obchkmxbamqaxkmulmmp.supabase.co/auth/v1/callback`
6. Create. Copy the **Client ID** and **Client secret**.

### B. Supabase

1. Authentication → Providers → **Google** → **Enable**.
2. Paste Client ID and Client secret. Save.
3. Authentication → URL Configuration: Site URL `https://bcg0224.github.io`. Redirect URLs include that origin.

After that, **Continue with Google** on https://bcg0224.github.io/ signs in, then asks I train / I’m a clinician.

## Catalog credit

Below-knee mat and chair work follows sheets provided by Heleen Groenewald, 4 Sep 2026, with how-to language aligned to published BKA home programmes (Saskatchewan Health Authority, MyHealth Alberta, Singapore General Hospital physiotherapy, Premier Surgical). Grip work follows standard hand-therapy putty and pinch patterns. Cappie is a log, not medical advice.
