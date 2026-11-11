'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatJs } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function JsFormatter() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null };
    try {
      return { out: formatJs(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input]);
  return (
    <ToolShell title="JavaScript Formatter" description="Basic JS indentation with line breaks after statements. For production-grade formatting, run prettier locally.">
      <ToolInput value={input} onChange={setInput} placeholder="const x = 1; if (x) { console.log(x); }" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.js" mime="text/javascript" />
      <HistorySaver toolId="js-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
