'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { randomString } from '@/lib/devkit/utils';
import { copyToClipboard } from '@/lib/devkit/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function RandomStringTool() {
  const [length, setLength] = useState(32);
  const [charset, setCharset] = useState('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  const [out, setOut] = useState('');
  const { toast } = useToast();

  function generate() {
    if (!charset) {
      setOut('');
      return;
    }
    setOut(randomString(Math.max(1, Math.min(4096, length)), charset));
  }

  return (
    <ToolShell title="Random String Generator" description="Generate cryptographically-secure random strings from a custom charset.">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Length</label>
          <input
            type="number"
            min={1}
            max={4096}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10) || 1)}
            className="mt-1 w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Charset</label>
          <textarea
            value={charset}
            onChange={(e) => setCharset(e.target.value)}
            rows={3}
            className="mt-1 w-full font-mono text-sm border border-border rounded-md px-2 py-1.5 bg-card"
          />
        </div>
        <Button onClick={generate}>Generate</Button>
      </div>
      <ToolOutput value={out} filename="random.txt" />
      {out && (
        <Button size="sm" variant="outline" onClick={async () => { const ok = await copyToClipboard(out); toast({ title: ok ? 'Copied!' : 'Copy failed' }); }}>
          Copy
        </Button>
      )}
    </ToolShell>
  );
}
