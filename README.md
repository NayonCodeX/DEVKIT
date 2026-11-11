# DEVKIT — Build Smarter. Code Better.

A professional, mobile-first developer toolkit + AI coding workspace, built as a PWA-ready Next.js application.

- **Developer:** Nayon Ahmed
- **Brand credit:** NCX / NayonCodeX (About section only)
- **Version:** 1.0.0
- **Platform:** Mobile-first web app · PWA · Android-ready (TWA-able)

---

## Features

### Home Dashboard
Welcome section, global tool search, quick-access tools, recent projects, recent activity, favorites, AI shortcut, GitHub connection status (truthful — never faked), workspace overview, theme switcher, and in-app notifications.

### Developer Tools (all offline, all real)
**Code & Data:** JSON Formatter & Validator, XML Formatter, HTML Formatter, CSS Formatter, JavaScript Formatter, YAML Formatter, SQL Formatter, Markdown Preview.

**Encoding:** Base64 (UTF-8 safe), URL Encode/Decode, HTML Entity Encode/Decode, JWT Decoder (signature **not** verified — tool states this), Unicode Converter, Hex Converter.

**Security & Utilities:** SHA-256 / 384 / 512 (Web Crypto), UUID Generator (crypto.randomUUID), Secure Password Generator, Random String Generator, Regex Tester (live matches + highlight), Timestamp Converter.

**Design:** HEX / RGB / HSL Converter, Color Picker, Gradient Generator, CSS Shadow Generator, Border Radius Generator, CSS Unit Converter.

**Other:** QR Code Generator (real `qrcode` library), QR Scanner (real `jsqr` + camera), Text Diff Checker (line-based LCS), Word / Character Counter.

### AI Assistant
10 modes: Chat, Code Generator, Code Explainer, Code Reviewer, Bug Assistant, Code Fixer, Regex Builder, SQL Assistant, Documentation Generator, Code Translation Assistant. AI calls go through a secure backend proxy — the API key never leaves the server. When AI is not configured, every AI screen shows a clear configuration message. Offline tools continue working without AI.

### AI API Manager
Add / edit / delete providers (OpenAI, Gemini, Anthropic, or any OpenAI-compatible custom endpoint). Enable/disable, set default, test connection, revoke key, request history (per-request status). Keys are stored **only on the backend** (in-memory for the demo; production should use a real secret manager). The browser stores only metadata plus a boolean "has key" flag.

### Code Workspace & Project Manager
Create / open / delete projects. Create / rename / delete files and folders. Edit code in a touch-friendly textarea editor with tab-to-indent and Ctrl/Cmd+S to save. Auto-save with configurable delay. Find/Replace. IndexedDB persistence. File version history with restore. Project import/export (single JSON) and full backup/restore.

### GitHub Integration
Real OAuth flow via the backend. List authorized repositories, list branches, fetch file content, commit & push with the resulting commit URL shown. Auto-Push master switch with allowed-repo and allowed-branch lists, plus a `Protect main` confirmation gate. Tokens stored only server-side in an HTTP-only session cookie — never in browser localStorage or exposed to client code.

### Personalization & Settings
5 built-in themes (Premium Dark, Light, Midnight, Ocean, Purple) with `data-theme` attributes. Bangla + English language toggle. Font-size slider. Editor preferences (auto-save, tab size). AI and GitHub settings. Privacy controls. Backup/restore. About page.

### PWA & Offline
Web App Manifest, service worker (stale-while-revalidate for shell, network-first for navigation, cache-first for static assets, **no** caching of `/api/*` or any credential-bearing response). Installable on Android, iOS, and desktop. Offline shell works; AI and GitHub features require network and configuration.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Lucide · Zustand · IndexedDB
- **Backend:** Next.js API routes (Node runtime) — same deployment, no separate server process needed
- **PWA:** `public/devkit/manifest.json` + `public/devkit-sw.js`
- **Crypto:** Web Crypto (SubtleCrypto) for SHA-2, `crypto.randomUUID()` for UUIDs
- **QR:** `qrcode` (generation) + `jsqr` (scanning)

---

## Project structure

```
DEVKIT/
├── public/
│   ├── devkit/
│   │   ├── manifest.json
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-512-maskable.png
│   └── devkit-sw.js
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # main shell, navigation, routing
│   │   ├── globals.css          # themes + design system
│   │   └── api/
│   │       ├── ai/proxy/        # secure AI proxy
│   │       ├── ai/test/
│   │       ├── ai/providers/keys/
│   │       ├── ai/providers/meta/
│   │       ├── github/oauth/{start,callback,revoke}/
│   │       ├── github/session/
│   │       ├── github/repos/
│   │       ├── github/branches/
│   │       ├── github/file/
│   │       ├── github/commit/
│   │       └── health/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui (pre-existing)
│   │   └── devkit/
│   │       ├── sections/        # home, tools, ai, workspace, github, settings
│   │       ├── tools/           # 30 tool components + registry
│   │       ├── activity-log.tsx
│   │       └── (shared)
│   └── lib/
│       └── devkit/
│           ├── types.ts
│           ├── db.ts            # IndexedDB
│           ├── store.ts         # Zustand (localStorage for prefs only)
│           ├── i18n.ts          # Bangla + English
│           ├── utils.ts         # formatters, crypto, color, diff
│           ├── ai-client.ts    # browser-side AI helpers
│           └── server-store.ts # server-side key/session store
└── scripts/
    └── gen-icons.js             # PWA icon generator
```

