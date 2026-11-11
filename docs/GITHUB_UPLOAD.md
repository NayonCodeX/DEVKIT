# GitHub Upload Guide — DEVKIT

Follow these steps exactly to publish DEVKIT on GitHub so anyone can download and run it.

---

## Step 1 — Create the GitHub repository

1. Open https://github.com/new in your browser.
2. **Repository name:** `devkit` (or any name you like).
3. **Description:** `DEVKIT — Build Smarter. Code Better. Professional developer toolkit + AI coding workspace.`
4. Set visibility: **Public** (so others can download) or **Private** (only you).
5. **DO NOT tick** any of these:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license

   (Your local repo already has all three, ticking them would create conflicts.)
6. Click **Create repository**.
7. GitHub shows you a page with URLs. Note the **HTTPS** URL — it looks like:
   `https://github.com/YOUR-USERNAME/devkit.git`

---

## Step 2 — Authenticate with GitHub

Pick **one** of these methods:

### Method A — Personal Access Token (simplest)
1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**.
3. Set a note like "DEVKIT push".
4. Expiration: 90 days (or whatever you want).
5. Tick scopes: `repo` (full repo access).
6. Generate. **Copy the token** (looks like `ghp_xxxxxxxxxxxxxx`). You will see it only once.
7. When you push in Step 3, GitHub will ask for your username and password — paste the **token** as the password.

### Method B — GitHub CLI (recommended if you push often)
```bash
# Install once:  https://cli.github.com/
gh auth login
```
Follow the prompts (HTTPS, login through browser).

---

## Step 3 — Connect and push

Open a terminal in your DEVKIT project folder, then run:

```bash
# Replace YOUR-USERNAME with your real GitHub username
git remote add origin https://github.com/YOUR-USERNAME/devkit.git

# First push (sends all 146 files + commit history)
git branch -M main
git push -u origin main
```

If you used a personal access token, you will be prompted for username + password. Paste the token as the password.

After the push finishes, refresh your GitHub repo page — you should see all the DEVKIT files.

---

## Step 4 — Add a GitHub release (so people can download as a ZIP)

1. Go to your repo page on GitHub.
2. Click **Releases** in the right sidebar → **Create a new release**.
3. **Choose a tag:** type `v1.0.0` then click *Create new tag: v1.0.0 on publish*.
4. **Release title:** `DEVKIT v1.0.0`
5. **Description:** paste this:
   ```
   # DEVKIT v1.0.0 — Build Smarter. Code Better.

   Professional mobile-first developer toolkit + AI coding workspace.

   ## Quick start
   1. Clone or download this repo
   2. `bun install` (or `npm install`)
   3. Copy `.env.example` to `.env.local` and fill in any AI/GitHub keys you want to use
   4. `bun run dev` and open http://localhost:3000

   See README.md for full setup and deployment instructions.
   ```
6. **Attach binaries:** none needed — users can also use the "Source code (zip)" / "Source code (tar.gz)" auto-generated links.
7. Click **Publish release**.

Now users have two download options on your repo page:
- The green **"Code"** button → Download ZIP
- The **Releases** page → `Source code (zip)` + `Source code (tar.gz)` + any extra files you attach

---

## Step 5 (optional) — Enable GitHub Pages for a live demo

⚠️ **Important:** GitHub Pages can only host **static files**. DEVKIT has backend API routes (AI proxy, GitHub OAuth) that need a Node.js server. GitHub Pages cannot run those.

For a static demo, you have two options:

### Option A — Deploy the frontend to Vercel (recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Vercel auto-detects Next.js and runs the API routes server-side
4. Done — you get a public URL like `https://devkit.vercel.app`

### Option B — Deploy to Netlify, Render, Railway, or Fly.io
Same idea — any host that runs Next.js in production mode will work.

After deploying, add the live URL to your GitHub repo's "About" section (top-right of the repo page → the gear icon → "Website").

---

## Step 6 — Verify it worked

After all of the above:
- Open your repo URL in an incognito window (logged out of GitHub).
- You should see: README.md rendered, the file tree, LICENSE, docs/ folder, etc.
- Click "Code → Download ZIP" — unzip it on another machine — `bun install && bun run dev` should work.
- Run this in the unzipped folder to confirm no secrets leaked:
  ```bash
  grep -rE "(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AIza[a-zA-Z0-9]{35})" .
  ```
  It should return nothing.

---

## What's in the repo (and what's NOT)

✅ **In the repo (safe):**
- All 30 developer tools (source)
- AI Assistant + AI Provider Manager (UI + secure backend proxy)
- GitHub OAuth backend routes
- Workspace + IndexedDB layer
- 5 themes + Bangla/English i18n
- PWA manifest, service worker, icons
- README.md, LICENSE (MIT), .env.example (no real secrets), docs/SECURITY.md, docs/TESTING.md

❌ **NOT in the repo (correctly excluded by .gitignore):**
- `.env` (local environment file with real keys)
- `node_modules/` (will be installed by `bun install`)
- `.next/` (build output)
- `db/custom.db` (local SQLite database)
- `.zscripts/` (sandbox-only helper scripts)
- `Caddyfile` (sandbox-only proxy config)
- `dev.log`, `server.log` (logs)
- `.claude`, `.z-ai-config`, `local-*` (local config)

---

## If something goes wrong

**Error: `fatal: remote origin already exists`**
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/devkit.git
```

**Error: `! [rejected] main -> main (fetch first)`**
Someone else pushed to the repo before you. Run:
```bash
git pull --rebase origin main
git push
```

**Error: `Permission denied (publickey)`**
You're using SSH but didn't add your key. Easiest fix: switch to HTTPS:
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/devkit.git
```

**Want to undo everything and start over**
```bash
# Remove the GitHub connection (does NOT delete the GitHub repo itself)
git remote remove origin
```

---

Need help? Open an issue on the DEVKIT repo after you publish it.
