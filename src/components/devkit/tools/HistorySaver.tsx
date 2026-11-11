'use client';

import { Button } from '@/components/ui/button';
import { toolHistory } from '@/lib/devkit/db';

export function HistorySaver({ toolId, input, output }: { toolId: string; input: string; output: string }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        try {
          await toolHistory.add({
            id: crypto.randomUUID(),
            tool: toolId,
            input: input.slice(0, 5000),
            output: output.slice(0, 5000),
            createdAt: Date.now(),
          });
        } catch { /* ignore */ }
      }}
      disabled={!input && !output}
    >
      Save to history
    </Button>
  );
}
