// Fetch a file's content from a repository.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../oauth/callback/route';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = getSession(req.cookies.get('devkit_github_session')?.value ?? null);
  if (!s) return NextResponse.json({ error: 'Not connected to GitHub.' }, { status: 401 });

  const url = new URL(req.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');
  const path = url.searchParams.get('path');
  const ref = url.searchParams.get('ref') ?? undefined;
  if (!owner || !repo || !path) return NextResponse.json({ error: 'owner, repo, path required.' }, { status: 400 });

  try {
    const apiUrl = new URL(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`);
    if (ref) apiUrl.searchParams.set('ref', ref);
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `GitHub API ${res.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    const data = (await res.json()) as { content?: string; encoding?: string; size?: number };
    let content = '';
    if (data.content && data.encoding === 'base64') {
      // Decode UTF-8 safely
      const bin = atob(data.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      content = new TextDecoder().decode(bytes);
    }
    return NextResponse.json({ content, size: data.size });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
