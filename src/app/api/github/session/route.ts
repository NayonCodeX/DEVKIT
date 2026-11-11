// Get GitHub session status (no token is ever returned to the browser).

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../oauth/callback/route';

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get('devkit_github_session')?.value ?? null;
  const s = getSession(sid);
  if (!s) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true, user: s.user });
}
