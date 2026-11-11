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
    let res: Response;
    if (stored.kind === 'gemini') {
      res = await fetch(`${meta.endpoint.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(meta.model)}:generateContent?key=${encodeURIComponent(stored.key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say OK.' }] }] }),
      });
    } else if (stored.kind === 'anthropic') {
      res = await fetch(`${meta.endpoint.replace(/\/$/, '')}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': stored.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: meta.model, max_tokens: 10, messages: [{ role: 'user', content: 'Say OK.' }] }),
      });
    } else if (stored.kind === 'openrouter') {
      res = await fetch(`${meta.endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stored.key}`,
          'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'https://devkit.app',
          'X-Title': 'DEVKIT',
        },
        body: JSON.stringify({ model: meta.model, max_tokens: 10, messages: [{ role: 'user', content: 'Say OK.' }] }),
      });
    } else {
      // openai + custom
      res = await fetch(`${meta.endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.key}` },
        body: JSON.stringify({ model: meta.model, max_tokens: 10, messages: [{ role: 'user', content: 'Say OK.' }] }),
      });
    }
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Upstream ${res.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    return NextResponse.json({ message: 'Connection successful.' });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
