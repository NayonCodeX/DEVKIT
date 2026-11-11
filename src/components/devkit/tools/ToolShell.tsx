'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, Download, Upload, Star } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard, downloadText } from '@/lib/devkit/utils';
import { favorites } from '@/lib/devkit/db';
import { useApp } from '@/lib/devkit/store';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

interface ToolShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ToolShell({ title, description, children, actions }: ToolShellProps) {
  return (
    <div className="devkit-fade-in space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface ToolInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onUpload?: (text: string, filename: string) => void;
}

export function ToolInput({ label, value, onChange, placeholder, rows = 8, onUpload }: ToolInputProps) {
  const { toast } = useToast();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label ?? 'Input'}</label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const ok = await copyToClipboard(value);
              toast({ title: ok ? 'Copied!' : 'Copy failed' });
            }}
            disabled={!value}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
          {onUpload && (
            <Button size="sm" variant="ghost" asChild>
              <label className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const text = await f.text();
                    onUpload(text, f.name);
                    e.target.value = '';
                  }}
                />
              </label>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onChange('')} disabled={!value}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="font-mono text-sm leading-relaxed resize-y"
      />
    </div>
  );
}

interface ToolOutputProps {
  label?: string;
  value: string;
  filename?: string;
  mime?: string;
  placeholder?: string;
  pre?: boolean;
  children?: React.ReactNode;
}

export function ToolOutput({ label, value, filename = 'output.txt', mime = 'text/plain', placeholder, pre: isPre = true, children }: ToolOutputProps) {
  const { toast } = useToast();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label ?? 'Output'}</label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const ok = await copyToClipboard(value);
              toast({ title: ok ? 'Copied!' : 'Copy failed' });
            }}
            disabled={!value}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadText(filename, value, mime)} disabled={!value}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
        </div>
      </div>
      {children ?? (
        isPre ? (
          <pre className="devkit-code min-h-[8rem] max-h-[40rem] overflow-auto">
            {value || <span className="text-muted-foreground">{placeholder ?? 'Output will appear here...'}</span>}
          </pre>
        ) : (
          <div className="font-mono text-sm whitespace-pre-wrap break-words border border-border rounded-md p-3 min-h-[8rem] max-h-[40rem] overflow-auto bg-card">
            {value || <span className="text-muted-foreground">{placeholder ?? 'Output will appear here...'}</span>}
          </div>
        )
      )}
    </div>
  );
}

export function ToolError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function FavoriteButton({ toolId }: { toolId: string }) {
  const [active, setActive] = useState(false);
  const { toast } = useToast();
  async function refresh() {
    try {
      const has = await favorites.has(toolId);
      setActive(has);
    } catch {
      // ignore (no IndexedDB)
    }
  }
  refresh();
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={async () => {
        try {
          if (active) {
            await favorites.remove(toolId);
            setActive(false);
            toast({ title: 'Removed from favorites' });
          } else {
            await favorites.add(toolId);
            setActive(true);
            toast({ title: 'Added to favorites' });
          }
        } catch (e) {
          toast({ title: 'Failed to update favorites', description: (e as Error).message, variant: 'destructive' });
        }
      }}
    >
      <Star className={`h-3.5 w-3.5 mr-1 ${active ? 'fill-current' : ''}`} />
      {active ? 'Favorited' : 'Favorite'}
    </Button>
  );
}
