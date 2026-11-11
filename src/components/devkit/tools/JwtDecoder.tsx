'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { decodeJwt } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null, warnings: [] as string[] };
    try {
      const r = decodeJwt(input);
      const out = JSON.stringify(
        {
          header: r.header,
          payload: r.payload,
          signature: r.signature + ' (NOT verified)',
        },
        null,
        2,
      );
      return { out, err: null, warnings: r.warnings };
    } catch (e) {
      return { out: '', err: (e as Error).message, warnings: [] };
    }
  }, [input]);

  return (
    <ToolShell title="JWT Decoder" description="Decode a JWT's header and payload. The signature is NOT verified — this tool only displays the contents.">
      <ToolInput value={input} onChange={setInput} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig" rows={6} onUpload={setInput} />
      {result.warnings.map((w, i) => (
        <div key={i} className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          ⚠ {w}
        </div>
      ))}
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="jwt-decoded.json" mime="application/json" />
      <HistorySaver toolId="jwt-decoder" input={input} output={result.out} />
    </ToolShell>
  );
}
