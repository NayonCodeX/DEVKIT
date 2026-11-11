'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { generatePassword } from '@/lib/devkit/utils';
import { copyToClipboard } from '@/lib/devkit/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PasswordTool() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [out, setOut] = useState('');
  const { toast } = useToast();

  function generate() {
    setOut(generatePassword({ length, upper, lower, digits, symbols }));
  }

  const strength = (() => {
    if (!out) return 0;
    let s = 0;
    if (out.length >= 8) s++;
    if (out.length >= 12) s++;
    if (out.length >= 16) s++;
    if (/[a-z]/.test(out)) s++;
    if (/[A-Z]/.test(out)) s++;
    if (/[0-9]/.test(out)) s++;
    if (/[^a-zA-Z0-9]/.test(out)) s++;
    return Math.min(5, Math.floor(s / 1.5));
  })();

  const labels = ['—', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['bg-muted', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];

  return (
    <ToolShell title="Password Generator" description="Generate cryptographically-secure random passwords.">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Length: {length}</label>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> Lowercase
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} /> Digits
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Symbols
          </label>
        </div>
      </div>
      <Button onClick={generate}>Generate</Button>
      <ToolOutput value={out} filename="password.txt" />
      {out && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${colors[strength]}`} style={{ width: `${(strength / 5) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{labels[strength]}</span>
          </div>
          <Button size="sm" variant="outline" onClick={async () => { const ok = await copyToClipboard(out); toast({ title: ok ? 'Copied!' : 'Copy failed' }); }}>
            Copy password
          </Button>
        </div>
      )}
    </ToolShell>
  );
}
