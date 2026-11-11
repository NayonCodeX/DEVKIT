'use client';

import { useMemo, useState } from 'react';
import { ToolShell } from './ToolShell';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '@/lib/devkit/utils';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function ColorConverter() {
  const [hex, setHex] = useState('#6366f1');
  const [r, setR] = useState(99);
  const [g, setG] = useState(102);
  const [b, setB] = useState(241);
  const [h, setH] = useState(239);
  const [s, setS] = useState(84);
  const [l, setL] = useState(67);
  const { toast } = useToast();

  const all = useMemo(() => {
    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
    };
  }, [hex, r, g, b, h, s, l]);

  function updateFromHex(v: string) {
    setHex(v);
    const rgb = hexToRgb(v);
    if (rgb) {
      setR(rgb.r); setG(rgb.g); setB(rgb.b);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setH(hsl.h); setS(hsl.s); setL(hsl.l);
    }
  }
  function updateFromRgb() {
    const newHex = rgbToHex(r, g, b);
    setHex(newHex);
    const hsl = rgbToHsl(r, g, b);
    setH(hsl.h); setS(hsl.s); setL(hsl.l);
  }
  function updateFromHsl() {
    const rgb = hslToRgb(h, s, l);
    setR(rgb.r); setG(rgb.g); setB(rgb.b);
    setHex(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  const swatchStyle = { background: all.hex, width: 64, height: 64, borderRadius: 12, border: '1px solid var(--border)' };

  return (
    <ToolShell title="HEX / RGB / HSL Converter" description="Convert between color formats. Update any field and the others stay in sync.">
      <div className="flex flex-wrap items-center gap-4">
        <div style={swatchStyle} />
        <div className="space-y-2 flex-1 min-w-[200px]">
          <div>
            <label className="text-xs text-muted-foreground">HEX</label>
            <div className="flex gap-2">
              <input value={hex} onChange={(e) => updateFromHex(e.target.value)} className="font-mono text-sm flex-1 border border-border rounded-md px-2 py-1.5 bg-card" />
              <button onClick={async () => { await copyToClipboard(hex); toast({ title: 'Copied' }); }} className="text-xs text-primary px-2">copy</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">RGB</label>
            <div className="flex gap-2 items-center">
              <input type="number" min={0} max={255} value={r} onChange={(e) => { setR(+e.target.value); setTimeout(updateFromRgb, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <input type="number" min={0} max={255} value={g} onChange={(e) => { setG(+e.target.value); setTimeout(updateFromRgb, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <input type="number" min={0} max={255} value={b} onChange={(e) => { setB(+e.target.value); setTimeout(updateFromRgb, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <button onClick={async () => { await copyToClipboard(all.rgb); toast({ title: 'Copied' }); }} className="text-xs text-primary px-2">copy</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">HSL</label>
            <div className="flex gap-2 items-center">
              <input type="number" min={0} max={360} value={h} onChange={(e) => { setH(+e.target.value); setTimeout(updateFromHsl, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <input type="number" min={0} max={100} value={s} onChange={(e) => { setS(+e.target.value); setTimeout(updateFromHsl, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <input type="number" min={0} max={100} value={l} onChange={(e) => { setL(+e.target.value); setTimeout(updateFromHsl, 0); }} className="w-16 font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card" />
              <button onClick={async () => { await copyToClipboard(all.hsl); toast({ title: 'Copied' }); }} className="text-xs text-primary px-2">copy</button>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
