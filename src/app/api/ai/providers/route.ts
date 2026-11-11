// List server-side provider metadata. This includes both:
//   - Providers registered by the user via /api/ai/providers/keys and /meta
//   - Providers auto-registered from environment variables (e.g. OPENROUTER_API_KEY)
// No API keys are ever returned — only the boolean `hasKey` flag.

import { NextResponse } from 'next/server';
import { listProviderMeta } from '@/lib/devkit/server-store';

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function GET() {
  const providers = listProviderMeta().map((p) => ({
    id: p.id,
    name: p.name,
    endpoint: p.endpoint,
    model: p.model,
    kind: p.kind,
    enabled: p.enabled,
    isDefault: p.isDefault,
    createdAt: p.createdAt,
    hasKey: p.hasKey,
    // Mark env-registered providers so the UI can show they come from the server env
    fromEnv: p.id.startsWith('env-'),
  }));
  return NextResponse.json({ providers });
}
