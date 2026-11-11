'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { b64encode, b64decode } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const result = useMemo(() => {
    if (!input) return { out: '', err: null };
    try {
      return { out: mode === 'encode' ? b64encode(input) : b64decode(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input, mode]);
  return (
    <ToolShell title="Base64 Encode / Decode" description="UTF-8 safe Base64 encoding and decoding.">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('encode')}
          className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'encode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}
        >
          Encode
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'decode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}
        >
          Decode
        </button>
      </div>
      <ToolInput value={input} onChange={setInput} placeholder={mode === 'encode' ? 'Hello, world!' : 'SGVsbG8sIHdvcmxkIQ=='} rows={6} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'} />
      <HistorySaver toolId="base64" input={input} output={result.out} />
    </ToolShell>
  );
}
