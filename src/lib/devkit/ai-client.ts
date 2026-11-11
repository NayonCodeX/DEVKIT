// Client-side AI helpers — used by the AI section to call our backend proxy.
// We never send raw API keys from the browser; the backend holds them.

'use client';

import type { AIProvider } from './types';

export interface AiRequest {
  providerId: string;
  mode: string;
  systemPrompt: string;
  userPrompt: string;
  context?: string;
  maxTokens?: number;
}

export interface AiResponse {
  ok: boolean;
  text: string;
  error?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export async function callAi(req: AiRequest): Promise<AiResponse> {
  try {
    const res = await fetch('/api/ai/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: req.providerId,
        systemPrompt: req.systemPrompt,
        userPrompt: req.userPrompt,
        context: req.context,
        maxTokens: req.maxTokens,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, text: '', error: data.error ?? `Request failed (${res.status})` };
    }
    return { ok: true, text: data.text ?? '', usage: data.usage };
  } catch (e) {
    return { ok: false, text: '', error: (e as Error).message };
  }
}

// Test a provider by sending a tiny hello request.
export async function testProvider(p: AIProvider): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: p.id }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error ?? `Failed (${res.status})` };
    return { ok: true, message: data.message ?? 'Connection successful.' };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// AI modes — used by the AI section
export interface AiMode {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  needsCode?: boolean;
  placeholder?: string;
}

export const AI_MODES: AiMode[] = [
  {
    id: 'chat',
    name: 'AI Chat',
    description: 'General-purpose coding chat.',
    systemPrompt: 'You are a helpful, concise coding assistant. Always wrap code in fenced code blocks with a language tag.',
    placeholder: 'Ask anything about programming...',
  },
  {
    id: 'code-generator',
    name: 'AI Code Generator',
    description: 'Generate code from a description.',
    systemPrompt: 'You are a code generator. Output only the code, wrapped in a fenced code block with a language tag. No explanations.',
    needsCode: false,
    placeholder: 'Describe the code you want, e.g. "A React hook that debounces a value..."',
  },
  {
    id: 'code-explainer',
    name: 'AI Code Explainer',
    description: 'Explain what code does.',
    systemPrompt: 'You are a code explainer. Explain the provided code clearly and concisely. Use bullet points where helpful.',
    needsCode: true,
    placeholder: 'Optionally describe what aspect you want explained...',
  },
  {
    id: 'code-reviewer',
    name: 'AI Code Reviewer',
    description: 'Review code for issues & improvements.',
    systemPrompt: 'You are a code reviewer. List specific issues (bugs, style, performance, security) with line references when possible. Suggest concrete fixes.',
    needsCode: true,
    placeholder: 'Optionally add focus areas (e.g. "focus on security")...',
  },
  {
    id: 'bug-assistant',
    name: 'AI Bug Assistant',
    description: 'Help diagnose a bug from code + error.',
    systemPrompt: 'You are a bug-finding assistant. Identify likely root cause and propose a fix.',
    needsCode: true,
    placeholder: 'Describe the bug, expected vs actual behavior, and any error message...',
  },
  {
    id: 'code-fixer',
    name: 'AI Code Fixer',
    description: 'Suggest corrected code.',
    systemPrompt: 'You are a code fixer. Output the corrected code in a single fenced code block with a language tag, then a short summary of changes underneath.',
    needsCode: true,
    placeholder: 'Describe what is wrong or what should be different...',
  },
  {
    id: 'regex-builder',
    name: 'AI Regex Builder',
    description: 'Generate a regex from a description.',
    systemPrompt: 'You are a regex builder. Output only the regex pattern (no slashes, no flags) on the first line, then a brief explanation, then example matches.',
    placeholder: 'Describe what to match, e.g. "Match international phone numbers..."',
  },
  {
    id: 'sql-assistant',
    name: 'AI SQL Assistant',
    description: 'Generate or explain SQL.',
    systemPrompt: 'You are a SQL assistant. Output only SQL in a fenced code block, then a brief explanation.',
    placeholder: 'Describe the query or schema, e.g. "Find top 10 customers by revenue..."',
  },
  {
    id: 'doc-generator',
    name: 'AI Documentation Generator',
    description: 'Generate README / JSDoc / API docs.',
    systemPrompt: 'You are a documentation generator. Output clean Markdown documentation for the provided code or description.',
    needsCode: false,
    placeholder: 'Describe the project or paste code to document...',
  },
  {
    id: 'code-translator',
    name: 'Code Translation Assistant',
    description: 'Translate code between languages.',
    systemPrompt: 'You are a code translator. Translate the provided code to the target language. Output only the translated code in a fenced code block with a language tag, then list any non-trivial changes.',
    needsCode: true,
    placeholder: 'Specify target language, e.g. "Translate this Python to TypeScript..."',
  },
];
