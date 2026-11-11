// Global DEVKIT app store (Zustand)

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppSettings,
  NavSection,
  ThemeId,
  Language,
  AIProvider,
  AIChatMessage,
} from './types';

interface AppState {
  // navigation
  section: NavSection;
  setSection: (s: NavSection) => void;

  activeTool: string | null;
  setActiveTool: (id: string | null) => void;

  // settings (persisted to localStorage — non-sensitive prefs only)
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setTheme: (t: ThemeId) => void;
  setLanguage: (l: Language) => void;

  // providers (persisted metadata; key NOT stored here)
  providers: AIProvider[];
  setProviders: (p: AIProvider[]) => void;
  upsertProvider: (p: AIProvider) => void;
  removeProvider: (id: string) => void;
  setDefaultProvider: (id: string) => void;

  // chat (in-memory only; messages stored in IndexedDB if user opts in)
  chat: AIChatMessage[];
  addChat: (m: AIChatMessage) => void;
  updateChat: (id: string, patch: Partial<AIChatMessage>) => void;
  clearChat: () => void;

  // github session state (in-memory only; tokens never in localStorage)
  githubConnected: boolean;
  githubUser: { login: string; name: string; avatar: string } | null;
  setGithubSession: (connected: boolean, user: { login: string; name: string; avatar: string } | null) => void;

  // notifications
  notifications: { id: string; title: string; body: string; createdAt: number; read: boolean }[];
  pushNotification: (n: { title: string; body: string }) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'premium-dark',
  language: 'en',
  fontSize: 14,
  autoSave: true,
  autoSaveDelayMs: 1500,
  tabSize: 2,
  notifications: true,
  privacyTelemetry: false,
  githubAutoPush: false,
  githubAutoPushRepos: [],
  githubAutoPushBranches: [],
  githubProtectMain: true,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      section: 'home',
      setSection: (s) => set({ section: s, activeTool: null }),

      activeTool: null,
      setActiveTool: (id) => set({ activeTool: id }),

      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setTheme: (t) => set({ settings: { ...get().settings, theme: t } }),
      setLanguage: (l) => set({ settings: { ...get().settings, language: l } }),

      providers: [],
      setProviders: (p) => set({ providers: p }),
      upsertProvider: (p) => {
        const existing = get().providers;
        const idx = existing.findIndex((x) => x.id === p.id);
        let next: AIProvider[];
        if (idx >= 0) {
          next = [...existing];
          next[idx] = p;
        } else {
          next = [...existing, p];
        }
        // enforce single default
        if (p.isDefault) {
          next = next.map((x) => (x.id === p.id ? x : { ...x, isDefault: false }));
        }
        set({ providers: next });
      },
      removeProvider: (id) => set({ providers: get().providers.filter((x) => x.id !== id) }),
      setDefaultProvider: (id) =>
        set({
          providers: get().providers.map((x) => ({ ...x, isDefault: x.id === id })),
        }),

      chat: [],
      addChat: (m) => set({ chat: [...get().chat, m] }),
      updateChat: (id, patch) =>
        set({ chat: get().chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      clearChat: () => set({ chat: [] }),

      githubConnected: false,
      githubUser: null,
      setGithubSession: (connected, user) => set({ githubConnected: connected, githubUser: user }),

      notifications: [],
      pushNotification: (n) =>
        set({
          notifications: [
            {
              id: crypto.randomUUID(),
              title: n.title,
              body: n.body,
              createdAt: Date.now(),
              read: false,
            },
            ...get().notifications,
          ].slice(0, 30),
        }),
      markAllRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'devkit-prefs',
      storage: createJSONStorage(() => localStorage),
      // Persist only non-sensitive preferences
      partialize: (s) => ({
        settings: s.settings,
        providers: s.providers, // metadata only — no key material
      }),
    },
  ),
);
