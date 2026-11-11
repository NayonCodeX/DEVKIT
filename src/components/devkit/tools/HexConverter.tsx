'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { HistorySaver } from './HistorySaver';

export function HexConverter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const result = useMemo(() => {
    if (!input) return { out: '', err: null };
    try {
      if (mode === 'to') {
        const bytes = new TextEncoder().encode(input);
        return { out: Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' '), err: null };
      } else {
        const clean = input.replace(/[^0-9a-fA-F]/g, '');
        if (clean.length % 2 !== 0) throw new Error('Hex input must have an even number of digits.');
        const bytes = new Uint8Array(clean.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        return { out: new TextDecoder('utf-8', { fatal: false }).decode(bytes), err: null };
      }
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input, mode]);
  return (
    <ToolShell title="Hex Converter" description="Convert text ↔ hexadecimal bytes (UTF-8).">
      <div className="flex gap-2">
        <button onClick={() => setMode('to')} className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'to' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>Text → Hex</button>
        <button onClick={() => setMode('from')} className={`px-3 py-1.5 text-sm rounded-md border ${mode === 'from' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>Hex → Text</button>
      </div>
      <ToolInput value={input} onChange={setInput} placeholder={mode === 'to' ? 'Hello' : '48 65 6c 6c 6f'} rows={6} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename={mode === 'to' ? 'hex.txt' : 'text.txt'} />
      <HistorySaver toolId="hex-converter" input={input} output={result.out} />
    </ToolShell>
  );
}
