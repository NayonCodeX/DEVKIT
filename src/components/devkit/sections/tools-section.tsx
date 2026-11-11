'use client';

import { useMemo, useState, useEffect } from 'react';
import { TOOL_REGISTRY, type ToolCategory, type ToolDef } from '@/components/devkit/tools/registry';
import { useApp } from '@/lib/devkit/store';
import { Input } from '@/components/ui/input';
import { Search, Star, ArrowLeft } from 'lucide-react';
import { favorites } from '@/lib/devkit/db';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/devkit/tools/ToolShell';
import { activity } from '@/lib/devkit/db';

// All tool components — lazy imports not needed; we'll keep them eager for reliability.
import { JsonFormatter } from '@/components/devkit/tools/JsonFormatter';
import { XmlFormatter } from '@/components/devkit/tools/XmlFormatter';
import { HtmlFormatter } from '@/components/devkit/tools/HtmlFormatter';
import { CssFormatter } from '@/components/devkit/tools/CssFormatter';
import { JsFormatter } from '@/components/devkit/tools/JsFormatter';
import { YamlFormatter } from '@/components/devkit/tools/YamlFormatter';
import { SqlFormatter } from '@/components/devkit/tools/SqlFormatter';
import { MarkdownPreview } from '@/components/devkit/tools/MarkdownPreview';
import { Base64Tool } from '@/components/devkit/tools/Base64Tool';
import { UrlEncodeTool } from '@/components/devkit/tools/UrlEncodeTool';
import { HtmlEntityTool } from '@/components/devkit/tools/HtmlEntityTool';
import { JwtDecoder } from '@/components/devkit/tools/JwtDecoder';
import { UnicodeConverter } from '@/components/devkit/tools/UnicodeConverter';
import { HexConverter } from '@/components/devkit/tools/HexConverter';
import { ShaTool } from '@/components/devkit/tools/ShaTool';
import { UuidTool } from '@/components/devkit/tools/UuidTool';
import { PasswordTool } from '@/components/devkit/tools/PasswordTool';
import { RandomStringTool } from '@/components/devkit/tools/RandomStringTool';
import { RegexTester } from '@/components/devkit/tools/RegexTester';
import { TimestampTool } from '@/components/devkit/tools/TimestampTool';
import { ColorConverter } from '@/components/devkit/tools/ColorConverter';
import { ColorPicker } from '@/components/devkit/tools/ColorPicker';
import { GradientGenerator } from '@/components/devkit/tools/GradientGenerator';
import { ShadowGenerator } from '@/components/devkit/tools/ShadowGenerator';
import { BorderRadiusGenerator } from '@/components/devkit/tools/BorderRadiusGenerator';
import { CssUnitConverter } from '@/components/devkit/tools/CssUnitConverter';
import { QrGenerator } from '@/components/devkit/tools/QrGenerator';
import { QrScanner } from '@/components/devkit/tools/QrScanner';
import { DiffChecker } from '@/components/devkit/tools/DiffChecker';
import { WordCounter } from '@/components/devkit/tools/WordCounter';

const COMPONENTS: Record<string, React.ComponentType> = {
  'json-formatter': JsonFormatter,
  'xml-formatter': XmlFormatter,
  'html-formatter': HtmlFormatter,
  'css-formatter': CssFormatter,
  'js-formatter': JsFormatter,
  'yaml-formatter': YamlFormatter,
  'sql-formatter': SqlFormatter,
  'markdown-preview': MarkdownPreview,
  'base64': Base64Tool,
  'url-encode': UrlEncodeTool,
  'html-entity': HtmlEntityTool,
  'jwt-decoder': JwtDecoder,
  'unicode-converter': UnicodeConverter,
  'hex-converter': HexConverter,
  'sha': ShaTool,
  'uuid': UuidTool,
  'password': PasswordTool,
  'random-string': RandomStringTool,
  'regex-tester': RegexTester,
  'timestamp': TimestampTool,
  'color-converter': ColorConverter,
  'color-picker': ColorPicker,
  'gradient-generator': GradientGenerator,
  'shadow-generator': ShadowGenerator,
  'border-radius': BorderRadiusGenerator,
  'css-unit': CssUnitConverter,
  'qr-generator': QrGenerator,
  'qr-scanner': QrScanner,
  'diff-checker': DiffChecker,
  'word-counter': WordCounter,
};

const CATEGORIES: ToolCategory[] = ['Code & Data', 'Encoding', 'Security & Utilities', 'Design', 'Other'];

export function ToolsSection() {
  const activeTool = useApp((s) => s.activeTool);
  const setActiveTool = useApp((s) => s.setActiveTool);
  const lang = useApp((s) => s.settings.language);
  const [filter, setFilter] = useState('');
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    favorites.list().then((f) => setFavIds(f.map((x) => x.id))).catch(() => {});
  }, [activeTool]);

  const visibleTools = useMemo(() => {
    if (!filter.trim()) return TOOL_REGISTRY;
    const q = filter.toLowerCase();
    return TOOL_REGISTRY.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.keywords ?? []).some((k) => k.toLowerCase().includes(q)),
    );
  }, [filter]);

  if (activeTool && COMPONENTS[activeTool]) {
    const def = TOOL_REGISTRY.find((t) => t.id === activeTool)!;
    const Comp = COMPONENTS[activeTool];
    return (
      <div className="px-3 sm:px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All tools
          </Button>
          <div className="ml-auto">
            <FavoriteButton toolId={def.id} />
          </div>
        </div>
        <Comp />
      </div>
    );
  }

  if (activeTool && !COMPONENTS[activeTool]) {
    return (
      <div className="px-3 sm:px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-destructive font-medium">Tool "{activeTool}" is registered but not yet implemented.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setActiveTool(null)}>Back to tools</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-6xl mx-auto w-full devkit-fade-in">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Developer Tools</h1>
          <p className="text-sm text-muted-foreground">{TOOL_REGISTRY.length} tools — all run locally in your browser.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tools..."
            className="pl-9"
          />
        </div>
      </div>

      {filter.trim() === '' && favIds.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> Favorites
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TOOL_REGISTRY.filter((t) => favIds.includes(t.id)).map((t) => (
              <ToolCard key={t.id} tool={t} onOpen={() => { setActiveTool(t.id); logOpen(t); }} favorited />
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((cat) => {
        const tools = visibleTools.filter((t) => t.category === cat);
        if (tools.length === 0) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tools.map((t) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  onOpen={() => { setActiveTool(t.id); logOpen(t); }}
                  favorited={favIds.includes(t.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ToolCard({ tool, onOpen, favorited }: { tool: ToolDef; onOpen: () => void; favorited: boolean }) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onOpen}
      className="group text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/40 transition-colors devkit-card-glow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4.5 w-4.5" />
        </div>
        {favorited && <Star className="h-3.5 w-3.5 fill-current text-amber-500" />}
      </div>
      <div className="font-medium text-sm leading-tight">{tool.name}</div>
      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</div>
    </button>
  );
}

async function logOpen(t: ToolDef) {
  try {
    await activity.add({
      id: crypto.randomUUID(),
      kind: 'tool',
      message: `Opened ${t.name}`,
      createdAt: Date.now(),
    });
  } catch { /* ignore */ }
}
