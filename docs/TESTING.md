# DEVKIT — Testing checklist

This document is the manual test plan used during development. Replace with automated tests (Vitest + Testing Library) before scaling.

## 1. Navigation & shell
- [ ] App loads at `/` and renders the Home dashboard with the DEVKIT gradient title.
- [ ] Top nav contains 6 items (Home, Developer Tools, AI Assistant, Workspace, GitHub, Settings).
- [ ] On mobile (< 1024px), the hamburger menu opens a slide-in navigation drawer.
- [ ] On desktop (≥ 1024px), a horizontal nav bar appears below the header.
- [ ] Global search in the top bar filters tools by name and opens them on click.
- [ ] Notifications bell shows unread count; "Mark all read" clears it.
- [ ] Theme palette dropdown switches between the 5 themes instantly.

## 2. Theme switching
- [ ] Switching themes updates `document.documentElement.dataset.theme`.
- [ ] Selected theme persists across a full reload (no FOUC because of the pre-paint script in `layout.tsx`).
- [ ] All 5 themes (Premium Dark, Light, Midnight, Ocean, Purple) render with correct background, foreground, primary, and accent colors.

## 3. Language switching
- [ ] Settings → Language: switching to বাংলা updates all navigation labels and key UI strings (Home, Settings, etc.).
- [ ] Switching back to English restores the labels.
- [ ] Selection persists across reloads.

## 4. Tools — each must produce real output
- [ ] **JSON Formatter** — paste invalid JSON, see error with line:col; paste valid JSON, see Pretty and Minify outputs.
- [ ] **XML Formatter** — paste compact XML, see indented output.
- [ ] **HTML Formatter** — same.
- [ ] **CSS Formatter** — paste flat CSS, see indented rules.
- [ ] **JavaScript Formatter** — paste a one-liner, see line breaks after `;` and `{`.
- [ ] **YAML Formatter** — paste YAML, see normalized output.
- [ ] **SQL Formatter** — paste a flat query, see uppercased keywords and line breaks.
- [ ] **Markdown Preview** — type `# Heading` and `**bold**`, see rendered HTML and raw HTML output.
- [ ] **Base64** — encode "Hello" → `SGVsbG8=`; decode back to "Hello".
- [ ] **URL Encode/Decode** — encode a URL with spaces; decode back.
- [ ] **HTML Entity** — encode `<a>`; decode back.
- [ ] **JWT Decoder** — paste a JWT, see decoded header/payload, see ⚠ warning that signature is not verified.
- [ ] **Unicode Converter** — text → `\uXXXX` → back to text.
- [ ] **Hex Converter** — text → hex bytes → back to text.
- [ ] **SHA-256/384/512** — type text, see all three hashes computed via Web Crypto.
- [ ] **UUID Generator** — click Generate, get N UUIDs; verify they are RFC 4122 v4 format.
- [ ] **Password Generator** — adjust length/charset, generate, copy.
- [ ] **Random String** — set charset and length, generate.
- [ ] **Regex Tester** — type a regex, see matches highlighted in the input with their groups.
- [ ] **Timestamp Converter** — current Unix time shows; convert Unix → ISO and ISO → Unix.
- [ ] **HEX/RGB/HSL Converter** — change HEX, see RGB and HSL update; change HSL, see HEX update.
- [ ] **Color Picker** — pick a color, copy HEX/RGB.
- [ ] **Gradient Generator** — pick two colors and angle, see preview and CSS output.
- [ ] **Shadow Generator** — adjust sliders, see preview and CSS `box-shadow`.
- [ ] **Border Radius Generator** — adjust sliders, see preview and CSS.
- [ ] **CSS Unit Converter** — enter 16px with root 16, see rem=1, em=1, % of parent.
- [ ] **QR Code Generator** — type text, see a real QR code render; download PNG.
- [ ] **QR Scanner** — on a real device with camera, scan a QR; see the decoded text. On desktop without camera, see a clear error.
- [ ] **Text Diff Checker** — type two texts, see colored diff with +/− counts.
- [ ] **Word/Character Counter** — type text, see live word/char/line/sentence counts.

