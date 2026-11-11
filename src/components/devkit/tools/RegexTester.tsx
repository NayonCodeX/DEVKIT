'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolError } from './ToolShell';
import { HistorySaver } from './HistorySaver';

export function RegexTester() {
  const [pattern, setPattern] = useState('\\b(\\w+)@(\\w+\\.\\w+)\\b');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('Contact: alice@example.com and bob@test.io for details.');

  const result = useMemo(() => {
    if (!pattern) return { matches: [] as { match: string; index: number; groups: string[] }[], count: 0, err: null };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const matches: { match: string; index: number; groups: string[] }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(input)) !== null) {
        matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return { matches, count: matches.length, err: null };
    } catch (e) {
      return { matches: [] as { match: string; index: number; groups: string[] }[], count: 0, err: (e as Error).message };
    }
  }, [pattern, flags, input]);

  // Use the error from the memo directly — no extra setState needed.
  const err = result.err;
  const highlighted = useMemo(() => {
    if (!pattern || err) return input;
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      return input.replace(re, (m) => `«${m}»`);
    } catch {
      return input;
    }
  }, [pattern, flags, input, err]);

  return (
    <ToolShell title="Regex Tester" description="Test JavaScript regex with flags. Matches are shown with their groups and highlighted in the input.">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">/</span>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="font-mono text-sm flex-1 min-w-[200px] border border-border rounded-md px-2 py-1.5 bg-card"
          placeholder="pattern"
        />
        <span className="text-sm font-medium">/</span>
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          className="font-mono text-sm w-20 border border-border rounded-md px-2 py-1.5 bg-card"
          placeholder="flags"
        />
      </div>
      <ToolInput value={input} onChange={setInput} placeholder="Test string..." rows={6} />
      <ToolError message={err} />
      <div>
        <div className="text-sm font-medium mb-1.5">Highlight (matches shown in «»)</div>
        <pre className="devkit-code whitespace-pre-wrap break-words">{highlighted}</pre>
      </div>
      <div>
        <div className="text-sm font-medium mb-1.5">Matches ({result.count})</div>
        {result.matches.length === 0 ? (
          <div className="text-sm text-muted-foreground">No matches.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {result.matches.map((m, i) => (
              <div key={i} className="border border-border rounded-md p-2 text-sm">
                <div className="font-mono">#{i + 1} · index {m.index} · "{m.match}"</div>
                {m.groups.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    groups: {m.groups.map((g, j) => `$${j + 1}="${g}"`).join('  ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <HistorySaver toolId="regex-tester" input={`${pattern}/${flags}\n${input}`} output={JSON.stringify(result.matches)} />
    </ToolShell>
  );
}
