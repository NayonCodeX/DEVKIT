// GitHub Personal Access Token (PAT) store.
// Some users prefer PAT-based auth instead of OAuth (simpler to set up
// for a single developer). PATs are stored ONLY on the backend, like
// AI keys — never exposed to the browser after being set.

const pats = new Map<string, { token: string; login: string; name: string; avatar: string; setAt: number }>();

export function setPat(sessionId: string, token: string, user: { login: string; name: string; avatar: string }) {
  pats.set(sessionId, { token, login: user.login, name: user.name, avatar: user.avatar, setAt: Date.now() });
}

export function getPat(sessionId: string | null) {
  if (!sessionId) return null;
  return pats.get(sessionId) ?? null;
}

export function clearPat(sessionId: string | null) {
  if (sessionId) pats.delete(sessionId);
}
