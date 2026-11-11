// Revoke GitHub session.

import { NextRequest, NextResponse } from 'next/server';
import { clearSession, getSession } from '../callback/route';

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get('devkit_github_session')?.value ?? null;
  const session = getSession(sid);
  if (session) {
    // Best-effort: tell GitHub to revoke this token. GitHub may or may not
    // honor the request depending on the token type and app configuration.
    try {
      const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
      if (clientId && clientSecret) {
        await fetch(`https://api.github.com/applications/${clientId}/token`, {
          method: 'DELETE',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            Accept: 'application/vnd.github+json',
          },
          body: JSON.stringify({ access_token: session.accessToken }),
        });
      }
    } catch {
      // ignore — we still clear locally
    }
  }
  clearSession(sid);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('devkit_github_session');
  return res;
}
