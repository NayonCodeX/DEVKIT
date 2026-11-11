'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/devkit/store';
import { AI_MODES, callAi, type AiMode } from '@/lib/devkit/ai-client';
import { aiHistory } from '@/lib/devkit/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Bot, Send, AlertTriangle, Settings, Trash2, Copy, History } from 'lucide-react';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';

export function AISection() {
  const providers = useApp((s) => s.providers);
  const setSection = useApp((s) => s.setSection);
  const lang = useApp((s) => s.settings.language);
  const [mode, setMode] = useState<AiMode>(AI_MODES[0]);
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; mode: string; prompt: string; response: string; status: string; createdAt: number }[]>([]);
  const { toast } = useToast();

  const defaultProvider = providers.find((p) => p.isDefault && p.enabled);
  const aiReady = !!defaultProvider && defaultProvider.hasKey;

  useEffect(() => {
    aiHistory.list().then(setHistory).catch(() => {});
  }, []);

  async function run() {
    if (!aiReady || !defaultProvider) {
      setError('AI is not configured. Add a provider with an API key in Settings → AI Providers.');
      return;
    }
    if (!prompt.trim() && !mode.needsCode) {
      setError('Please enter a prompt.');
      return;
    }
    if (mode.needsCode && !code.trim()) {
      setError('This mode requires code. Paste your code in the Code box.');
      return;
    }
    setRunning(true);
    setError(null);
    setOutput('');
    try {
      const userPrompt = mode.needsCode
        ? `${prompt}\n\nCODE:\n\`\`\`\n${code}\n\`\`\``
        : prompt;
      const res = await callAi({
        providerId: defaultProvider.id,
        mode: mode.id,
        systemPrompt: mode.systemPrompt,
        userPrompt,
      });
      if (res.ok) {
        setOutput(res.text);
        const entry = {
          id: crypto.randomUUID(),
          providerId: defaultProvider.id,
          providerName: defaultProvider.name,
          mode: mode.id,
          prompt: userPrompt.slice(0, 5000),
          response: res.text.slice(0, 20000),
          status: 'success' as const,
          createdAt: Date.now(),
        };
        await aiHistory.add(entry).catch(() => {});
        setHistory((h) => [{ ...entry, id: entry.id }, ...h].slice(0, 50));
      } else {
        setError(res.error ?? 'Unknown error');
        await aiHistory.add({
          id: crypto.randomUUID(),
          providerId: defaultProvider.id,
          providerName: defaultProvider.name,
          mode: mode.id,
          prompt: userPrompt.slice(0, 5000),
          response: '',
          status: 'error',
          error: res.error,
          createdAt: Date.now(),
        }).catch(() => {});
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-5xl mx-auto w-full space-y-4 devkit-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">AI is provided through a secure backend proxy — your API key never leaves the server.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSection('settings')}>
          <Settings className="h-4 w-4 mr-1" /> AI providers
        </Button>
      </div>

      {!aiReady && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-700 dark:text-amber-400">AI is not configured</div>
              <div className="text-sm text-muted-foreground">
                Add a provider (OpenAI, Gemini, Anthropic, or custom OpenAI-compatible endpoint) and set its API key in the backend environment to enable AI features.
                All offline tools continue working without AI.
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setSection('settings')}>
                Configure now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Mode</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {AI_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                  mode.id === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="font-medium leading-tight">{m.name}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{mode.description}</p>
        </CardContent>
      </Card>

      {mode.needsCode && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Code</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the code to analyze..."
              rows={8}
              spellCheck={false}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Prompt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode.placeholder ?? 'Enter your prompt...'}
            rows={4}
          />
          <div className="flex items-center gap-2">
            <Button onClick={run} disabled={running || !aiReady}>
              {running ? (
                <>
                  <Bot className="h-4 w-4 mr-1.5 animate-pulse" /> Running...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" /> Run
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => { setPrompt(''); setCode(''); setOutput(''); setError(null); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
            {defaultProvider && (
              <span className="text-xs text-muted-foreground ml-auto">
                Provider: <span className="font-medium text-foreground">{defaultProvider.name}</span> · model <code className="text-xs">{defaultProvider.model}</code>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Result</span>
              <button onClick={async () => { await copyToClipboard(output); toast({ title: 'Copied' }); }} className="text-xs text-primary">
                <Copy className="h-3.5 w-3.5 inline mr-1" />Copy
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_a]:text-primary">
              <FormattedOutput text={output} />
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5"><History className="h-4 w-4" /> Request history</span>
              <button
                onClick={async () => { await aiHistory.clear(); setHistory([]); }}
                className="text-xs text-destructive"
              >Clear all</button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-auto">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setOutput(h.response); setError(h.status === 'error' ? 'Previous request had an error.' : null); }}
                  className="block w-full text-left p-2 rounded-md hover:bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${h.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{AI_MODES.find((m) => m.id === h.mode)?.name ?? h.mode}</span>
                    <span className="text-muted-foreground">· {new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{h.prompt.slice(0, 200)}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Lightweight markdown-ish renderer (handles code blocks, bold, italics, headings)
function FormattedOutput({ text }: { text: string }) {
  // Split by code fences
  const parts = text.split(/```(\w*)\n?/);
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const prose = parts[i] ?? '';
    const lang = parts[i + 1] ?? '';
    const code = parts[i + 2] ?? '';
    if (prose) elements.push(<Prose key={`p${i}`} text={prose} />);
    if (code) elements.push(
      <pre key={`c${i}`} className="devkit-code my-2">
        {lang && <div className="text-xs text-muted-foreground mb-1">{lang}</div>}
        {code}
      </pre>,
    );
  }
  return <div>{elements}</div>;
}

function Prose({ text }: { text: string }) {
  // Very small: headings, bold, italic, line breaks
  const lines = text.split('\n');
  return (
    <>
      {lines.map((l, i) => {
        if (!l.trim()) return <div key={i} className="h-2" />;
        if (/^#{1,6}\s/.test(l)) {
          const level = l.match(/^#+/)![0].length;
          const content = l.replace(/^#+\s/, '');
          const Tag = (`h${Math.min(6, Math.max(1, level + 1))}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
          return <Tag key={i} className="font-semibold mt-2 mb-1">{content}</Tag>;
        }
        const html = l
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
}
