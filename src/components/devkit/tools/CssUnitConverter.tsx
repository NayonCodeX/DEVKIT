'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolOutput, ToolError } from './ToolShell';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function CssUnitConverter() {
  const [value, setValue] = useState('16');
  const [unit, setUnit] = useState<'px' | 'rem' | 'em' | '%'>('px');
  const [root, setRoot] = useState(16);
  const [parent, setParent] = useState(1200);
  const { toast } = useToast();

  const result = useMemo(() => {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return { out: '', err: 'Enter a valid number.' };
    let px: number;
    if (unit === 'px') px = n;
    else if (unit === 'rem') px = n * root;
    else if (unit === 'em') px = n * root; // assume root for em base
    else px = (n / 100) * parent;
    const rem = px / root;
    const em = px / root;
    const pct = (px / parent) * 100;
    return {
      err: null,
      out: [
        `px:  ${px}`,
        `rem: ${rem}`,
        `em:  ${em}`,
        `%:   ${pct}  (of parent ${parent}px)`,
      ].join('\n'),
    };
  }, [value, unit, root, parent]);

  return (
    <ToolShell title="CSS Unit Converter" description="Convert between px, rem, em, and %.">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Value</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
        </div>
        <div>
          <label className="text-sm">From unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'px' | 'rem' | 'em' | '%')} className="mt-1 w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card">
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
            <option value="%">%</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Root font size (px)</label>
          <input type="number" value={root} onChange={(e) => setRoot(+e.target.value)} className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
        </div>
        <div>
          <label className="text-sm">Parent width for % (px)</label>
          <input type="number" value={parent} onChange={(e) => setParent(+e.target.value)} className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
        </div>
      </div>
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="units.txt" />
      <button onClick={async () => { await copyToClipboard(result.out); toast({ title: 'Copied' }); }} className="text-sm text-primary">Copy result</button>
    </ToolShell>
  );
}
