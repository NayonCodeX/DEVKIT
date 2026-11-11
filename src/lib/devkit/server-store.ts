// Server-side in-memory store for AI provider keys.
// IMPORTANT: This is a single-process demo store. In production, use a real
// secret manager (e.g. AWS Secrets Manager, HashiCorp Vault, Doppler) or store
// encrypted rows in a database with a KMS-encrypted master key.
// Keys are NEVER exposed to the client after being stored.

import type { AIProvider } from '@/lib/devkit/types';

interface StoredKey {
  providerId: string;
  kind: 'openai' | 'gemini' | 'anthropic' | 'custom';
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
