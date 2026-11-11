// GitHub OAuth callback. Exchanges the code for an access token and stores
// it in server-side memory keyed by a session cookie. The browser is then
// redirected to the app root.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory session store (single-process demo). Production: use a real
// session store (Redis, signed JWT, or database-backed sessions).
const sessions = new Map<string, { accessToken: string; user: { login: string; name: string; avatar: string } }>();

export function setSession(token: string, user: { login: string; name: string; avatar: string }) {
  const sid = crypto.randomUUID();
  sessions.set(sid, { accessToken: token, user });
  return sid;
}
export function getSession(sid: string | null) {
  if (!sid) return null;
  return sessions.get(sid) ?? null;
}
export function clearSession(sid: string | null) {
  if (sid) sessions.delete(sid);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (error) return NextResponse.redirect(new URL('/?github_error=' + encodeURIComponent(error), url.origin));
  if (!code) return NextResponse.redirect(new URL('/?github_error=missing_code', url.origin));

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?github_error=server_not_configured', url.origin));
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?github_error=token_exchange_failed', url.origin));
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(new URL('/?github_error=' + encodeURIComponent(tokenData.error ?? 'no_token'), url.origin));
    }
    const accessToken = tokenData.access_token;
    // Fetch user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    let user = { login: 'unknown', name: '', avatar: '' };
    if (userRes.ok) {
      const u = (await userRes.json()) as { login: string; name: string; avatar_url: string };
      user = { login: u.login, name: u.name ?? u.login, avatar: u.avatar_url ?? '' };
    }
    const sid = setSession(accessToken, user);
    const res = NextResponse.redirect(new URL('/?github_connected=1', url.origin));
    res.cookies.set('devkit_github_session', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    return NextResponse.redirect(new URL('/?github_error=' + encodeURIComponent((e as Error).message), url.origin));
  }
}
