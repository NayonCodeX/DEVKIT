// Health check endpoint.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'devkit-backend',
    version: '1.0.0',
    aiConfigured: !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
    githubConfigured: !!(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET),
  });
}
