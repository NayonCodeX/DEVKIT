// List authorized repositories for the authenticated GitHub user.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../oauth/callback/route';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sid = req.cookies.get('devkit_github_session')?.value ?? null;
  const s = getSession(sid);
  if (!s) return NextResponse.json({ error: 'Not connected to GitHub.' }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') ?? '50', 10)));

  try {
    const res = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`, {
      headers: {
        Authorization: `Bearer ${s.accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `GitHub API ${res.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    const data = (await res.json()) as Array<{
      full_name: string;
      description: string | null;
      private: boolean;
    }>;
    return NextResponse.json({
      repos: data.map((r) => ({ fullName: r.full_name, description: r.description, private: r.private })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
