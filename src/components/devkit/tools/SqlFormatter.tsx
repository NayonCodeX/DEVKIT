'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput, ToolError } from './ToolShell';
import { formatSql } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function SqlFormatter() {
  const [input, setInput] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { out: '', err: null };
    try {
      return { out: formatSql(input), err: null };
    } catch (e) {
      return { out: '', err: (e as Error).message };
    }
  }, [input]);
  return (
    <ToolShell title="SQL Formatter" description="Uppercase SQL keywords and add line breaks before clauses.">
      <ToolInput value={input} onChange={setInput} placeholder="select * from users where id = 1 order by name" rows={8} onUpload={setInput} />
      <ToolError message={result.err} />
      <ToolOutput value={result.out} filename="formatted.sql" mime="text/plain" />
      <HistorySaver toolId="sql-formatter" input={input} output={result.out} />
    </ToolShell>
  );
}
