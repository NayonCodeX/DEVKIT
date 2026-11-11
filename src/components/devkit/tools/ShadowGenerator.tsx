'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function ShadowGenerator() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(8);
  const [blur, setBlur] = useState(20);
  const [spread, setSpread] = useState(-4);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(30);
  const [inset, setInset] = useState(false);
  const { toast } = useToast();

  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const css = `box-shadow: ${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity / 100});`;

  return (
    <ToolShell title="CSS Shadow Generator" description="Build box-shadow visually and copy the CSS.">
      <div className="grid sm:grid-cols-2 gap-3">
        <Slider label="X offset" value={x} set={setX} min={-50} max={50} />
        <Slider label="Y offset" value={y} set={setY} min={-50} max={50} />
        <Slider label="Blur" value={blur} set={setBlur} min={0} max={100} />
        <Slider label="Spread" value={spread} set={setSpread} min={-50} max={50} />
        <div className="space-y-2">
          <label className="text-sm">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-md border border-border bg-card" />
        </div>
        <Slider label={`Opacity: ${opacity}%`} value={opacity} set={setOpacity} min={0} max={100} />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} /> Inset
        </label>
      </div>
      <div className="h-32 rounded-lg bg-card border border-border flex items-center justify-center text-foreground font-medium">
        Preview
      </div>
      <div style={{ boxShadow: `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity / 100})` }} className="h-32 rounded-lg bg-background border border-border" />
      <ToolOutput label="CSS" value={css} filename="shadow.css" mime="text/css" />
      <button onClick={async () => { await copyToClipboard(css); toast({ title: 'Copied' }); }} className="text-sm text-primary">Copy CSS</button>
    </ToolShell>
  );
}

function Slider({ label, value, set, min, max }: { label: string; value: number; set: (v: number) => void; min: number; max: number }) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}: {value}px</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} className="w-full" />
    </div>
  );
}
