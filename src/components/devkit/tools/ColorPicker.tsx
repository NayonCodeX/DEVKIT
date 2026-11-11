'use client';

import { useState } from 'react';
import { ToolShell } from './ToolShell';
import { hexToRgb } from '@/lib/devkit/utils';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function ColorPicker() {
  const [color, setColor] = useState('#6366f1');
  const { toast } = useToast();
  const rgb = hexToRgb(color);

  return (
    <ToolShell title="Color Picker" description="Pick a color and copy in HEX, RGB, or HSL format.">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-32 w-32 rounded-lg border border-border bg-card cursor-pointer"
          aria-label="Pick color"
        />
        <div className="space-y-2 flex-1 min-w-[200px]">
          <Field label="HEX" value={color} onCopy={() => copyToClipboard(color)} />
          {rgb && (
            <>
              <Field label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} />
              <Field label="RGBA" value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`} onCopy={() => copyToClipboard(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`)} />
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );

  function Field({ label, value, onCopy }: { label: string; value: string; onCopy: () => Promise<void> }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12">{label}</span>
        <input readOnly value={value} className="font-mono text-sm flex-1 border border-border rounded-md px-2 py-1.5 bg-card" />
        <button
          onClick={async () => { await onCopy(); toast({ title: 'Copied' }); }}
          className="text-xs text-primary px-2"
        >copy</button>
      </div>
    );
  }
}