## 5. Workspace
- [ ] Create a new project — appears in the project list.
- [ ] Open the project — file tree empty.
- [ ] Create a file `index.html` — appears in the tree.
- [ ] Edit content; the "● unsaved" indicator appears.
- [ ] Save (button or Ctrl/Cmd+S) — indicator clears, version history entry added.
- [ ] Edit again, wait for auto-save — indicator clears automatically.
- [ ] Restore an old version — content reverts, "Save to commit" hint shows.
- [ ] Rename a file via the inline path input.
- [ ] Delete a file — confirm dialog; file disappears.
- [ ] Export project — downloads a `.devkit-project.json`.
- [ ] Import a project JSON — appears as "(imported)".
- [ ] Backup (full DB) — downloads `.json`.
- [ ] Delete all projects, then Restore backup — projects return.
- [ ] Reload the page — projects, files, and versions persist (IndexedDB).

## 6. AI Assistant
- [ ] Without any provider configured, opening AI shows a yellow "AI is not configured" banner with a "Configure now" button.
- [ ] Settings → AI Providers → Add: pick OpenAI, fill endpoint/model, paste key, save. Toast says "API key stored securely on backend".
- [ ] Default provider badge shows next to the provider name.
- [ ] Click "Test" — success toast if backend can reach the upstream; error toast otherwise.
- [ ] Back in AI section, banner is gone; provider name and model show.
- [ ] Pick "Code Generator", type "A function that returns the sum of two numbers", click Run — see generated code in the output area.
- [ ] Pick "Code Explainer", paste code in the Code box + a short prompt, click Run.
- [ ] Request history populates; click a history item to restore its output.

## 7. GitHub
- [ ] Without env vars configured, opening GitHub shows the "not configured" banner.
- [ ] With env vars set, clicking "Connect with GitHub" redirects to GitHub OAuth.
- [ ] After consent, the page reloads showing the connected user's login.
- [ ] Click "Refresh repositories" — list populates.
- [ ] Click a repo — branches load.
- [ ] Pick a branch, enter `README.md`, click Fetch — content loads.
- [ ] Edit content, type a commit message, click "Commit & Push" — success message with commit link.
- [ ] Click the link — opens the commit on github.com.
- [ ] Toggle the "Auto Push master switch" off and on.
- [ ] Disconnect — session cookie cleared, banner returns.

## 8. Settings & privacy
- [ ] All Settings cards render.
- [ ] Font-size slider updates editor text size.
- [ ] Tab-size slider updates `tabSize` style on the editor textarea.
- [ ] Auto-save toggle persists.
- [ ] Privacy / notifications toggles persist.
- [ ] About page shows: DEVKIT, Build Smarter. Code Better., Version 1.0.0, Developer Nayon Ahamed, Brand NCX / NayonCodeX.

## 9. PWA & offline
- [ ] Service worker registers (DevTools → Application → Service Workers).
- [ ] Lighthouse PWA audit passes basic installability checks.
- [ ] After first load, going offline and reloading still renders the app shell.
- [ ] Offline, all tools still work (they are pure client-side compute).
- [ ] Offline, AI section shows a clear error on submit (network fail).
- [ ] Offline, GitHub section shows clear errors (network fail).

## 10. Security checks
- [ ] DevTools → Application → Local Storage shows only `devkit-prefs` (no API key, no token).
- [ ] DevTools → Application → IndexedDB shows `devkit-db` with the 7 object stores; no key material in any record.
- [ ] DevTools → Network: AI requests go to `/api/ai/proxy`; the Request payload contains only `providerId`, `systemPrompt`, `userPrompt` — never a key.
- [ ] DevTools → Application → Cookies: after GitHub OAuth, `devkit_github_session` is `HttpOnly` and `SameSite=Lax`.
- [ ] The service worker's cache (DevTools → Application → Cache Storage) contains no `/api/*` responses.

## 11. Errors
- [ ] Open the app, open DevTools Console — no errors on initial load.
- [ ] Switch sections rapidly — no React warnings about state updates during render.
- [ ] Type invalid input into every tool — clear error messages, no exceptions in console.
