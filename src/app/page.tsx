'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/devkit/store';
import { t } from '@/lib/devkit/i18n';
import {
  Home as HomeIcon,
  Wrench,
  Bot,
  FolderGit2,
  Github,
  Settings as SettingsIcon,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ActivityLog } from '@/components/devkit/activity-log';
import { HomeSection } from '@/components/devkit/sections/home-section';
import { ToolsSection } from '@/components/devkit/sections/tools-section';
import { AISection } from '@/components/devkit/sections/ai-section';
import { WorkspaceSection } from '@/components/devkit/sections/workspace-section';
import { GithubSection } from '@/components/devkit/sections/github-section';
import { SettingsSection } from '@/components/devkit/sections/settings-section';
import type { NavSection } from '@/lib/devkit/types';

const NAV: { id: NavSection; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { id: 'home', icon: HomeIcon, labelKey: 'nav.home' },
  { id: 'tools', icon: Wrench, labelKey: 'nav.tools' },
  { id: 'ai', icon: Bot, labelKey: 'nav.ai' },
  { id: 'workspace', icon: FolderGit2, labelKey: 'nav.workspace' },
  { id: 'github', icon: Github, labelKey: 'nav.github' },
  { id: 'settings', icon: SettingsIcon, labelKey: 'nav.settings' },
];

export default function Home() {
  const section = useApp((s) => s.section);
  const setSection = useApp((s) => s.setSection);
  const settings = useApp((s) => s.settings);
  const setTheme = useApp((s) => s.setTheme);
  const notifications = useApp((s) => s.notifications);
  const markAllRead = useApp((s) => s.markAllRead);
  const clearNotifications = useApp((s) => s.clearNotifications);
  const setActiveTool = useApp((s) => s.setActiveTool);
  const providers = useApp((s) => s.providers);
  const githubConnected = useApp((s) => s.githubConnected);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const lang = settings.language;
  const unread = notifications.filter((n) => !n.read).length;

  // Sync theme attribute on settings change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Close mobile nav when section changes (schedule off the effect body to avoid cascading-render warning)
  useEffect(() => {
    if (mobileNavOpen) {
      queueMicrotask(() => setMobileNavOpen(false));
    }
  }, [section, mobileNavOpen]);

  const defaultProvider = providers.find((p) => p.isDefault && p.enabled);
  const aiReady = !!defaultProvider && defaultProvider.hasKey;

  // Global search across tools (basic)
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    // We rely on a small static registry we keep in tools-registry.ts
    return ALL_TOOL_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [globalSearch]);

  const onSearchSelect = (name: string) => {
    setSection('tools');
    setActiveTool(name);
    setGlobalSearch('');
    setShowResults(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-3 sm:px-6 h-14">
          {/* Mobile nav trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar">
              <SheetHeader className="px-4 py-3 border-b border-sidebar-border">
                <SheetTitle className="flex items-center gap-2">
                  <Logo />
                  <span className="font-bold tracking-tight">DEVKIT</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="p-3 flex flex-col gap-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t(lang, item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">DEVKIT</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {t(lang, 'app.tagline')}
              </span>
            </div>
          </div>

          {/* Global search */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowResults(!!e.target.value.trim());
                }}
                onFocus={() => setShowResults(!!globalSearch.trim())}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder={t(lang, 'home.search.placeholder')}
                className="pl-9 h-9 bg-card"
                aria-label="Global search"
              />
            </div>
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                {searchResults.map((name) => (
                  <button
                    key={name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSearchSelect(name)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI / GitHub / Notifications */}
          <div className="flex items-center gap-1.5">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${
                aiReady
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
              title={aiReady ? 'AI provider is configured' : 'AI provider not configured'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${aiReady ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              AI
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${
                githubConnected
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
              title={githubConnected ? 'GitHub connected' : 'GitHub not connected'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${githubConnected ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              GH
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <div className="flex gap-2">
                    <button onClick={() => markAllRead()} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                    <button onClick={() => clearNotifications()} className="text-xs text-destructive hover:underline">
                      Clear
                    </button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t(lang, 'home.no.activity')}
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start py-2">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme quick switch */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Switch theme">
                  <Palette className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    ['premium-dark', 'Premium Dark'],
                    ['light', 'Light'],
                    ['midnight', 'Midnight'],
                    ['ocean', 'Ocean'],
                    ['purple', 'Purple'],
                  ] as const
                ).map(([id, name]) => (
                  <DropdownMenuItem key={id} onClick={() => setTheme(id)} className={settings.theme === id ? 'font-semibold' : ''}>
                    <span className="mr-2">{settings.theme === id ? '✓' : ' '}</span> {name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSection('settings')}>
                  Custom theme…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop horizontal nav */}
        <nav className="hidden lg:flex border-t border-border/50 px-6 h-11 items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(lang, item.labelKey)}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {section === 'home' && <HomeSection />}
        {section === 'tools' && <ToolsSection />}
        {section === 'ai' && <AISection />}
        {section === 'workspace' && <WorkspaceSection />}
        {section === 'github' && <GithubSection />}
        {section === 'settings' && <SettingsSection />}
      </main>

      <footer className="border-t border-border py-3 px-4 text-xs text-muted-foreground text-center">
        DEVKIT v1.0.0 · by Nayon Ahamed · NCX / NayonCodeX · {t(lang, 'app.tagline')}
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--devkit-purple)] to-[var(--devkit-cyan)] flex items-center justify-center font-bold text-white text-sm shadow-sm">
      D
    </div>
  );
}

// Tool names imported for the search index
import { TOOL_REGISTRY } from '@/components/devkit/tools/registry';
const ALL_TOOL_NAMES = TOOL_REGISTRY.map((t) => t.name);

// Register the service worker on mount (client-only, no-op in unsupported envs)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/devkit-sw.js').catch(() => { /* ignore */ });
  });
}
