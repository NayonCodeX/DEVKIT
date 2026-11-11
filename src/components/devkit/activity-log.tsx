'use client';

import { useEffect, useState } from 'react';
import { activity } from '@/lib/devkit/db';
import type { ActivityEntry } from '@/lib/devkit/types';

export function ActivityLog() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    activity.list().then(setItems).catch(() => {});
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="space-y-1 max-h-60 overflow-auto">
      {items.slice(0, 20).map((a) => (
        <div key={a.id} className="text-xs flex items-start gap-2 p-1.5">
          <span className="text-muted-foreground tabular-nums">{new Date(a.createdAt).toLocaleTimeString()}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
