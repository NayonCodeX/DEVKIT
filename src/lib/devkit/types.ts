// DEVKIT core types

export type ThemeId = 'premium-dark' | 'light' | 'midnight' | 'ocean' | 'purple' | 'custom';
export type Language = 'en' | 'bn';

export type NavSection =
  | 'home'
  | 'tools'
  | 'ai'
  | 'workspace'
  | 'github'
  | 'settings';

export interface AIProvider {
  id: string;
  name: string;
  kind: 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'custom';
  endpoint: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: number;
  hasKey: boolean;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  language: string;
  updatedAt: number;
  createdAt: number;
}

export interface FileVersion {
  id: string;
  fileId: string;
  content: string;
  savedAt: number;
  reason?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
}

export interface ToolHistoryEntry {
  id: string;
  tool: string;
  input: string;
  output: string;
  createdAt: number;
}

export interface FavoriteTool {
  id: string;
  addedAt: number;
}

export interface ActivityEntry {
  id: string;
  kind: 'tool' | 'project' | 'ai' | 'github' | 'settings';
  message: string;
  createdAt: number;
}

export interface AppSettings {
  theme: ThemeId;
  customTheme?: Partial<ThemeColors>;
  language: Language;
  fontSize: number;
  autoSave: boolean;
  autoSaveDelayMs: number;
  tabSize: number;
  notifications: boolean;
  privacyTelemetry: boolean;
  githubAutoPush: boolean;
  githubAutoPushRepos: string[];
  githubAutoPushBranches: string[];
  githubProtectMain: boolean;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  pending?: boolean;
  error?: string;
}

export interface AIRequestRecord {
  id: string;
  providerId: string;
  providerName: string;
  mode: string;
  prompt: string;
  response: string;
  status: 'success' | 'error';
  error?: string;
  createdAt: number;
}
