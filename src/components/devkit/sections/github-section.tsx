'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/devkit/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Github,
  AlertTriangle,
  Settings,
  FolderGit2,
  GitBranch,
  GitCommit,
  Upload,
  Download,
  ShieldOff,
  FileText,
  RefreshCw,
  Loader2,
  Check,
  X,
} from 'lucide-react';

export function GithubSection() {
  const connected = useApp((s) => s.githubConnected);
  const user = useApp((s) => s.githubUser);
  const setSession = useApp((s) => s.setGithubSession);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const setSection = useApp((s) => s.setSection);
  const pushNotification = useApp((s) => s.pushNotification);

  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [commitMsg, setCommitMsg] = useState('');
  const [path, setPath] = useState('README.md');
  const [content, setContent] = useState('');
  const [commitLink, setCommitLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    // Try to fetch session status on mount
    refreshSession();
    // Detect OAuth callback params
    const url = new URL(window.location.href);
    const connected = url.searchParams.get('github_connected');
    const err = url.searchParams.get('github_error');
    if (connected) {
      refreshSession();
      pushNotification({ title: 'GitHub connected', body: 'You can now browse and push to authorized repositories.' });
      url.searchParams.delete('github_connected');
      window.history.replaceState({}, '', url.pathname);
    }
    if (err) {
      setErr(`GitHub OAuth error: ${err}`);
      url.searchParams.delete('github_error');
      window.history.replaceState({}, '', url.pathname);
    }
     
  }, []);

  async function refreshSession() {
    try {
      const res = await fetch('/api/github/session');
      const data = await res.json();
      if (data.connected) {
        setSession(true, data.user);
      } else {
        setSession(false, null);
      }
    } catch {
      // backend may not be configured
    }
  }

  async function connect() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/github/oauth/start');
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'GitHub OAuth is not configured on the backend. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.');
        return;
      }
      if (data.url) {
        // Open the OAuth URL in a new window/tab.
        window.location.href = data.url;
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect GitHub? This revokes the session on the backend.')) return;
    try {
      await fetch('/api/github/oauth/revoke', { method: 'POST' });
      setSession(false, null);
      setRepos([]);
      setBranches([]);
      setSelectedRepo(null);
      setCommitLink(null);
      setStatusMsg('Disconnected.');
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function loadRepos() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Failed to load repositories.');
        return;
      }
      setRepos(data.repos ?? []);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBranches(owner: string, repo: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/github/branches?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Failed to load branches.');
        return;
      }
      setBranches(data.branches ?? []);
      if ((data.branches ?? []).length > 0 && !(data.branches as BranchSummary[]).find((b) => b.name === selectedBranch)) {
        setSelectedBranch((data.branches as BranchSummary[])[0].name);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFile() {
    if (!selectedRepo || !selectedBranch) return;
    setLoading(true);
    setErr(null);
    setCommitLink(null);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const res = await fetch(`/api/github/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(selectedBranch)}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Failed to fetch file.');
        return;
      }
      setContent(data.content ?? '');
      setStatusMsg(`Loaded ${path} (${data.size ?? '?'} bytes) from ${selectedBranch}.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function commitFile() {
    if (!selectedRepo || !selectedBranch) return;
    if (!commitMsg.trim()) {
      setErr('Commit message is required.');
      return;
    }
    setLoading(true);
    setErr(null);
    setCommitLink(null);
    try {
      const [owner, repo] = selectedRepo.split('/');
      // Branch protection check
      if (settings.githubProtectMain && selectedBranch === 'main' && !settings.githubAutoPushBranches.includes('main')) {
        if (!confirm(`You are committing to the protected "main" branch of ${selectedRepo}. Continue?`)) {
          setLoading(false);
          return;
        }
      }
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branch: selectedBranch, path, message: commitMsg, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Commit failed.');
        return;
      }
      setCommitLink(data.commitHtmlUrl ?? null);
      setStatusMsg(`Pushed to ${selectedBranch}. Commit SHA: ${data.sha ?? '?'}.`);
      pushNotification({ title: 'GitHub push succeeded', body: `${selectedRepo}:${selectedBranch} — ${commitMsg}` });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!connected) {
    return (
      <div className="px-3 sm:px-6 py-4 max-w-3xl mx-auto w-full devkit-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-2"><Github className="h-6 w-6" /> GitHub</h1>
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-medium text-amber-700 dark:text-amber-400">GitHub is not connected</div>
              <p className="text-sm text-muted-foreground">
                To use GitHub features you must configure GitHub OAuth on the backend (set <code>GITHUB_OAUTH_CLIENT_ID</code>, <code>GITHUB_OAUTH_CLIENT_SECRET</code>, and <code>GITHUB_OAUTH_REDIRECT_URI</code>).
                We never store tokens in the browser or expose them in frontend code. Authentication happens through the backend.
              </p>
              <Button onClick={connect} disabled={loading}>
                <Github className="h-4 w-4 mr-1.5" /> Connect with GitHub
              </Button>
              {err && <div className="text-sm text-destructive mt-2">{err}</div>}
              <Button variant="ghost" size="sm" onClick={() => setSection('settings')}>
                <Settings className="h-3.5 w-3.5 mr-1" /> Open settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-5xl mx-auto w-full space-y-4 devkit-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Github className="h-6 w-6 text-emerald-600" /> GitHub</h1>
          <p className="text-sm text-muted-foreground">Connected as <span className="font-medium">{user?.login ?? 'unknown'}</span></p>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
      </div>

      {/* Auto Push emergency OFF switch */}
      <Card className={settings.githubAutoPush ? 'border-emerald-500/40' : 'border-border'}>
        <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-sm flex items-center gap-1.5">
              <ShieldOff className="h-4 w-4" /> Auto Push master switch
            </div>
            <div className="text-xs text-muted-foreground">
              When enabled, AI-generated changes can be auto-pushed to selected branches. Disable to immediately stop all automatic pushes.
            </div>
          </div>
          <button
            onClick={() => updateSettings({ githubAutoPush: !settings.githubAutoPush })}
            className={`relative h-6 w-11 rounded-full transition-colors ${settings.githubAutoPush ? 'bg-emerald-500' : 'bg-muted'}`}
            aria-label="Auto Push master switch"
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.githubAutoPush ? 'translate-x-5' : ''}`} />
          </button>
        </CardContent>
      </Card>

      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
      {statusMsg && <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">{statusMsg}</div>}
      {commitLink && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          <div className="text-emerald-700 dark:text-emerald-400 font-medium mb-1">Commit created</div>
          <a href={commitLink} target="_blank" rel="noreferrer" className="text-primary underline">{commitLink}</a>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><FolderGit2 className="h-4 w-4" /> Repositories</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={loadRepos} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />} Refresh repositories
          </Button>
          {repos.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-auto">
              {repos.map((r) => (
                <button
                  key={r.fullName}
                  onClick={() => {
                    setSelectedRepo(r.fullName);
                    const [owner, repo] = r.fullName.split('/');
                    loadBranches(owner, repo);
                  }}
                  className={`block w-full text-left p-2.5 rounded-md border ${selectedRepo === r.fullName ? 'bg-primary/10 border-primary/40' : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="font-mono text-sm">{r.fullName}</div>
                  <div className="text-xs text-muted-foreground">{r.description || 'No description'} · {r.private ? 'private' : 'public'}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRepo && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><GitBranch className="h-4 w-4" /> Branch</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {branches.length > 0 ? (
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card">
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}{b.protected ? ' (protected)' : ''}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground">No branches loaded.</div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRepo && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><FileText className="h-4 w-4" /> File editor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="path/to/file.md" className="font-mono" />
              <Button variant="outline" onClick={fetchFile} disabled={loading}>
                <Download className="h-3.5 w-3.5 mr-1" /> Fetch
              </Button>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              spellCheck={false}
              className="font-mono text-sm"
              placeholder="File content..."
            />
            <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="Commit message..." />
            <Button onClick={commitFile} disabled={loading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Commit & Push
            </Button>
            <div className="text-xs text-muted-foreground">
              Committing to <code>{selectedRepo}</code> / <code>{selectedBranch}</code> / <code>{path}</code>
              {settings.githubProtectMain && selectedBranch === 'main' && (
                <span className="text-amber-600"> · ⚠ main is protected</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <div className="flex items-center justify-center py-6 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Working...</div>}
    </div>
  );
}

interface RepoSummary {
  fullName: string;
  description: string | null;
  private: boolean;
}
interface BranchSummary {
  name: string;
  protected: boolean;
}
