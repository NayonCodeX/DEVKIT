'use client';

import { useEffect, useRef, useState } from 'react';
import { projects, files, fileVersions, exportBackup, importBackup } from '@/lib/devkit/db';
import type { Project, ProjectFile } from '@/lib/devkit/types';
import { useApp } from '@/lib/devkit/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FolderGit2,
  Plus,
  Trash2,
  FilePlus,
  FolderPlus,
  Download,
  Upload,
  Save,
  History,
  ChevronRight,
  ChevronDown,
  FileCode2,
  Search,
  Replace,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadText, downloadBlob } from '@/lib/devkit/utils';

export function WorkspaceSection() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [fileList, setFileList] = useState<ProjectFile[]>([]);
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [newName, setNewName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [search, setSearch] = useState('');
  const [replace, setReplace] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [history, setHistory] = useState<{ id: string; content: string; savedAt: number; reason?: string }[]>([]);
  const settings = useApp((s) => s.settings);
  const { toast } = useToast();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refreshProjects();
  }, []);

  async function refreshProjects() {
    const list = await projects.list().catch(() => []);
    setProjectList(list);
  }

  async function openProject(p: Project) {
    const updated = { ...p, lastOpenedAt: Date.now() };
    await projects.put(updated);
    setCurrentProject(updated);
    const fs = await files.list(p.id);
    setFileList(fs);
    setCurrentFile(null);
    setContent('');
    setDirty(false);
    refreshProjects();
  }

  async function createProject() {
    if (!newName.trim()) return;
    const p: Project = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await projects.put(p);
    setNewName('');
    setShowNewProject(false);
    await openProject(p);
  }

  async function deleteProject(p: Project) {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    await projects.delete(p.id);
    if (currentProject?.id === p.id) {
      setCurrentProject(null);
      setFileList([]);
      setCurrentFile(null);
      setContent('');
    }
    refreshProjects();
    toast({ title: 'Project deleted' });
  }

  async function createFile(path: string) {
    if (!currentProject) return;
    if (!path.trim()) return;
    const existing = fileList.find((f) => f.path === path.trim());
    if (existing) {
      toast({ title: 'A file with that path already exists', variant: 'destructive' });
      return;
    }
    const lang = detectLanguage(path);
    const f: ProjectFile = {
      id: crypto.randomUUID(),
      projectId: currentProject.id,
      path: path.trim(),
      content: '',
      language: lang,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await files.put(f);
    setFileList((l) => [...l, f].sort((a, b) => a.path.localeCompare(b.path)));
    openFile(f);
  }

  async function deleteFile(f: ProjectFile) {
    if (!confirm(`Delete "${f.path}"?`)) return;
    await files.delete(f.id);
    setFileList((l) => l.filter((x) => x.id !== f.id));
    if (currentFile?.id === f.id) {
      setCurrentFile(null);
      setContent('');
    }
  }

  async function renameFile(f: ProjectFile, newPath: string) {
    if (!newPath.trim()) return;
    await files.rename(f.id, newPath.trim());
    const updated = { ...f, path: newPath.trim(), language: detectLanguage(newPath) };
    setFileList((l) => l.map((x) => (x.id === f.id ? updated : x)).sort((a, b) => a.path.localeCompare(b.path)));
    if (currentFile?.id === f.id) setCurrentFile(updated);
  }

  function openFile(f: ProjectFile) {
    if (currentFile && dirty && currentFile.id !== f.id) {
      if (!confirm('You have unsaved changes. Discard and open this file?')) return;
    }
    setCurrentFile(f);
    setContent(f.content);
    setDirty(false);
    refreshHistory(f.id);
  }

  async function refreshHistory(fileId: string) {
    const h = await fileVersions.list(fileId).catch(() => []);
    setHistory(h);
  }

  async function saveFile(reason?: string) {
    if (!currentFile) return;
    const updated = { ...currentFile, content, updatedAt: Date.now() };
    await files.put(updated);
    setFileList((l) => l.map((x) => (x.id === updated.id ? updated : x)));
    setCurrentFile(updated);
    setDirty(false);
    // Save a version snapshot
    await fileVersions.add({
      id: crypto.randomUUID(),
      fileId: updated.id,
      content,
      savedAt: Date.now(),
      reason: reason ?? 'Manual save',
    });
    refreshHistory(updated.id);
    toast({ title: 'Saved' });
  }

  async function restoreVersion(versionId: string) {
    const v = history.find((h) => h.id === versionId);
    if (!v || !currentFile) return;
    if (!confirm('Restore this version? Your current unsaved changes will be lost (after saving the current version first).')) return;
    // Save current first so it's recoverable
    if (dirty) {
      await saveFile('Auto-saved before restore');
    }
    setContent(v.content);
    setDirty(true);
    toast({ title: 'Restored. Click Save to commit.' });
  }

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave || !currentFile || !dirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveFile('Auto-save');
    }, settings.autoSaveDelayMs);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
     
  }, [content, settings.autoSave, settings.autoSaveDelayMs, currentFile, dirty]);

  function applySearchReplace() {
    if (!search) return;
    const newText = content.split(search).join(replace);
    setContent(newText);
    setDirty(newText !== (currentFile?.content ?? ''));
    toast({ title: 'Replaced' });
  }

  async function exportProject() {
    if (!currentProject) return;
    const fs = await files.list(currentProject.id);
    const dump = {
      project: currentProject,
      files: fs,
      exportedAt: Date.now(),
    };
    downloadBlob(`${currentProject.name.replace(/[^a-z0-9-_]/gi, '_')}.devkit-project.json`, new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
  }

  async function importProject(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { project: Project; files: ProjectFile[] };
      if (!data.project || !data.files) throw new Error('Invalid project file.');
      const newId = crypto.randomUUID();
      const newProject: Project = { ...data.project, id: newId, name: `${data.project.name} (imported)`, createdAt: Date.now(), updatedAt: Date.now() };
      await projects.put(newProject);
      for (const f of data.files) {
        await files.put({ ...f, id: crypto.randomUUID(), projectId: newId, createdAt: Date.now(), updatedAt: Date.now() });
      }
      await openProject(newProject);
      toast({ title: 'Project imported' });
    } catch (e) {
      toast({ title: 'Import failed', description: (e as Error).message, variant: 'destructive' });
    }
  }

  async function exportBackupFile() {
    const json = await exportBackup();
    downloadBlob('devkit-backup.json', new Blob([json], { type: 'application/json' }));
  }

  async function importBackupFile(file: File) {
    const text = await file.text();
    await importBackup(text, confirm('Replace all existing data with the backup? Cancel to merge.'));
    toast({ title: 'Backup restored' });
    refreshProjects();
  }

  // Build a tree-like view from flat paths
  const tree = buildTree(fileList);

  return (
    <div className="px-3 sm:px-6 py-4 max-w-7xl mx-auto w-full devkit-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><FolderGit2 className="h-6 w-6 text-primary" /> Workspace</h1>
          <p className="text-sm text-muted-foreground">Local projects & files, stored in your browser via IndexedDB.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNewProject(true)}>
            <Plus className="h-4 w-4 mr-1" /> New project
          </Button>
          <Button size="sm" variant="ghost" onClick={exportBackupFile}><Download className="h-4 w-4 mr-1" /> Backup</Button>
          <Button size="sm" variant="ghost" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-1" /> Restore
              <input type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackupFile(f); e.target.value = ''; }} />
            </label>
          </Button>
        </div>
      </div>

      {!currentProject ? (
        /* Project picker */
        <div className="space-y-3">
          {showNewProject && (
            <Card>
              <CardHeader><CardTitle className="text-sm">New project</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  autoFocus
                />
                <Button onClick={createProject}>Create</Button>
                <Button variant="ghost" onClick={() => setShowNewProject(false)}>Cancel</Button>
              </CardContent>
            </Card>
          )}
          {projectList.length === 0 && !showNewProject ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <FolderGit2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No projects yet. Create your first project to start coding.</p>
              <Button size="sm" className="mt-3" onClick={() => setShowNewProject(true)}>
                <Plus className="h-4 w-4 mr-1" /> New project
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectList.map((p) => (
                <Card key={p.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => openProject(p)} className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description || 'No description'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      </button>
                      <button onClick={() => deleteProject(p)} className="text-destructive p-1 rounded hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Project view: file tree + editor */
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <Card className="h-fit">
            <CardHeader className="py-3 border-b border-border">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">{currentProject.name}</span>
                <button onClick={() => { setCurrentProject(null); setCurrentFile(null); setContent(''); }} className="text-xs text-muted-foreground hover:text-foreground">Back</button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex items-center gap-1 mb-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  const path = prompt('New file path (e.g. "index.html" or "src/app.js"):');
                  if (path) createFile(path);
                }}>
                  <FilePlus className="h-3.5 w-3.5 mr-1" /> File
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const path = prompt('New folder path (e.g. "src/components"):');
                  if (path) {
                    // create a .keep file so the folder exists in the tree
                    createFile(`${path.replace(/\/$/, '')}/.keep`);
                  }
                }}>
                  <FolderPlus className="h-3.5 w-3.5 mr-1" /> Folder
                </Button>
              </div>
              <div className="space-y-0.5 max-h-[60vh] overflow-auto">
                {tree.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2">No files. Create one to start.</div>
                ) : (
                  tree.map((node) => <TreeNode key={node.path} node={node} depth={0} onOpen={() => { if (node.file) openFile(node.file); }} onRename={(f) => { const np = prompt('New path:', f.path); if (np) renameFile(f, np); }} onDelete={(f) => deleteFile(f)} activePath={currentFile?.path} />)
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={exportProject}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export project
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <label className="w-full justify-start cursor-pointer">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Import project
                    <input type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importProject(f); e.target.value = ''; }} />
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <div className="space-y-3">
            {currentFile ? (
              <>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <input
                      value={currentFile.path}
                      onChange={(e) => renameFile(currentFile, e.target.value)}
                      className="font-mono text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary px-1 py-0.5 outline-none min-w-0"
                    />
                    {dirty && <span className="text-amber-500 text-xs">● unsaved</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setShowSearch((s) => !s)}>
                      <Search className="h-3.5 w-3.5 mr-1" /> Find/Replace
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => refreshHistory(currentFile.id)}>
                      <History className="h-3.5 w-3.5 mr-1" /> Versions
                    </Button>
                    <Button size="sm" onClick={() => saveFile()} disabled={!dirty}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                </div>
                {showSearch && (
                  <Card>
                    <CardContent className="p-3 flex flex-col gap-2">
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find..." />
                      <Input value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Replace with..." />
                      <Button size="sm" onClick={applySearchReplace}><Replace className="h-3.5 w-3.5 mr-1" /> Replace all</Button>
                    </CardContent>
                  </Card>
                )}
                <textarea
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setDirty(e.target.value !== (currentFile?.content ?? '')); }}
                  spellCheck={false}
                  className="w-full font-mono text-sm bg-card border border-border rounded-md p-3 min-h-[400px] resize-y tab-size"
                  style={{ tabSize: settings.tabSize, fontSize: `${settings.fontSize}px` }}
                  placeholder="Type your code..."
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const ta = e.currentTarget;
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const newContent = content.slice(0, start) + ' '.repeat(settings.tabSize) + content.slice(end);
                      setContent(newContent);
                      setDirty(true);
                      requestAnimationFrame(() => {
                        ta.selectionStart = ta.selectionEnd = start + settings.tabSize;
                      });
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                      e.preventDefault();
                      saveFile();
                    }
                  }}
                />
                {history.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><History className="h-4 w-4" /> Version history</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-60 overflow-auto">
                        {history.map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/50 border border-border">
                            <div className="min-w-0">
                              <div className="font-mono">{new Date(h.savedAt).toLocaleString()}</div>
                              <div className="text-muted-foreground truncate">{h.reason}</div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="ghost" onClick={async () => { const c = h.content; await copyToClipboardSafe(c); }}>Copy</Button>
                              <Button size="sm" variant="outline" onClick={() => restoreVersion(h.id)}>Restore</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <FileCode2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a file from the sidebar to edit.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  async function copyToClipboardSafe(text: string) {
    try { await navigator.clipboard.writeText(text); toast({ title: 'Copied' }); } catch { /* ignore */ }
  }
}

interface TreeNode_ {
  path: string;
  name: string;
  isDir: boolean;
  children: TreeNode_[];
  file?: ProjectFile;
}

function buildTree(files: ProjectFile[]): TreeNode_[] {
  const root: TreeNode_ = { path: '', name: '', isDir: true, children: [] };
  for (const f of files) {
    const parts = f.path.split('/');
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const p = parts.slice(0, i + 1).join('/');
      const isLeaf = i === parts.length - 1;
      let next = cur.children.find((c) => c.path === p);
      if (!next) {
        next = { path: p, name: parts[i], isDir: !isLeaf, children: [], file: isLeaf ? f : undefined };
        cur.children.push(next);
      }
      cur = next;
    }
  }
  function sort(node: TreeNode_) {
    node.children.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    node.children.forEach(sort);
  }
  sort(root);
  return root.children;
}

