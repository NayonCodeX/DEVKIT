// Commit & push a file to a repository.
// Workflow: fetch the current file's SHA (if it exists), then PUT the new content.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../oauth/callback/route';

export const runtime = 'nodejs';

interface CommitBody {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  message: string;
  content: string;
}

export async function POST(req: NextRequest) {
  const s = getSession(req.cookies.get('devkit_github_session')?.value ?? null);
  if (!s) return NextResponse.json({ error: 'Not connected to GitHub.' }, { status: 401 });

  let body: CommitBody;
  try {
    body = (await req.json()) as CommitBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.owner || !body.repo || !body.branch || !body.path || !body.message) {
    return NextResponse.json({ error: 'owner, repo, branch, path and message are required.' }, { status: 400 });
  }
  if (typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string.' }, { status: 400 });
  }

  try {
    // 1. Look up the branch SHA
    const branchRes = await fetch(`https://api.github.com/repos/${body.owner}/${body.repo}/branches/${encodeURIComponent(body.branch)}`, {
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!branchRes.ok) {
      const t = await branchRes.text();
      return NextResponse.json({ error: `Failed to load branch (${branchRes.status}): ${t.slice(0, 200)}` }, { status: 502 });
    }
    const branchData = (await branchRes.json()) as { commit: { sha: string } };

    // 2. Check if the file already exists (to set the `sha` field for update)
    let existingSha: string | undefined;
    const fileRes = await fetch(`https://api.github.com/repos/${body.owner}/${body.repo}/contents/${encodeURIComponent(body.path)}?ref=${encodeURIComponent(body.branch)}`, {
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as { sha?: string };
      existingSha = fileData.sha;
    }
    // 404 is fine — it means we're creating a new file.

    // 3. PUT the new content
    const putRes = await fetch(`https://api.github.com/repos/${body.owner}/${body.repo}/contents/${encodeURIComponent(body.path)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message,
        content: b64utf8(body.content),
        branch: body.branch,
        sha: existingSha,
      }),
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return NextResponse.json({ error: `Push failed (${putRes.status}): ${t.slice(0, 300)}` }, { status: 502 });
    }
    const putData = (await putRes.json()) as { commit: { sha: string; html_url: string } };
    return NextResponse.json({
      sha: putData.commit.sha,
      commitHtmlUrl: putData.commit.html_url,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

function b64utf8(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
