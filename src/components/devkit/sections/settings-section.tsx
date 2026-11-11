'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/devkit/store';
import { t } from '@/lib/devkit/i18n';
import type { AIProvider, ThemeId, Language } from '@/lib/devkit/types';
import { testProvider } from '@/lib/devkit/ai-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Settings as SettingsIcon,
  Palette,
  Languages,
  Bot,
  Github,
  Plus,
  Trash2,
  KeyRound,
  Save,
  TestTube2,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Upload,
  Info,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportBackup, importBackup } from '@/lib/devkit/db';
import { downloadBlob } from '@/lib/devkit/utils';
import { activity } from '@/lib/devkit/db';

const THEMES: { id: ThemeId; name: string; swatch: string[] }[] = [
  { id: 'premium-dark', name: 'Premium Dark', swatch: ['#1a1f3a', '#9b7cff', '#4dd4ff'] },
  { id: 'light', name: 'Light', swatch: ['#fafafa', '#6c2bd9', '#1e9bd6'] },
  { id: 'midnight', name: 'Midnight', swatch: ['#0a0e2a', '#a07cff', '#56b8ff'] },
  { id: 'ocean', name: 'Ocean', swatch: ['#133355', '#4da3d9', '#56d9e6'] },
  { id: 'purple', name: 'Purple', swatch: ['#22103f', '#9a4dff', '#ff6db3'] },
];

