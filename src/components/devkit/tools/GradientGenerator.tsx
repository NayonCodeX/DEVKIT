'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function GradientGenerator() {
  const [c1, setC1] = useState('#6366f1');
  const [c2, setC2] = useState('#22d3ee');
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const { toast } = useToast();

  const css =
    type === 'linear'
      ? `linear-gradient(${angle}deg, ${c1}, ${c2})`
      : `radial-gradient(circle, ${c1}, ${c2})`;

  return (
    <ToolShell title="Gradient Generator" description="Build CSS gradients visually and copy the CSS.">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm">Start color</label>
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="w-full h-10 rounded-md border border-border bg-card" />
        </div>
        <div className="space-y-2">
          <label className="text-sm">End color</label>
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="w-full h-10 rounded-md border border-border bg-card" />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'linear' | 'radial')} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </div>
        {type === 'linear' && (
          <div className="space-y-2">
            <label className="text-sm">Angle: {angle}°</label>
            <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full" />
          </div>
        )}
      </div>
      <div className="h-40 rounded-lg border border-border" style={{ background: css }} />
      <ToolOutput label="CSS" value={`background: ${css};`} filename="gradient.css" mime="text/css" />
      <button onClick={async () => { await copyToClipboard(`background: ${css};`); toast({ title: 'Copied' }); }} className="text-sm text-primary">Copy CSS</button>
    </ToolShell>
  );
}
