// Utility helpers: copy, download, crypto, formatting

'use client';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Web Crypto helpers
export async function sha(message: string, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest(algorithm, buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function uuidv4(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function randomString(len: number, charset: string): string {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += charset[arr[i] % charset.length];
  return out;
}

export function generatePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}): string {
  const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = 'abcdefghijklmnopqrstuvwxyz';
  const D = '0123456789';
  const S = '!@#$%^&*()-_=+[]{};:,.<>?';
  let set = '';
  if (opts.upper) set += U;
  if (opts.lower) set += L;
  if (opts.digits) set += D;
  if (opts.symbols) set += S;
  if (!set) set = L + D;
  return randomString(Math.max(4, opts.length), set);
}

// Base64 (UTF-8 safe)
export function b64encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function b64decode(input: string): string {
  const cleaned = input.replace(/\s+/g, '');
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// URL encode/decode
export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}
export function urlDecode(input: string): string {
  return decodeURIComponent(input.replace(/\+/g, ' '));
}

// HTML entities
export function htmlEntityEncode(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function htmlEntityDecode(input: string): string {
  const ta = document.createElement('textarea');
  ta.innerHTML = input;
  return ta.value;
}

// JWT decoder — NO signature verification is performed.
export interface JwtPayload {
  header: unknown;
  payload: unknown;
  signature: string;
  warnings: string[];
}
export function decodeJwt(token: string): JwtPayload {
  const warnings: string[] = [];
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: must have 3 dot-separated parts (header.payload.signature).');
  }
  const [h, p, s] = parts;
  const b64urlDecode = (str: string): unknown => {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    try {
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new Error('Failed to base64url-decode JWT segment.');
    }
  };
  const header = b64urlDecode(h);
  const payload = b64urlDecode(p);
  warnings.push('Signature is NOT verified. This tool decodes the contents only — it does not prove authenticity or integrity.');
  return { header, payload, signature: s, warnings };
}

// Color conversions
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// Simple text diff (line-based LCS)
export interface DiffLine { type: 'eq' | 'add' | 'del'; text: string; }
export function lineDiff(a: string, b: string): DiffLine[] {
  const la = a.split('\n');
  const lb = b.split('\n');
  const m = la.length, n = lb.length;
  // dp table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = la[i] === lb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (la[i] === lb[j]) {
      out.push({ type: 'eq', text: la[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: la[i] });
      i++;
    } else {
      out.push({ type: 'add', text: lb[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: 'del', text: la[i++] });
  while (j < n) out.push({ type: 'add', text: lb[j++] });
  return out;
}

// Formatters (pretty-print) using browser-native where possible
export function formatJson(input: string, indent = 2): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

export function validateJson(input: string): { ok: boolean; error?: string; pos?: { line: number; col: number } } {
  try {
    JSON.parse(input);
    return { ok: true };
  } catch (e) {
    const msg = (e as Error).message;
    // Try to extract position
    const m = msg.match(/position (\d+)/i);
    let pos: { line: number; col: number } | undefined;
    if (m) {
      const p = parseInt(m[1], 10);
      const before = input.slice(0, p);
      const line = before.split('\n').length;
      const col = p - before.lastIndexOf('\n');
      pos = { line, col };
    }
    return { ok: false, error: msg, pos };
  }
}

// SQL formatter (simple — keyword uppercasing + newlines)
const SQL_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'CREATE', 'TABLE', 'INDEX', 'ALTER', 'ADD', 'DROP', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

export function formatSql(input: string): string {
  let s = input.replace(/\s+/g, ' ').trim();
  for (const kw of SQL_KEYWORDS) {
    const re = new RegExp(`\\b${kw.replace(' ', '\\s+')}\\b`, 'gi');
    s = s.replace(re, kw);
  }
  // newlines before major keywords
  s = s.replace(/\b(SELECT|FROM|WHERE|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, '\n$1');
  return s.trim();
}

// XML/HTML formatter (simple)
export function formatXml(input: string): string {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  let xml = input.replace(reg, '$1\n$2$3');
  let formatted = '';
  let pad = 0;
  for (const line of xml.split('\n')) {
    const trim = line.trim();
    if (!trim) continue;
    let indent = 0;
    if (trim.match(/^<\/\w/)) pad = Math.max(0, pad - 1);
    if (trim.match(/^<\w[^>]*[^/]>.*$/) && !trim.match(/<\/\w/)) indent = 1;
    formatted += PADDING.repeat(pad) + trim + '\n';
    pad += indent;
  }
  return formatted.trim();
}

// CSS formatter (simple)
export function formatCss(input: string): string {
  let s = input
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/  ([^;]+);/g, '  $1;');
  return s.trim();
}

// YAML formatter — basic indentation by nesting level (best-effort)
export function formatYaml(input: string): string {
  // YAML is sensitive; we only normalize spacing and quote consistency.
  return input
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

// Markdown → HTML (very small subset; for the Markdown Preview tool only)
export function markdownToHtml(md: string): string {
  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false; }
      else { html += '<pre><code>'; inCode = true; }
      continue;
    }
    if (inCode) { html += esc(line) + '\n'; continue; }
    let l = esc(line);
    if (/^######\s+/.test(l)) l = l.replace(/^######\s+(.*)/, '<h6>$1</h6>');
    else if (/^#####\s+/.test(l)) l = l.replace(/^#####\s+(.*)/, '<h5>$1</h5>');
    else if (/^####\s+/.test(l)) l = l.replace(/^####\s+(.*)/, '<h4>$1</h4>');
    else if (/^###\s+/.test(l)) l = l.replace(/^###\s+(.*)/, '<h3>$1</h3>');
    else if (/^##\s+/.test(l)) l = l.replace(/^##\s+(.*)/, '<h2>$1</h2>');
    else if (/^#\s+/.test(l)) l = l.replace(/^#\s+(.*)/, '<h1>$1</h1>');
    else if (/^>\s+/.test(l)) l = l.replace(/^>\s+(.*)/, '<blockquote>$1</blockquote>');
    else if (/^[-*]\s+/.test(l)) {
      if (!inList) { html += '<ul>'; inList = true; }
      l = l.replace(/^[-*]\s+(.*)/, '<li>$1</li>');
    } else if (/^\d+\.\s+/.test(l)) {
      l = l.replace(/^\d+\.\s+(.*)/, '<li>$1</li>');
      if (!inList) { html += '<ol>'; inList = true; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
    }
    // inline bold/italic/code/link
    l = l.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
         .replace(/\*([^*]+)\*/g, '<em>$1</em>')
         .replace(/`([^`]+)`/g, '<code>$1</code>')
         .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
    html += l + '\n';
  }
  if (inList) html += '</ul>';
  if (inCode) html += '</code></pre>';
  return html;
}

// JS formatter — extremely small (line breaks after ; and { })
export function formatJs(input: string): string {
  let s = input;
  s = s.replace(/;\s*/g, ';\n  ');
  s = s.replace(/\{\s*/g, ' {\n  ');
  s = s.replace(/\}\s*/g, '\n}\n');
  s = s.replace(/,\s*/g, ', ');
  s = s.replace(/\n\s*\n/g, '\n');
  return s.trim();
}
