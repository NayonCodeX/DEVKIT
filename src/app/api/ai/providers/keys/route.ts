// Receive & store (or delete) AI provider API keys.
// Keys are held only in server memory and NEVER returned to the client.

import { NextRequest, NextResponse } from 'next/server';
import { setKey, deleteKey, setProviderMeta } from '@/lib/devkit/server-store';
import type { AIProvider } from '@/lib/devkit/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    providerId?: string;
    kind?: 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'custom';
    key?: string;
    meta?: AIProvider;
  };
  if (!body.providerId || !body.kind || !body.key) {
    return NextResponse.json({ error: 'providerId, kind and key are required.' }, { status: 400 });
  }
  // Strip whitespace and validate basic shape.
  const key = body.key.trim();
  if (key.length < 8) {
    return NextResponse.json({ error: 'API key looks too short to be valid.' }, { status: 400 });
  }
  setKey(body.providerId, body.kind, key);
  if (body.meta) setProviderMeta(body.meta);

  return NextResponse.json({ ok: true, message: 'Key stored on backend. It will not be returned to the browser.' });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const providerId = url.searchParams.get('providerId');
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 });
  deleteKey(providerId);
  return NextResponse.json({ ok: true });
}
