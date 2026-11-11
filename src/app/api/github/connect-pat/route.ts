// Connect GitHub via Personal Access Token (PAT).
// This is an alternative to OAuth — useful for single-developer deployments
// that don't have a public callback URL.
//
// The browser POSTs { token } here. We validate it by calling the GitHub
// /user endpoint, and if it works, we create an HTTP-only session cookie
// that the other /api/github/* routes use.
//
// Token scopes recommended: repo (for committing) and read:user.
// Token is stored ONLY on the backend, never returned to the browser.

import { NextRequest, NextResponse } from 'next/server';
import { setPat } from '@/lib/devkit/github-pat-store';
import { setSession } from '../oauth/callback/route';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'A GitHub token is required (at least 10 characters).' }, { status: 400 });
  }
  const clean = token.trim();

  try {
    // Validate the token by fetching the authenticated user.
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${clean}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DEVKIT',
      },
    });
    if (res.status === 401) {
      return NextResponse.json({ error: 'Invalid or expired token (GitHub returned 401).' }, { status: 401 });
    }
    if (res.status === 403) {
      const body = (await res.json()) as { message?: string };
      return NextResponse.json(
        { error: `GitHub rejected the token (403): ${body.message ?? 'rate-limited or insufficient scope'}. Make sure the token has the "repo" and "read:user" scopes.` },
        { status: 403 },
      );
    }
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `GitHub API error ${res.status}: ${t.slice(0, 200)}` }, { status: 502 });
    }
    const u = (await res.json()) as { login: string; name: string | null; avatar_url: string };
    const user = { login: u.login, name: u.name ?? u.login, avatar: u.avatar_url ?? '' };

    // Create a session and set the cookie. We use the same session store
    // as the OAuth flow so all /api/github/* routes work the same way.
    const sid = setSession(clean, user);
    const resp = NextResponse.json({ ok: true, user });
    resp.cookies.set('devkit_github_session', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return resp;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
