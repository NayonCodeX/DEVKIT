'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { urlEncode, urlDecode } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function UrlEncodeTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const result = useMemo(() => {
    if (!input) return { out: '', err: null };
    try {
      return { out: mode === 'encode' ? urlEncode(input) : urlDecode(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input, mode]);
  return (
    <ToolShell title="URL Encode / Decode" description="encodeURIComponent / decodeURIComponent with safe + handling.">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('encode')}
          className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'encode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}
        >Encode</button>
        <button
          onClick={() => setMode('decode')}
          className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'decode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}
        >Decode</button>
      </div>
      <ToolInput value={input} onChange={setInput} placeholder={mode === 'encode' ? 'https://example.com/?q=hello world&x=1' : 'https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%20world%26x%3D1'} rows={6} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'} />
      <HistorySaver toolId="url-encode" input={input} output={result.out} />
    </ToolShell>
  );
}
