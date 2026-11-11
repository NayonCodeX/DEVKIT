// Test an AI provider by sending a tiny hello prompt.

import { NextRequest, NextResponse } from 'next/server';
import { getKey, getProviderMeta } from '@/lib/devkit/server-store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { providerId } = (await req.json().catch(() => ({}))) as { providerId?: string };
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 });

  const meta = getProviderMeta(providerId);
  if (!meta) return NextResponse.json({ error: 'Provider not registered on backend.' }, { status: 404 });
  const stored = getKey(providerId);
  if (!stored) return NextResponse.json({ error: 'No API key set for this provider.' }, { status: 401 });

  try {
    const res = await fetch(`${meta.endpoint.replace(/\/$/, '')}/${stored.kind === 'gemini' ? 'v1beta/models/' + encodeURIComponent(meta.model) + ':generateContent' : (stored.kind === 'anthropic' ? 'v1/messages' : 'chat/completions')}${stored.kind === 'gemini' ? '?key=' + encodeURIComponent(stored.key) : ''}`, {
      method: 'POST',
      headers: stored.kind === 'anthropic'
        ? { 'Content-Type': 'application/json', 'x-api-key': stored.key, 'anthropic-version': '2023-06-01' }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.key}` },
      body: JSON.stringify(
        stored.kind === 'gemini'
          ? { contents: [{ role: 'user', parts: [{ text: 'Say OK.' }] }] }
          : stored.kind === 'anthropic'
            ? { model: meta.model, max_tokens: 10, messages: [{ role: 'user', content: 'Say OK.' }] }
            : { model: meta.model, max_tokens: 10, messages: [{ role: 'user', content: 'Say OK.' }] },
      ),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Upstream ${res.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    return NextResponse.json({ message: 'Connection successful.' });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
