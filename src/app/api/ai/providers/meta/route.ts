// Register provider metadata on the backend (name, endpoint, model, kind).
// The actual API key is set via /api/ai/providers/keys separately.
// We need this server-side record so the proxy can resolve providerId -> endpoint/model.

import { NextRequest, NextResponse } from 'next/server';
import { setProviderMeta } from '@/lib/devkit/server-store';
import type { AIProvider } from '@/lib/devkit/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const meta = (await req.json().catch(() => null)) as AIProvider | null;
  if (!meta || !meta.id) return NextResponse.json({ error: 'Provider meta required' }, { status: 400 });
  setProviderMeta(meta);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Don't leak any keys; just return ids and metadata.
  const list = Array.from((await import('@/lib/devkit/server-store')).listProviderMeta()).map((p) => ({
    id: p.id, name: p.name, endpoint: p.endpoint, model: p.model, kind: p.kind, enabled: p.enabled,
  }));
  return NextResponse.json({ providers: list });
}