---

## Setup (local development)

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env.local` and fill in only the providers you want to use. **Never commit** `.env.local` to git.

3. **Run the dev server**
   ```bash
   bun run dev
   ```

4. Open `http://localhost:3000` in your browser.

5. To set up an AI provider:
   - Open **Settings → AI Providers → Add**
   - Choose a kind (OpenAI / Gemini / Anthropic / custom)
   - Enter the endpoint and model
   - Paste your API key — it is sent to the backend once, stored in server memory, and never returned to the browser.

6. To set up GitHub:
   - Create a GitHub OAuth App at https://github.com/settings/developers
   - Set the callback URL to `http://localhost:3000/api/github/oauth/callback` (or your deployment URL)
   - Put the client id and secret in `.env.local`
   - Open **GitHub → Connect with GitHub**

---

## Deployment

### Frontend
The Next.js app (frontend + backend routes) is designed to be deployed as a single unit to any Node-compatible host. **GitHub Pages cannot run a Node.js backend** — do not attempt to deploy the AI proxy or GitHub OAuth there. Deploy to Vercel, Netlify (with functions), Render, Railway, Fly.io, or any container host that runs Next.js.

```bash
bun run build
bun run start
```

### Backend (separate hosting — optional)
If you prefer to split frontend and backend:
- Keep the routes under `src/app/api/*` as a separate Next.js project, or port them to a standalone Express/Fastify server.
- Update the frontend's `fetch()` calls to point to your backend's public base URL (do **not** keep API keys in frontend code).
- Configure CORS so only your deployed frontend origin can call the backend.

### Environment variables

Copy `.env.example` and fill in only what you need. See `.env.example` for the full list with no real secrets.

---

## Security

- API keys are **never** stored in browser localStorage or IndexedDB. They are sent once to the backend via HTTPS and held in server-side memory (demo) — production must use a secret manager or KMS-encrypted database.
- GitHub OAuth tokens are stored in an HTTP-only session cookie on the server side; the browser only sees a boolean "connected" status and the user's public profile.
- The service worker **never** caches `/api/*` responses or any request that could carry credentials.
- The JWT Decoder tool explicitly states that the signature is **not** verified.
- The QR Scanner requires HTTPS and a user-granted camera permission.
- Auto Push requires explicit opt-in, has allowed-repo and allowed-branch lists, protects `main` by default, and has an emergency OFF switch on the GitHub page and in Settings.
- Manual confirmation is required for every file deletion, version restore, and "main" branch push.

### Reporting a security issue
Please open a private advisory via GitHub Security Advisories rather than a public issue.

---

## Testing

A lightweight test plan is documented in `docs/TESTING.md`. Key flows verified during development:

- All 30 tools produce real output for valid input and clear errors for invalid input.
- Navigation between all 6 sections works on mobile and desktop.
- Theme switching updates the document `data-theme` and persists across reloads.
- Language switching updates UI labels (English ↔ Bangla).
- IndexedDB projects, files, versions persist across reloads.
- Backup export → wipe → backup import round-trips correctly.
- AI section shows the "not configured" banner until a provider with a key exists.
- GitHub section shows the "not configured" banner until env vars are set.
- Service worker registers and serves the offline shell.

Automated tests are minimal in this release — see `docs/TESTING.md` for the manual checklist. To add unit tests, the recommended setup is Vitest + Testing Library (not bundled here to keep the demo lean).

---

## Known limitations

- The backend key store is in-memory: keys are lost when the server restarts. For production, replace `src/lib/devkit/server-store.ts` with a durable secret backend.
- The GitHub session store is also in-memory. Same recommendation applies.
- QR Scanner requires `getUserMedia` (HTTPS only); on desktop testing without a camera, it will report an error rather than fake a scan.
- The JavaScript / CSS / XML / HTML / YAML formatters are intentionally lightweight (no full AST). For production-grade formatting, pipe through prettier locally.
- Monaco Editor is intentionally not included to keep the bundle small on low-powered Android phones; the workspace uses a touch-friendly textarea editor with tab-to-indent.
- Auto Push is implemented as a manual confirmation flow; full background auto-push requires a backend job queue (not included).
- The `.env.example` does not contain any real secrets.

---

## Android PWA installation

1. Open the deployed app in Chrome on Android.
2. Tap the menu (⋮) → **Add to Home screen** → **Install**.
3. The app launches as a standalone PWA. To package as a TWA (Trusted Web Activity) for the Play Store, use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) with this app's deployment URL.

---

## License

MIT © Nayon Ahmed (NCX / NayonCodeX). See `LICENSE`.
