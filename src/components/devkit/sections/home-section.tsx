'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/devkit/store';
import { t } from '@/lib/devkit/i18n';
import { projects, activity, favorites, toolHistory } from '@/lib/devkit/db';
import { TOOL_REGISTRY } from '@/components/devkit/tools/registry';
import type { Project, ActivityEntry, FavoriteTool } from '@/lib/devkit/types';
import {
  Bot,
  FolderGit2,
  Search,
  Wrench,
  Star,
  Clock,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HomeSection() {
  const settings = useApp((s) => s.settings);
  const setSection = useApp((s) => s.setSection);
  const setActiveTool = useApp((s) => s.setActiveTool);
  const providers = useApp((s) => s.providers);
  const githubConnected = useApp((s) => s.githubConnected);
  const lang = settings.language;
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [favs, setFavs] = useState<FavoriteTool[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projects.list().then(setRecentProjects).catch(() => {});
    activity.list().then(setRecentActivity).catch(() => {});
    favorites.list().then(setFavs).catch(() => {});
  }, []);

  const defaultProvider = providers.find((p) => p.isDefault && p.enabled);
  const aiReady = !!defaultProvider && defaultProvider.hasKey;

  const filteredTools = search.trim()
    ? TOOL_REGISTRY.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : TOOL_REGISTRY.slice(0, 6);

  function openTool(id: string) {
    setActiveTool(id);
    setSection('tools');
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-6xl mx-auto w-full space-y-5 devkit-fade-in">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 devkit-card-glow devkit-grid-bg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{t(lang, 'home.welcome')}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              <span className="devkit-gradient-text">DEVKIT</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t(lang, 'home.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setSection('ai')} variant="default">
              <Bot className="h-4 w-4 mr-1.5" /> {t(lang, 'home.ai.shortcut')}
            </Button>
            <Button onClick={() => setSection('workspace')} variant="outline">
              <FolderGit2 className="h-4 w-4 mr-1.5" /> {t(lang, 'nav.workspace')}
            </Button>
          </div>
        </div>
      </section>

      {/* Global search */}
      <section>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'home.search.placeholder')}
            className="pl-9 h-11"
          />
        </div>
        {search && filteredTools.length > 0 && (
          <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredTools.map((t) => (
              <button
                key={t.id}
                onClick={() => openTool(t.id)}
                className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40"
              >
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Status row */}
      <section className="grid sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4" /> AI</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${aiReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                {aiReady ? `Ready · ${defaultProvider?.name}` : 'Not configured'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSection('settings')}>Configure</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FolderGit2 className="h-4 w-4" /> GitHub</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${githubConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                {githubConnected ? 'Connected' : 'Not connected'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSection('github')}>Open</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" /> Tools</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">{TOOL_REGISTRY.length} tools available</span>
              <Button size="sm" variant="ghost" onClick={() => setSection('tools')}>Open</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick access */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t(lang, 'home.quickaccess')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOOL_REGISTRY.slice(0, 8).map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => openTool(tool.id)}
                className="text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/40 transition-colors"
              >
                <Icon className="h-5 w-5 text-primary mb-2" />
                <div className="text-sm font-medium leading-tight">{tool.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent projects */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FolderGit2 className="h-3.5 w-3.5" /> {t(lang, 'home.recent.projects')}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSection('workspace')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>
          {recentProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t(lang, 'home.no.projects')}
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSection('workspace')}
                  className="block w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40"
                >
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{p.description || 'No description'}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {t(lang, 'home.recent.activity')}
          </h2>
          {recentActivity.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t(lang, 'home.no.activity')}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-auto pr-1">
              {recentActivity.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50">
                  <span className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Favorites */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5" /> {t(lang, 'home.favorites')}
        </h2>
        {favs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t(lang, 'home.no.favorites')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {favs.map((f) => {
              const tool = TOOL_REGISTRY.find((t) => t.id === f.id);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => openTool(tool.id)}
                  className="text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/40 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-sm font-medium leading-tight">{tool.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
