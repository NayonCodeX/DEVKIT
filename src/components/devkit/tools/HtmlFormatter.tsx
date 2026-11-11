'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatXml } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function HtmlFormatter() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null };
    try {
      return { out: formatXml(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input]);
  return (
    <ToolShell title="HTML Formatter" description="Pretty-print HTML structure (basic indentation).">
      <ToolInput value={input} onChange={setInput} placeholder="<div><p>Hello</p></div>" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.html" mime="text/html" />
      <HistorySaver toolId="html-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
