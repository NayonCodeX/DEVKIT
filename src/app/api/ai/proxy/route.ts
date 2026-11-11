// Secure AI proxy: receives providerId + prompt from the browser, looks up
// the stored API key on the backend, calls the provider, returns the text.
// The browser never sees the API key.

import { NextRequest, NextResponse } from 'next/server';
import { getKey, getProviderMeta } from '@/lib/devkit/server-store';

export const runtime = 'nodejs';

interface ProxyBody {
  providerId: string;
  systemPrompt: string;
  userPrompt: string;
  context?: string;
  maxTokens?: number;
}

export async function POST(req: NextRequest) {
  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.providerId || !body.userPrompt) {
    return NextResponse.json({ error: 'providerId and userPrompt are required.' }, { status: 400 });
  }

  const meta = getProviderMeta(body.providerId);
  if (!meta) {
    return NextResponse.json({ error: 'Provider not found on backend. Re-save it in Settings to register it server-side.' }, { status: 404 });
  }
  if (!meta.enabled) {
    return NextResponse.json({ error: 'Provider is disabled.' }, { status: 400 });
  }

  const stored = getKey(body.providerId);
  if (!stored) {
    return NextResponse.json({ error: 'No API key set for this provider on the backend. Add one in Settings → AI Providers.' }, { status: 401 });
  }

  try {
    const result = await dispatchToProvider({
      kind: stored.kind,
      endpoint: meta.endpoint,
      model: meta.model,
      apiKey: stored.key,
      systemPrompt: body.systemPrompt,
      userPrompt: body.userPrompt,
      context: body.context,
      maxTokens: body.maxTokens,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

interface DispatchArgs {
  kind: 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'custom';
  endpoint: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  context?: string;
  maxTokens?: number;
}

async function dispatchToProvider(args: DispatchArgs): Promise<{ text: string; usage?: unknown }> {
  if (args.kind === 'gemini') return callGemini(args);
  if (args.kind === 'anthropic') return callAnthropic(args);
  if (args.kind === 'openrouter') return callOpenRouter(args);
  return callOpenAICompatible(args); // openai + custom
}

async function callOpenAICompatible(args: DispatchArgs): Promise<{ text: string; usage?: unknown }> {
  const url = `${args.endpoint.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
      max_tokens: args.maxTokens ?? 1500,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstream ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, usage: data.usage };
}

// OpenRouter uses the OpenAI-compatible chat/completions endpoint, but
// recommends (and for some free models requires) the HTTP-Referer and
// X-Title headers so it can attribute usage to your app.
async function callOpenRouter(args: DispatchArgs): Promise<{ text: string; usage?: unknown }> {
  const url = `${args.endpoint.replace(/\/$/, '')}/chat/completions`;
  // OpenRouter free reasoning models (e.g. nvidia/nemotron-3.5-lightning:free)
  // spend a lot of tokens on internal reasoning. The default 1500-token cap
  // is often consumed entirely by reasoning, leaving an empty visible response.
  // We bump to 2500 by default unless the caller asked for more.
  const maxTokens = args.maxTokens ?? 2500;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
      'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'https://devkit.app',
      'X-Title': 'DEVKIT',
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstream ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, usage: data.usage };
}

async function callGemini(args: DispatchArgs): Promise<{ text: string; usage?: unknown }> {
  // Gemini generateContent endpoint
  const url = `${args.endpoint.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
  const contents = [
    { role: 'user', parts: [{ text: args.systemPrompt ? `${args.systemPrompt}\n\n${args.userPrompt}` : args.userPrompt }] },
  ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstream ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') ?? '';
  return { text, usage: data.usageMetadata };
}

async function callAnthropic(args: DispatchArgs): Promise<{ text: string; usage?: unknown }> {
  const url = `${args.endpoint.replace(/\/$/, '')}/v1/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens ?? 1500,
      system: args.systemPrompt,
      messages: [{ role: 'user', content: args.userPrompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upstream ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.content?.map((c: { text: string }) => c.text).join('') ?? '';
  return { text, usage: data.usage };
}
