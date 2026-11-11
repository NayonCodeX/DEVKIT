'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput } from './ToolShell';
import { lineDiff, type DiffLine } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function DiffChecker() {
  const [a, setA] = useState('hello world\nfoo bar\nline 3');
  const [b, setB] = useState('hello world\nfoo baz\nline 3\nline 4');
  const diff = useMemo<DiffLine[]>(() => lineDiff(a, b), [a, b]);
  const added = diff.filter((d) => d.type === 'add').length;
  const removed = diff.filter((d) => d.type === 'del').length;

  return (
    <ToolShell title="Text Diff Checker" description="Line-based diff between two texts. Green = added, red = removed.">
      <div className="grid sm:grid-cols-2 gap-3">
        <ToolInput label="Original" value={a} onChange={setA} rows={8} />
        <ToolInput label="Modified" value={b} onChange={setB} rows={8} />
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-emerald-600">+{added} added</span>
        <span className="text-red-600">−{removed} removed</span>
      </div>
      <div>
        <div className="text-sm font-medium mb-1.5">Diff</div>
        <pre className="devkit-code max-h-96">
          {diff.map((l, i) => {
            const cls = l.type === 'add' ? 'text-emerald-600' : l.type === 'del' ? 'text-red-600' : 'text-foreground';
            const sym = l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' ';
            return (
              <span key={i} className={cls + ' block'}>
                {sym} {l.text || ' '}
              </span>
            );
          })}
        </pre>
      </div>
      <HistorySaver toolId="diff-checker" input={a + '\n---\n' + b} output={diff.map((l) => `${l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '} ${l.text}`).join('\n')} />
    </ToolShell>
  );
}
