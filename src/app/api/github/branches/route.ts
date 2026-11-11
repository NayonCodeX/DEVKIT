// List branches for a repository.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../oauth/callback/route';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = getSession(req.cookies.get('devkit_github_session')?.value ?? null);
  if (!s) return NextResponse.json({ error: 'Not connected to GitHub.' }, { status: 401 });

  const url = new URL(req.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');
  if (!owner || !repo) return NextResponse.json({ error: 'owner and repo required.' }, { status: 400 });

  try {
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`, {
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `GitHub API ${res.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    const data = (await res.json()) as Array<{ name: string; protected: boolean }>;
    return NextResponse.json({ branches: data.map((b) => ({ name: b.name, protected: b.protected })) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