function TreeNode({ node, depth, onOpen, onRename, onDelete, activePath }: {
  node: TreeNode_;
  depth: number;
  onOpen: () => void;
  onRename: (f: ProjectFile) => void;
  onDelete: (f: ProjectFile) => void;
  activePath?: string;
}) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = node.isDir ? (open ? ChevronDown : ChevronRight) : FileCode2;
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-sm hover:bg-muted/50 ${activePath === node.path ? 'bg-primary/10 text-primary' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {node.isDir ? (
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 flex-1 min-w-0 text-left">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
        ) : (
          <button onClick={onOpen} className="flex items-center gap-1 flex-1 min-w-0 text-left">
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </button>
        )}
        {node.file && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button onClick={() => onRename(node.file!)} className="text-xs text-muted-foreground px-1 hover:text-foreground">ren</button>
            <button onClick={() => onDelete(node.file!)} className="text-xs text-destructive px-1 hover:text-destructive">del</button>
          </div>
        )}
      </div>
      {node.isDir && open && node.children.map((c) => (
        <TreeNode key={c.path} node={c} depth={depth + 1} onOpen={() => { if (c.file) onOpen(); }} onRename={onRename} onDelete={onDelete} activePath={activePath} />
      ))}
    </div>
  );
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', htm: 'html', css: 'css', scss: 'scss', sass: 'sass',
    json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml', md: 'markdown',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin',
    sql: 'sql', sh: 'bash', php: 'php', c: 'c', cpp: 'cpp', cs: 'csharp',
  };
  return map[ext] ?? 'text';
}