export function SettingsSection() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const providers = useApp((s) => s.providers);
  const upsertProvider = useApp((s) => s.upsertProvider);
  const removeProvider = useApp((s) => s.removeProvider);
  const setDefaultProvider = useApp((s) => s.setDefaultProvider);
  const { toast } = useToast();

  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editProvider, setEditProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  function startAddProvider() {
    setEditProvider({
      id: crypto.randomUUID(),
      name: '',
      kind: 'openai',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      enabled: true,
      isDefault: providers.length === 0,
      createdAt: Date.now(),
      hasKey: false,
    });
    setShowAddProvider(true);
    setApiKey('');
  }

  function startEditProvider(p: AIProvider) {
    setEditProvider({ ...p });
    setShowAddProvider(true);
    setApiKey(''); // never pre-fill the key from storage
  }

  async function saveProvider() {
    if (!editProvider) return;
    if (!editProvider.name.trim()) { toast({ title: 'Provider name required', variant: 'destructive' }); return; }
    let saved = editProvider;
    if (apiKey.trim()) {
      // Send key to backend, which stores it server-side only.
      try {
        const res = await fetch('/api/ai/providers/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: editProvider.id, kind: editProvider.kind, key: apiKey.trim(), meta: editProvider }),
        });
        if (!res.ok) {
          const d = await res.json();
          toast({ title: 'Failed to store key on backend', description: d.error, variant: 'destructive' });
          return;
        }
        saved = { ...editProvider, hasKey: true };
        toast({ title: 'API key stored securely on backend' });
      } catch (e) {
        toast({ title: 'Failed to reach backend to store key', description: (e as Error).message, variant: 'destructive' });
        return;
      }
    } else {
      // Still register metadata on backend so it can resolve providerId -> endpoint/model.
      try {
        await fetch('/api/ai/providers/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editProvider),
        });
      } catch { /* ignore — backend will reject when called */ }
    }
    upsertProvider(saved);
    await activity.add({
      id: crypto.randomUUID(),
      kind: 'settings',
      message: `Saved AI provider "${saved.name}"`,
      createdAt: Date.now(),
    }).catch(() => {});
    setShowAddProvider(false);
    setEditProvider(null);
    setApiKey('');
  }

  async function deleteProvider(p: AIProvider) {
    if (!confirm(`Delete provider "${p.name}"? This also revokes the key on the backend.`)) return;
    try {
      await fetch(`/api/ai/providers/keys?providerId=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    removeProvider(p.id);
    toast({ title: 'Provider deleted' });
  }

  async function testConn(p: AIProvider) {
    toast({ title: 'Testing connection...' });
    const r = await testProvider(p);
    if (r.ok) toast({ title: 'Connection OK', description: r.message });
    else toast({ title: 'Connection failed', description: r.message, variant: 'destructive' });
  }

  async function revokeKey(p: AIProvider) {
    if (!confirm('Revoke this API key on the backend?')) return;
    try {
      await fetch(`/api/ai/providers/keys?providerId=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
      upsertProvider({ ...p, hasKey: false });
      toast({ title: 'Key revoked' });
    } catch (e) {
      toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-4xl mx-auto w-full space-y-4 devkit-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-primary" /> {t(settings.language, 'nav.settings')}</h1>
        <p className="text-sm text-muted-foreground">Personalize DEVKIT and manage integrations.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Palette className="h-4 w-4" /> Theme</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => updateSettings({ theme: th.id })}
                className={`p-2 rounded-lg border text-left transition-colors ${settings.theme === th.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex gap-1 mb-1.5">
                  {th.swatch.map((c, i) => <div key={i} className="h-4 w-4 rounded-sm" style={{ background: c }} />)}
                </div>
                <div className="text-xs font-medium">{th.name}</div>
              </button>
            ))}
          </div>
          <div>
            <Label>Font size: {settings.fontSize}px</Label>
            <input
              type="range" min={12} max={20} value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: +e.target.value })}
              className="w-full mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Languages className="h-4 w-4" /> Language</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={settings.language === 'en' ? 'default' : 'outline'}
              onClick={() => updateSettings({ language: 'en' })}
            >English</Button>
            <Button
              variant={settings.language === 'bn' ? 'default' : 'outline'}
              onClick={() => updateSettings({ language: 'bn' })}
            >বাংলা (Bangla)</Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor prefs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Editor preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-save</Label>
              <p className="text-xs text-muted-foreground">Automatically save files while editing.</p>
            </div>
            <Switch checked={settings.autoSave} onCheckedChange={(v) => updateSettings({ autoSave: v })} />
          </div>
          <div>
            <Label>Auto-save delay: {settings.autoSaveDelayMs}ms</Label>
            <input
              type="range" min={500} max={10000} step={500} value={settings.autoSaveDelayMs}
              onChange={(e) => updateSettings({ autoSaveDelayMs: +e.target.value })}
              className="w-full mt-1"
            />
          </div>
          <div>
            <Label>Tab size: {settings.tabSize} spaces</Label>
            <input
              type="range" min={1} max={8} value={settings.tabSize}
              onChange={(e) => updateSettings({ tabSize: +e.target.value })}
              className="w-full mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Bot className="h-4 w-4" /> AI Providers</span>
            <Button size="sm" variant="outline" onClick={startAddProvider}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            API keys are stored securely on the backend, never in browser storage or frontend code.
            The browser only stores provider metadata (name, endpoint, model) and a flag indicating a key exists.
          </p>
          {providers.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No providers configured. Click "Add" to set up OpenAI, Gemini, Anthropic, or any OpenAI-compatible endpoint.
            </div>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {p.name}
                        {p.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">default</span>}
                        {!p.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">disabled</span>}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {p.kind} · {p.endpoint} · {p.model}
                      </div>
                      <div className="text-xs mt-1">
                        {p.hasKey ? (
                          <span className="text-emerald-600">✓ API key set on backend</span>
                        ) : (
                          <span className="text-amber-600">⚠ No API key set on backend</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => testConn(p)}><TestTube2 className="h-3.5 w-3.5 mr-1" /> Test</Button>
                    <Button size="sm" variant="ghost" onClick={() => startEditProvider(p)}>Edit</Button>
                    {!p.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefaultProvider(p.id)}>Make default</Button>}
                    {p.hasKey && <Button size="sm" variant="ghost" onClick={() => revokeKey(p)}>Revoke key</Button>}
                    <Button size="sm" variant="ghost" onClick={() => deleteProvider(p)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddProvider && editProvider && (
            <div className="rounded-lg border border-primary/40 bg-card p-3 space-y-3">
              <div className="font-medium text-sm flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" /> {providers.find((p) => p.id === editProvider.id) ? 'Edit provider' : 'New provider'}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Display name</Label>
                  <Input value={editProvider.name} onChange={(e) => setEditProvider({ ...editProvider, name: e.target.value })} placeholder="e.g. My OpenAI" />
                </div>
                <div>
                  <Label className="text-xs">Kind</Label>
                  <select
                    value={editProvider.kind}
                    onChange={(e) => {
                      const kind = e.target.value as AIProvider['kind'];
                      const defaults: Record<string, { endpoint: string; model: string }> = {
                        openai: { endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
                        gemini: { endpoint: 'https://generativelanguage.googleapis.com', model: 'gemini-flash-latest' },
                        anthropic: { endpoint: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-latest' },
                        custom: { endpoint: '', model: '' },
                      };
                      setEditProvider({ ...editProvider, kind, ...defaults[kind] });
                    }}
                    className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">Custom (OpenAI-compatible)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Endpoint (base URL)</Label>
                  <Input value={editProvider.endpoint} onChange={(e) => setEditProvider({ ...editProvider, endpoint: e.target.value })} className="font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Model</Label>
                  <Input value={editProvider.model} onChange={(e) => setEditProvider({ ...editProvider, model: e.target.value })} className="font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs">API key (sent to backend, never stored in browser)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={editProvider.hasKey ? 'Leave blank to keep existing key on backend' : 'Paste your API key here'}
                    className="font-mono"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stored only on the server. The browser never sees the key again after this.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={editProvider.enabled} onChange={(e) => setEditProvider({ ...editProvider, enabled: e.target.checked })} /> Enabled
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={editProvider.isDefault} onChange={(e) => setEditProvider({ ...editProvider, isDefault: e.target.checked })} /> Default
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveProvider}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                <Button variant="ghost" onClick={() => { setShowAddProvider(false); setEditProvider(null); setApiKey(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub settings */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Github className="h-4 w-4" /> GitHub</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Push (master switch)</Label>
              <p className="text-xs text-muted-foreground">Allow AI-generated changes to be pushed automatically to allowed branches.</p>
            </div>
            <Switch checked={settings.githubAutoPush} onCheckedChange={(v) => updateSettings({ githubAutoPush: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Protect main branch</Label>
              <p className="text-xs text-muted-foreground">Require confirmation before pushing to main/master.</p>
            </div>
            <Switch checked={settings.githubProtectMain} onCheckedChange={(v) => updateSettings({ githubProtectMain: v })} />
          </div>
          <div>
            <Label>Auto-Push allowed repositories (full names, comma-separated)</Label>
            <Input
              value={settings.githubAutoPushRepos.join(', ')}
              onChange={(e) => updateSettings({ githubAutoPushRepos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="owner/repo1, owner/repo2"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Auto-Push allowed branches (comma-separated)</Label>
            <Input
              value={settings.githubAutoPushBranches.join(', ')}
              onChange={(e) => updateSettings({ githubAutoPushBranches: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="ai-fixes, ai-experiments"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Shield className="h-4 w-4" /> Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Send usage telemetry</Label>
              <p className="text-xs text-muted-foreground">DEVKIT does not collect any telemetry. This switch is a placeholder for future opt-in features.</p>
            </div>
            <Switch checked={settings.privacyTelemetry} onCheckedChange={(v) => updateSettings({ privacyTelemetry: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>In-app notifications</Label>
              <p className="text-xs text-muted-foreground">Show in-app notification badges (push history, etc.).</p>
            </div>
            <Switch checked={settings.notifications} onCheckedChange={(v) => updateSettings({ notifications: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Backup & restore */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Download className="h-4 w-4" /> Backup & Restore</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Export all projects, files, history and favorites as a JSON file. Restore replaces or merges local data.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={async () => {
              const json = await exportBackup();
              downloadBlob('devkit-backup.json', new Blob([json], { type: 'application/json' }));
              toast({ title: 'Backup downloaded' });
            }}>
              <Download className="h-3.5 w-3.5 mr-1" /> Backup
            </Button>
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1" /> Restore
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const text = await f.text();
                    const replace = confirm('Replace all existing data with the backup? Click Cancel to merge.');
                    try {
                      await importBackup(text, replace);
                      toast({ title: 'Backup restored' });
                    } catch (err) {
                      toast({ title: 'Restore failed', description: (err as Error).message, variant: 'destructive' });
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Info className="h-4 w-4" /> About</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="App Name" value="DEVKIT" />
          <Row label="Tagline" value="Build Smarter. Code Better." />
          <Row label="Version" value="1.0.0" />
          <Row label="Developer" value="Nayon Ahamed" />
          <Row label="Brand" value="NCX / NayonCodeX" />
          <Row label="Platform" value="Mobile-first Web App · PWA · Android-ready" />
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            NCX / NayonCodeX branding appears only in this About section, not in the main application UI.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
