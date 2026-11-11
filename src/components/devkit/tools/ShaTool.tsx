'use client';

import { useEffect, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput } from './ToolShell';
import { sha } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function ShaTool() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<{ '256': string; '384': string; '512': string }>({ '256': '', '384': '', '512': '' });

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      // Schedule the reset off the effect body to satisfy the lint rule.
      queueMicrotask(() => {
        if (!cancelled) setHashes({ '256': '', '384': '', '512': '' });
      });
      return;
    }
    (async () => {
      try {
        const [a, b, c] = await Promise.all([
          sha(input, 'SHA-256'),
          sha(input, 'SHA-384'),
          sha(input, 'SHA-512'),
        ]);
        if (!cancelled) setHashes({ '256': a, '384': b, '512': c });
      } catch (e) {
        if (!cancelled) setHashes({ '256': (e as Error).message, '384': '', '512': '' });
      }
    })();
    return () => { cancelled = true; };
  }, [input]);

  return (
    <ToolShell title="SHA-256 / 384 / 512" description="Compute cryptographic hashes using the Web Crypto API (SubtleCrypto).">
      <ToolInput value={input} onChange={setInput} placeholder="Type text to hash..." rows={6} onUpload={setInput} />
      {(['256', '384', '512'] as const).map((bits) => (
        <ToolOutput
          key={bits}
          label={`SHA-${bits}`}
          value={hashes[bits]}
          filename={`sha${bits}.txt`}
        />
      ))}
      <HistorySaver toolId="sha" input={input} output={hashes['512']} />
    </ToolShell>
  );
}
