# DEVKIT — Security model

## Threat model summary
DEVKIT is a developer toolkit where:
- Most tools are **pure client-side computation** and need no network at all.
- AI and GitHub features require **real external services** and must handle real credentials safely.
- The app is intended to be published on GitHub, so anything checked into the repo is **public**.

The following rules are enforced throughout the codebase.

## 1. Secrets never live in the frontend
- No API key, OAuth client secret, or token is hardcoded in any HTML, CSS, JS, JSON, or service worker file.
- No secret is stored in `localStorage`, `IndexedDB`, or a `sessionStorage` key.
- Secrets are kept only in server-side environment variables (`process.env.*`) and an in-memory server store (`src/lib/devkit/server-store.ts`). Production deployments must replace the in-memory store with a real secret manager (AWS Secrets Manager, HashiCorp Vault, Doppler) or a KMS-encrypted database row.

## 2. The browser cannot read a stored key back
- `POST /api/ai/providers/keys` stores a key on the backend. There is no `GET /api/ai/providers/keys` route — the browser cannot read a key back.
- The browser stores only metadata (name, endpoint, model, enabled, default) and a `hasKey` boolean in IndexedDB.
- Re-registering a provider without a new key keeps the existing key on the backend; the browser does not need to know it.

## 3. AI calls go through a backend proxy
- `POST /api/ai/proxy` receives `{ providerId, systemPrompt, userPrompt, context?, maxTokens? }`.
- The proxy resolves `providerId` → backend provider meta + stored key, then dispatches to the right provider (OpenAI / Gemini / Anthropic / custom OpenAI-compatible).
- The provider's raw response is streamed back as text. No credential is ever in the response.

## 4. GitHub OAuth tokens live in an HTTP-only session cookie
- `GET /api/github/oauth/start` returns the GitHub authorize URL.
- `GET /api/github/oauth/callback` exchanges the code for an access token and stores it server-side, keyed by a random session id. The session id is set as an HTTP-only `SameSite=Lax` cookie named `devkit_github_session`.
- All `/api/github/*` routes use the cookie to resolve the session server-side. The browser never sees the access token.
- `POST /api/github/oauth/revoke` clears the session and best-effort asks GitHub to revoke the token.

## 5. The service worker never caches sensitive responses
- The service worker ignores any URL starting with `/api/`. Those requests always go straight to the network.
- Only `/`, the manifest, the icons, `/_next/static/*`, and `/devkit/*` are cached.
- The cache does not store request bodies, headers, or cookies.

## 6. No fake success
- If AI is not configured, every AI screen shows a yellow banner explaining the situation. No silent failure.
- If GitHub env vars are not set, the GitHub section shows the configuration instructions. No fake "connected" status.
- The home dashboard shows "GitHub: not connected" until the session is real.
- The JWT Decoder tool explicitly warns that the signature is **not** verified.

## 7. Auto Push is opt-in and gated
- The master switch defaults to OFF.
- Even when ON, pushes go only to repositories listed in `githubAutoPushRepos` and only to branches listed in `githubAutoPushBranches`.
- `githubProtectMain` adds an extra confirmation before any push to `main`/`master`.
- Every push (manual or auto) is recorded via the in-app notifications system.

## 8. User data integrity
- File deletion in the Workspace asks for confirmation.
- Version restore asks for confirmation and auto-saves the current unsaved state first so the restore is recoverable.
- Project deletion cascades to its files but always with a confirmation prompt.

## 9. Input validation
- All API routes validate their input shape and return `400` with a clear message if missing/invalid.
- All tools validate their input locally and surface a clear error in the UI; no exceptions are silently swallowed.
- The Base64 decoder handles UTF-8 properly (no character corruption).
- The JWT decoder refuses non-3-part input with a clear error.

## 10. Logging
- API routes do not log request bodies or headers.
- API routes do not log full upstream responses (only short error slices up to 500 chars).

## Reporting
Open a private GitHub Security Advisory — do not open a public issue for security problems.
