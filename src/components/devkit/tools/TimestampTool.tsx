'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { copyToClipboard } from '@/lib/devkit/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HistorySaver } from './HistorySaver';

export function TimestampTool() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [unixInput, setUnixInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [isoInput, setIsoInput] = useState(() => new Date().toISOString());
  const { toast } = useToast();

  // Live ticking display
  const display = useMemo(() => {
    return {
      unixSec: Math.floor(Date.now() / 1000),
      unixMs: Date.now(),
      iso: new Date().toISOString(),
      local: new Date().toLocaleString(),
    };
  }, [now]);

  const unixToIso = useMemo(() => {
    if (!unixInput.trim()) return '';
    const n = parseInt(unixInput, 10);
    if (Number.isNaN(n)) return 'Invalid number';
    // Support both seconds and milliseconds
    const ms = String(unixInput).length > 10 ? n : n * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return 'Invalid date';
    return `${d.toISOString()}\n${d.toLocaleString()}`;
  }, [unixInput]);

  const isoToUnix = useMemo(() => {
    if (!isoInput.trim()) return '';
    const d = new Date(isoInput);
    if (isNaN(d.getTime())) return 'Invalid date';
    return `Unix (sec): ${Math.floor(d.getTime() / 1000)}\nUnix (ms):  ${d.getTime()}`;
  }, [isoInput]);

  return (
    <ToolShell title="Timestamp Converter" description="Convert between Unix epoch timestamps and human-readable time.">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">Current time</div>
          <Button size="sm" variant="ghost" onClick={() => setNow(Math.floor(Date.now() / 1000))}>Refresh</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm font-mono">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Unix (s):</span>
            <span>{display.unixSec}</span>
            <button onClick={async () => { await copyToClipboard(String(display.unixSec)); toast({ title: 'Copied' }); }} className="text-xs text-primary hover:underline">copy</button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Unix (ms):</span>
            <span>{display.unixMs}</span>
            <button onClick={async () => { await copyToClipboard(String(display.unixMs)); toast({ title: 'Copied' }); }} className="text-xs text-primary hover:underline">copy</button>
          </div>
          <div className="sm:col-span-2">{display.iso}</div>
          <div className="sm:col-span-2 text-muted-foreground">{display.local}</div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Unix timestamp → date</label>
        <input
          value={unixInput}
          onChange={(e) => setUnixInput(e.target.value)}
          className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card"
          placeholder="1697040000"
        />
      </div>
      <ToolOutput label="Result" value={unixToIso} filename="unix-to-iso.txt" />

      <div>
        <label className="text-sm font-medium">ISO date → Unix</label>
        <input
          value={isoInput}
          onChange={(e) => setIsoInput(e.target.value)}
          className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card"
          placeholder="2026-11-11T08:00:00Z"
        />
      </div>
      <ToolOutput label="Result" value={isoToUnix} filename="iso-to-unix.txt" />
      <HistorySaver toolId="timestamp" input={unixInput} output={unixToIso} />
    </ToolShell>
  );
}
