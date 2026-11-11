// IndexedDB layer for DEVKIT
// Stores: projects, files, file_versions, tool_history, favorites, activity, ai_history

import type {
  Project,
  ProjectFile,
  FileVersion,
  ToolHistoryEntry,
  FavoriteTool,
  ActivityEntry,
  AIRequestRecord,
} from './types';

const DB_NAME = 'devkit-db';
const DB_VERSION = 1;

export type StoreName =
  | 'projects'
  | 'files'
  | 'file_versions'
  | 'tool_history'
  | 'favorites'
  | 'activity'
  | 'ai_history';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        const fs = db.createObjectStore('files', { keyPath: 'id' });
        fs.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('file_versions')) {
        const fv = db.createObjectStore('file_versions', { keyPath: 'id' });
        fv.createIndex('fileId', 'fileId', { unique: false });
      }
      if (!db.objectStoreNames.contains('tool_history')) {
        db.createObjectStore('tool_history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('activity')) {
        db.createObjectStore('activity', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('ai_history')) {
        db.createObjectStore('ai_history', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function txAll<T>(store: StoreName, mode: IDBTransactionMode): Promise<T[]> {
  return tx<T[]>(store, mode, (s) => s.getAll() as IDBRequest<T[]>);
}

// ---------------- Projects ----------------
export const projects = {
  async list(): Promise<Project[]> {
    const all = await txAll<Project>('projects', 'readonly');
    return all.sort((a, b) => (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt));
  },
  async get(id: string): Promise<Project | undefined> {
    return tx<Project | undefined>('projects', 'readonly', (s) => s.get(id));
  },
  async put(p: Project): Promise<void> {
    await tx<Project>('projects', 'readwrite', (s) => s.put(p) as IDBRequest<Project>);
  },
  async delete(id: string): Promise<void> {
    await tx('projects', 'readwrite', (s) => s.delete(id) as IDBRequest<unknown>);
    // also delete files belonging to this project
    const files = await filesByProject(id);
    for (const f of files) {
      await tx('files', 'readwrite', (s) => s.delete(f.id) as IDBRequest<unknown>);
    }
  },
};

// ---------------- Files ----------------
export async function filesByProject(projectId: string): Promise<ProjectFile[]> {
  const db = await openDb();
  return new Promise<ProjectFile[]>((resolve, reject) => {
    const t = db.transaction('files', 'readonly');
    const idx = t.objectStore('files').index('projectId');
    const req = idx.getAll(projectId);
    req.onsuccess = () => resolve((req.result as ProjectFile[]).sort((a, b) => a.path.localeCompare(b.path)));
    req.onerror = () => reject(req.error);
  });
}

export const files = {
  async list(projectId: string): Promise<ProjectFile[]> {
    return filesByProject(projectId);
  },
  async get(id: string): Promise<ProjectFile | undefined> {
    return tx<ProjectFile | undefined>('files', 'readonly', (s) => s.get(id));
  },
  async put(f: ProjectFile): Promise<void> {
    await tx<ProjectFile>('files', 'readwrite', (s) => s.put(f) as IDBRequest<ProjectFile>);
  },
  async delete(id: string): Promise<void> {
    await tx('files', 'readwrite', (s) => s.delete(id) as IDBRequest<unknown>);
  },
  async rename(id: string, newPath: string): Promise<void> {
    const f = await this.get(id);
    if (!f) return;
    f.path = newPath;
    f.updatedAt = Date.now();
    await this.put(f);
  },
};

// ---------------- File versions ----------------
export const fileVersions = {
  async list(fileId: string): Promise<FileVersion[]> {
    const db = await openDb();
    return new Promise<FileVersion[]>((resolve, reject) => {
      const t = db.transaction('file_versions', 'readonly');
      const idx = t.objectStore('file_versions').index('fileId');
      const req = idx.getAll(fileId);
      req.onsuccess = () => resolve((req.result as FileVersion[]).sort((a, b) => b.savedAt - a.savedAt));
      req.onerror = () => reject(req.error);
    });
  },
  async add(v: FileVersion): Promise<void> {
    await tx<FileVersion>('file_versions', 'readwrite', (s) => s.put(v) as IDBRequest<FileVersion>);
  },
  async delete(id: string): Promise<void> {
    await tx('file_versions', 'readwrite', (s) => s.delete(id) as IDBRequest<unknown>);
  },
};

// ---------------- Tool history ----------------
export const toolHistory = {
  async list(): Promise<ToolHistoryEntry[]> {
    const all = await txAll<ToolHistoryEntry>('tool_history', 'readonly');
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  },
  async add(e: ToolHistoryEntry): Promise<void> {
    await tx<ToolHistoryEntry>('tool_history', 'readwrite', (s) => s.put(e) as IDBRequest<ToolHistoryEntry>);
  },
  async clear(): Promise<void> {
    await tx('tool_history', 'readwrite', (s) => s.clear() as IDBRequest<unknown>);
  },
};

// ---------------- Favorites ----------------
export const favorites = {
  async list(): Promise<FavoriteTool[]> {
    const all = await txAll<FavoriteTool>('favorites', 'readonly');
    return all.sort((a, b) => b.addedAt - a.addedAt);
  },
  async add(id: string): Promise<void> {
    await tx<FavoriteTool>('favorites', 'readwrite', (s) => s.put({ id, addedAt: Date.now() }) as IDBRequest<FavoriteTool>);
  },
  async remove(id: string): Promise<void> {
    await tx('favorites', 'readwrite', (s) => s.delete(id) as IDBRequest<unknown>);
  },
  async has(id: string): Promise<boolean> {
    const v = await tx<FavoriteTool | undefined>('favorites', 'readonly', (s) => s.get(id));
    return !!v;
  },
};

// ---------------- Activity ----------------
export const activity = {
  async list(): Promise<ActivityEntry[]> {
    const all = await txAll<ActivityEntry>('activity', 'readonly');
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  },
  async add(e: ActivityEntry): Promise<void> {
    await tx<ActivityEntry>('activity', 'readwrite', (s) => s.put(e) as IDBRequest<ActivityEntry>);
  },
  async clear(): Promise<void> {
    await tx('activity', 'readwrite', (s) => s.clear() as IDBRequest<unknown>);
  },
};

// ---------------- AI history ----------------
export const aiHistory = {
  async list(): Promise<AIRequestRecord[]> {
    const all = await txAll<AIRequestRecord>('ai_history', 'readonly');
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  },
  async add(e: AIRequestRecord): Promise<void> {
    await tx<AIRequestRecord>('ai_history', 'readwrite', (s) => s.put(e) as IDBRequest<AIRequestRecord>);
  },
  async clear(): Promise<void> {
    await tx('ai_history', 'readwrite', (s) => s.clear() as IDBRequest<unknown>);
  },
};

// ---------------- Backup / Restore ----------------
export async function exportBackup(): Promise<string> {
  const dump = {
    version: DB_VERSION,
    exportedAt: Date.now(),
    projects: await projects.list(),
    files: await txAll<ProjectFile>('files', 'readonly'),
    file_versions: await txAll<FileVersion>('file_versions', 'readonly'),
    tool_history: await toolHistory.list(),
    favorites: await favorites.list(),
    activity: await activity.list(),
    ai_history: await aiHistory.list(),
  };
  return JSON.stringify(dump, null, 2);
}

export async function importBackup(json: string, replace = false): Promise<void> {
  const data = JSON.parse(json) as {
    projects?: Project[];
    files?: ProjectFile[];
    file_versions?: FileVersion[];
    tool_history?: ToolHistoryEntry[];
    favorites?: FavoriteTool[];
    activity?: ActivityEntry[];
    ai_history?: AIRequestRecord[];
  };
  const stores: StoreName[] = ['projects', 'files', 'file_versions', 'tool_history', 'favorites', 'activity', 'ai_history'];
  if (replace) {
    for (const s of stores) {
      await tx(s, 'readwrite', (st) => st.clear() as IDBRequest<unknown>);
    }
  }
  if (data.projects) for (const p of data.projects) await projects.put(p);
  if (data.files) for (const f of data.files) await files.put(f);
  if (data.file_versions) for (const v of data.file_versions) await fileVersions.add(v);
  if (data.tool_history) for (const h of data.tool_history) await toolHistory.add(h);
  if (data.favorites) for (const f of data.favorites) await favorites.add(f.id).catch(() => {});
  if (data.activity) for (const a of data.activity) await activity.add(a);
  if (data.ai_history) for (const h of data.ai_history) await aiHistory.add(h);
}
