'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatXml } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function XmlFormatter() {
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
    <ToolShell title="XML Formatter" description="Pretty-print and indent XML documents.">
      <ToolInput value={input} onChange={setInput} placeholder="<root>\n  <item>...</item>\n</root>" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.xml" mime="application/xml" />
      <HistorySaver toolId="xml-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
