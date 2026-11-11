'use client';

import { useEffect } from 'react';
import { useApp } from './store';
import type { AIProvider } from './types';

// Syncs env-registered AI providers (and any user-registered providers from
// previous sessions) from the backend into the client Zustand store. The
// browser only ever sees provider metadata — never the API keys.
//
// Safe to call from any section. It runs once per mount.
export function useSyncProviders() {
  const upsertProvider = useApp((s) => s.upsertProvider);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai/providers');
        if (!res.ok) return;
        const data = (await res.json()) as { providers: AIProvider[] };
        if (cancelled) return;
        for (const p of data.providers) {
          upsertProvider(p);
        }
      } catch {
        // backend unreachable — fine, offline tools still work
      }
    })();
    return () => { cancelled = true; };
  }, [upsertProvider]);
}
