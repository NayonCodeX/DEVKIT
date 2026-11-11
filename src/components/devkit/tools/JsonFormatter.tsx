'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { Button } from '@/components/ui/button';
import { formatJson, minifyJson, validateJson } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [mode, setMode] = useState<'pretty' | 'minify'>('pretty');

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: null };
    const v = validateJson(input);
    if (!v.ok) {
      const pos = v.pos ? ` (line ${v.pos.line}, col ${v.pos.col})` : '';
      return { output: '', error: `Invalid JSON: ${v.error}${pos}` };
    }
    try {
      const out = mode === 'pretty' ? formatJson(input, indent) : minifyJson(input);
      return { output: out, error: null };
    } catch (e) {
      return { output: '', error: (e as Error).message };
    }
  }, [input, indent, mode]);

  return (
    <ToolShell title="JSON Formatter & Validator" description="Pretty-print, minify, and validate JSON. All parsing happens in your browser.">
      <ToolInput
        value={input}
        onChange={(v) => setInput(v)}
        placeholder={'{\n  "hello": "world",\n  "items": [1, 2, 3]\n}'}
        rows={8}
        onUpload={(t) => setInput(t)}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" variant={mode === 'pretty' ? 'default' : 'outline'} onClick={() => setMode('pretty')}>
          Pretty
        </Button>
        <Button size="sm" variant={mode === 'minify' ? 'default' : 'outline'} onClick={() => setMode('minify')}>
          Minify
        </Button>
        <label className="text-xs text-muted-foreground ml-2">Indent</label>
        <select
          value={indent}
          onChange={(e) => setIndent(parseInt(e.target.value, 10))}
          className="border border-border rounded-md px-2 py-1 text-sm bg-card"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={0}>Tab</option>
        </select>
      </div>
      <ToolError message={result.error} />
      {!result.error && input.trim() && (
        <div className="text-xs text-emerald-600">✓ Valid JSON</div>
      )}
      <ToolOutput value={result.output} filename="formatted.json" mime="application/json" />
      <HistorySaver toolId="json-formatter" input={input} output={result.output} />
    </ToolShell>
  );
}

