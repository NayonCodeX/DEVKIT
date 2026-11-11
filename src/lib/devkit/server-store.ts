// Server-side in-memory store for AI provider keys.
// IMPORTANT: This is a single-process demo store. In production, use a real
// secret manager (e.g. AWS Secrets Manager, HashiCorp Vault, Doppler) or store
// encrypted rows in a database with a KMS-encrypted master key.
// Keys are NEVER exposed to the client after being stored.

import type { AIProvider } from '@/lib/devkit/types';

interface StoredKey {
  providerId: string;
  kind: 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'custom';
  key: string;
  storedAt: number;
}

const keys = new Map<string, StoredKey>();

export function setKey(providerId: string, kind: StoredKey['kind'], key: string) {
  keys.set(providerId, { providerId, kind, key, storedAt: Date.now() });
}

export function getKey(providerId: string): StoredKey | undefined {
  return keys.get(providerId);
}

export function deleteKey(providerId: string) {
  keys.delete(providerId);
}

// Provider metadata is also stored here (so the backend can resolve provider
// info without trusting the client). The client keeps its own copy in IndexedDB
// for offline listing.
const providerMeta = new Map<string, AIProvider>();

export function setProviderMeta(p: AIProvider) {
  providerMeta.set(p.id, p);
}

export function getProviderMeta(providerId: string): AIProvider | undefined {
  return providerMeta.get(providerId);
}

export function listProviderMeta(): AIProvider[] {
  return Array.from(providerMeta.values());
}

// On module load, auto-register an OpenRouter provider if the env var is set.
// This lets the user get a working AI provider without manually configuring it.
// They can still add more providers via the Settings UI.
const OPENROUTER_PROVIDER_ID = 'env-openrouter-default';
const OPENROUTER_DEFAULT_MODEL = 'nvidia/nemotron-3.5-lightning:free';
const OPENROUTER_FREE_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'cohere/north-mini-code:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
];
export { OPENROUTER_PROVIDER_ID, OPENROUTER_DEFAULT_MODEL, OPENROUTER_FREE_MODELS };

if (process.env.OPENROUTER_API_KEY) {
  setProviderMeta({
    id: OPENROUTER_PROVIDER_ID,
    name: 'OpenRouter (env)',
    kind: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1',
    model: OPENROUTER_DEFAULT_MODEL,
    enabled: true,
    isDefault: true,
    createdAt: Date.now(),
    hasKey: true,
  });
  setKey(OPENROUTER_PROVIDER_ID, 'openrouter', process.env.OPENROUTER_API_KEY);
}
// Same pattern for the other providers if their env vars are set.
if (process.env.OPENAI_API_KEY) {
  setProviderMeta({
    id: 'env-openai-default',
    name: 'OpenAI (env)',
    kind: 'openai',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    enabled: true,
    isDefault: !process.env.OPENROUTER_API_KEY,
    createdAt: Date.now(),
    hasKey: true,
  });
  setKey('env-openai-default', 'openai', process.env.OPENAI_API_KEY);
}
if (process.env.GEMINI_API_KEY) {
  setProviderMeta({
    id: 'env-gemini-default',
    name: 'Gemini (env)',
    kind: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com',
    model: 'gemini-flash-latest',
    enabled: true,
    isDefault: !process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY,
    createdAt: Date.now(),
    hasKey: true,
  });
  setKey('env-gemini-default', 'gemini', process.env.GEMINI_API_KEY);
}
if (process.env.ANTHROPIC_API_KEY) {
  setProviderMeta({
    id: 'env-anthropic-default',
    name: 'Anthropic (env)',
    kind: 'anthropic',
    endpoint: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-latest',
    enabled: true,
    isDefault: !process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY,
    createdAt: Date.now(),
    hasKey: true,
  });
  setKey('env-anthropic-default', 'anthropic', process.env.ANTHROPIC_API_KEY);
}
