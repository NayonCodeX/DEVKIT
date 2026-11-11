'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function BorderRadiusGenerator() {
  const [tl, setTl] = useState(16);
  const [tr, setTr] = useState(16);
  const [br, setBr] = useState(16);
  const [bl, setBl] = useState(16);
  const [unit, setUnit] = useState<'px' | '%' | 'rem'>('px');
  const { toast } = useToast();

  const all = `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
  const css = `border-radius: ${all};`;

  return (
    <ToolShell title="Border Radius Generator" description="Adjust each corner and copy the CSS.">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Slider label="Top-left" value={tl} set={setTl} />
          <Slider label="Top-right" value={tr} set={setTr} />
          <Slider label="Bottom-right" value={br} set={setBr} />
          <Slider label="Bottom-left" value={bl} set={setBl} />
          <div className="space-y-1">
            <label className="text-sm">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as 'px' | '%' | 'rem')} className="border border-border rounded-md px-2 py-1.5 text-sm bg-card">
              <option value="px">px</option>
              <option value="%">%</option>
              <option value="rem">rem</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div
            className="h-40 w-40 bg-primary text-primary-foreground flex items-center justify-center font-medium"
            style={{ borderRadius: all }}
          >
            Preview
          </div>
        </div>
      </div>
      <ToolOutput label="CSS" value={css} filename="border-radius.css" mime="text/css" />
      <button onClick={async () => { await copyToClipboard(css); toast({ title: 'Copied' }); }} className="text-sm text-primary">Copy CSS</button>
    </ToolShell>
  );
}

function Slider({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}: {value}</label>
      <input type="range" min={0} max={100} value={value} onChange={(e) => set(+e.target.value)} className="w-full" />
    </div>
  );
}
