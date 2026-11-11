'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatYaml } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function YamlFormatter() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null };
    try {
      return { out: formatYaml(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input]);
  return (
    <ToolShell title="YAML Formatter" description="Normalize YAML whitespace and trailing newlines.">
      <ToolInput value={input} onChange={setInput} placeholder="key: value\nlist:\n  - a\n  - b" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.yaml" mime="text/yaml" />
      <HistorySaver toolId="yaml-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
