# APK Build Guide — DEVKIT as a Trusted Web Activity (TWA)

This guide walks you through packaging the deployed DEVKIT PWA into a real Android `.apk` / `.aab` file that you can install on Android phones or upload to the Google Play Store.

---

## How it works

DEVKIT is a **Progressive Web App**. To ship it as an installable Android app:

1. Deploy DEVKIT to a public HTTPS URL (Vercel, Netlify, Render, etc.)
2. Use **Bubblewrap** (Google's official CLI for Trusted Web Activities) to wrap the PWA into a native Android app
3. Sign the resulting APK and ship it (sideload or Play Store)

The app stays a PWA — every code change you push to your deployment is immediately visible to all users. The APK is just a thin native wrapper that launches the PWA inside a Chrome Custom Tab.

---

## Prerequisites

- A **public HTTPS URL** of your deployed DEVKIT app (Bubblewrap will not work with `http://localhost`)
- A GitHub account (the Bubblewrap CLI uses your GitHub account by default)
- Java 17+ installed
- Android SDK (Bubblewrap will offer to install it for you on first run)
- Node.js 18+ and npm

---

## Step 1 — Deploy DEVKIT to a public HTTPS URL

The easiest option is Vercel:

```bash
# From the DEVKIT project root
npm i -g vercel
vercel
# Follow the prompts. Vercel auto-detects Next.js and runs the API routes server-side.
# You'll get a URL like https://devkit-xxxx.vercel.app
```

Or use Netlify, Render, Railway, or Fly.io — any host that runs Next.js in production mode works.

**Important:** Once you have the URL, set the `APP_PUBLIC_URL` env var on your hosting provider to that URL (so the OpenRouter `HTTP-Referer` header is correct, and the GitHub OAuth callback is built correctly).

---

## Step 2 — Verify the PWA manifest is reachable

```bash
# Replace with your real URL
curl https://your-deployment.example.com/devkit/manifest.json
```

You should see the manifest JSON with `name`, `short_name`, `icons`, `start_url`, `display: standalone`, etc. Bubblewrap reads this URL.

---

## Step 3 — Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

Verify the install:

```bash
bubblewrap --version
```

---

## Step 4 — Initialize the TWA project

```bash
mkdir devkit-twa && cd devkit-twa
bubblewrap init --manifest https://your-deployment.example.com/devkit/manifest.json
```

Bubblewrap will ask you a few questions:

| Field | Suggested value |
|-------|----------------|
| Application name | DEVKIT |
| Short name | DEVKIT |
| Package name | `com.nayoncodex.devkit` (must be reverse-domain format) |
| Starting URL | `/` (default) |
| Signing key | Generate new keystore (default for first run) |
| Display mode | `standalone` (default) |
| Orientation | `default` (or `portrait` if you want to lock the app to portrait) |
| Status bar color | `#0d0f1f` (matches DEVKIT's navy background) |
| Theme color | `#0d0f1f` |
| Navigation color | `#1a1f3a` |
| Navigation divider color | `#9b7cff` (purple) |
| Background color | `#0d0f1f` |
| Splash screen | Use the DEVKIT icon at `/devkit/icon-512.png` |

The CLI will create a complete Android project in the current directory.

---

## Step 5 — Build the APK

```bash
bubblewrap build
```

This will:
1. Compile the Android project
2. Sign the APK with the keystore you generated in Step 4
3. Output `app-release-signed.apk`

If you want an AAB (Android App Bundle, required for new Play Store submissions):

```bash
bubblewrap build --bundle
```

The output file will be in the project directory.

---

## Step 6 — Install on a phone (sideload)

```bash
# Connect your Android phone via USB with debugging enabled, then:
bubblewrap install
```

Or copy `app-release-signed.apk` to your phone manually and tap to install (you'll need to enable "Install from unknown sources" for your browser/file manager in Android settings).

---

## Step 7 — Publish to the Play Store (optional)

1. Go to https://play.google.com/console (one-time $25 registration fee)
2. Create a new application
3. Upload the signed `.aab` from Step 5
4. Fill in the store listing (use the screenshots from `docs/screenshots/` for store screenshots)
5. Submit for review

The TWA app will appear in the Play Store under your developer account.

---

## Step 8 — Update the app

To push an update to all APK users:

1. Make your code changes
2. Deploy to your hosting provider (e.g. `vercel --prod`)
3. Bump the version in `public/devkit/manifest.json` (recommended)
4. If you want to ship a new APK version that just bumps the versionCode, run `bubblewrap update` + `bubblewrap build` again

The app updates **automatically** every time a user opens it, because it's a PWA. The APK is only updated when you push a new versionCode.

---

## Troubleshooting

### "Unable to fetch manifest"
Make sure your deployment is publicly reachable and the manifest URL returns `application/json` content type.

### "Digital Asset Links verification failed"
Bubblewrap generates a `assetlinks.json` file at build time. You need to serve it at `https://your-deployment.example.com/.well-known/assetlinks.json`. If you used the default Bubblewrap flow, it will give you the exact file to put there.

### The app opens but shows a Chrome URL bar
This happens when Digital Asset Links verification fails. The app falls back to a "Chrome Custom Tab" instead of a true TWA. Verify `assetlinks.json` is served correctly.

### The QR Scanner doesn't work
The QR Scanner uses `getUserMedia` which requires HTTPS. Your deployed URL is HTTPS, so this should work. If it doesn't, check the browser console — the user might have denied camera permission.

### The AI section shows "not configured"
You didn't set `OPENROUTER_API_KEY` (or another provider env var) on your hosting provider's dashboard. Set it, redeploy, then hard-refresh the app.

---

## Summary

| Step | Command |
|------|---------|
| 1. Deploy DEVKIT | `vercel --prod` (or your host) |
| 2. Initialize TWA | `bubblewrap init --manifest <URL>/devkit/manifest.json` |
| 3. Build APK | `bubblewrap build` |
| 4. Build AAB (Play Store) | `bubblewrap build --bundle` |
| 5. Install on phone | `bubblewrap install` |
| 6. Update users | Push code → `vercel --prod`. APK only needs a new versionCode for new native version. |

That's the entire workflow. Once you've done it the first time, subsequent updates are fast — most updates don't even need an APK rebuild, just a redeploy of the PWA.
