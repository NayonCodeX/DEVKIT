'use client';

import { useMemo, useState } from 'react';
import { ToolShell, ToolInput, ToolOutput } from './ToolShell';
import { markdownToHtml } from '@/lib/devkit/utils';
import { HistorySaver } from './HistorySaver';

export function MarkdownPreview() {
  const [input, setInput] = useState('# Hello\n\nThis is **bold** and *italic* and `code`.\n\n- item 1\n- item 2\n\n```js\nconsole.log("hi");\n```');
  const html = useMemo(() => markdownToHtml(input), [input]);
  return (
    <ToolShell title="Markdown Preview" description="Render a small subset of Markdown to HTML. Safe HTML only — raw HTML in input is escaped.">
      <ToolInput value={input} onChange={setInput} rows={10} />
      <div>
        <div className="text-sm font-medium mb-1.5">Preview</div>
        <div
          className="prose prose-sm max-w-none border border-border rounded-md p-4 bg-card min-h-[10rem] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <ToolOutput label="HTML Output" value={html} filename="preview.html" mime="text/html" />
      <HistorySaver toolId="markdown-preview" input={input} output={html} />
    </ToolShell>
  );
}
