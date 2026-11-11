'use client';

import { useState } from 'react';
import { ToolShell, ToolOutput } from './ToolShell';
import { uuidv4 } from '@/lib/devkit/utils';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function UuidTool() {
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [list, setList] = useState<string[]>([]);

  function generate() {
    const n = Math.max(1, Math.min(1000, count));
    const arr = Array.from({ length: n }, () => {
      let s = uuidv4();
      if (!hyphens) s = s.replace(/-/g, '');
      if (uppercase) s = s.toUpperCase();
      return s;
    });
    setList(arr);
  }

  return (
    <ToolShell title="UUID Generator" description="Generate cryptographically-secure RFC 4122 v4 UUIDs using crypto.randomUUID().">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Count</label>
        <input
          type="number"
          min={1}
          max={1000}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
          className="w-24 border border-border rounded-md px-2 py-1 text-sm bg-card"
        />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} /> Uppercase
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} /> Hyphens
        </label>
        <Button onClick={generate}>Generate</Button>
      </div>
      <ToolOutput
        value={list.join('\n')}
        filename="uuids.txt"
        placeholder="Click Generate to create UUIDs"
      />
      <CopyAllButton list={list} />
    </ToolShell>
  );
}

function CopyAllButton({ list }: { list: string[] }) {
  const { toast } = useToast();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const ok = await copyToClipboard(list.join('\n'));
        toast({ title: ok ? 'Copied!' : 'Copy failed' });
      }}
      disabled={list.length === 0}
    >
      Copy all
    </Button>
  );
}
