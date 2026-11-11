'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { htmlEntityEncode, htmlEntityDecode } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function HtmlEntityTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const result = useMemo(() => {
    if (!input) return { out: '', err: null };
    try {
      return { out: mode === 'encode' ? htmlEntityEncode(input) : htmlEntityDecode(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input, mode]);
  return (
    <ToolShell title="HTML Entity Encode / Decode" description="Escape & unescape &lt; &gt; &amp; &quot; &#39;.">
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
      <ToolInput value={input} onChange={setInput} placeholder={mode === 'encode' ? '<a href="x">Hi & bye</a>' : '&lt;a href=&quot;x&quot;&gt;Hi &amp; bye&lt;/a&gt;'} rows={6} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'} />
      <HistorySaver toolId="html-entity" input={input} output={result.out} />
    </ToolShell>
  );
}
