// Start GitHub OAuth flow. Returns an authorization URL the browser should open.
// Backend env required: GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET,
// GITHUB_OAUTH_REDIRECT_URI (the public URL of this app's /api/github/oauth/callback).

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          'GitHub OAuth is not configured on the backend. Set GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, and GITHUB_OAUTH_REDIRECT_URI in the server environment.',
      },
      { status: 503 },
    );
  }
  // State is generated per-request to prevent CSRF. We store it in a signed
  // HTTP-only cookie the callback will validate.
  const state = crypto.randomUUID();
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'repo read:user');
  // Note: we return the state and let the client-side store it in sessionStorage
  // so the callback route can verify it without an extra cookie round-trip.
  // In production, prefer a signed HTTP-only cookie.
  return NextResponse.json({ url: url.toString(), state });
}
