'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { HistorySaver } from './HistorySaver';

export function UnicodeConverter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const result = useMemo(() => {
    if (!input) return { out: '', err: null };
    try {
      if (mode === 'to') {
        return {
          out: Array.from(input).map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''),
          err: null,
        };
      } else {
        const out = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return { out, err: null };
      }
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input, mode]);
  return (
    <ToolShell title="Unicode Converter" description="Convert text ↔ \\uXXXX escape sequences.">
      <div className="flex gap-2">
        <button onClick={() => setMode('to')} className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'to' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>Text → Unicode</button>
        <button onClick={() => setMode('from')} className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'from' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>Unicode → Text</button>
      </div>
      <ToolInput value={input} onChange={setInput} placeholder={mode === 'to' ? 'Hello' : '\\u0048\\u0065\\u006c\\u006c\\u006f'} rows={6} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename={mode === 'to' ? 'unicode.txt' : 'text.txt'} />
      <HistorySaver toolId="unicode-converter" input={input} output={result.out} />
    </ToolShell>
  );
}
