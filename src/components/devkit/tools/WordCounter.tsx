'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput } from './ToolShell';

export function WordCounter() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = (text.trim().match(/\S+/g) ?? []).length;
    const lines = text.split('\n').length;
    const sentences = (text.match(/[.!?]+(?:\s+|$)/g) ?? []).length || (text.trim() ? 1 : 0);
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { chars, charsNoSpaces, words, lines, sentences, paragraphs, readingTime };
  }, [text]);

  return (
    <ToolShell title="Word / Character Counter" description="Live counts of words, characters, lines, sentences and paragraphs.">
      <ToolInput value={text} onChange={setText} placeholder="Paste your text..." rows={10} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Words" value={stats.words} />
        <Stat label="Characters" value={stats.chars} />
        <Stat label="No spaces" value={stats.charsNoSpaces} />
        <Stat label="Lines" value={stats.lines} />
        <Stat label="Sentences" value={stats.sentences} />
        <Stat label="Paragraphs" value={stats.paragraphs} />
        <Stat label="Reading time" value={`${stats.readingTime} min`} />
      </div>
    </ToolShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
