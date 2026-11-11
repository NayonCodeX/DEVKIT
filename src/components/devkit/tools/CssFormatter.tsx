'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatCss } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function CssFormatter() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null };
    try {
      return { out: formatCss(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input]);
  return (
    <ToolShell title="CSS Formatter" description="Indent CSS rules consistently.">
      <ToolInput value={input} onChange={setInput} placeholder="body{margin:0;color:#fff;}" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.css" mime="text/css" />
      <HistorySaver toolId="css-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
