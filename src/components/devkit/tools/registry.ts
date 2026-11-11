// Tool registry — single source of truth for tool list, search, and categories.

import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  Code2,
  Binary,
  Link2,
  ShieldCheck,
  KeyRound,
  Hash,
  Fingerprint,
  Regex,
  Clock,
  Palette,
  QrCode,
  GitCompare,
  Type,
  FileJson,
  FileCode2,
  Database,
  FileText,
  Sparkles,
  Binary as BinaryIcon,
  Languages,
  Hash as HashIcon,
} from 'lucide-react';

export type ToolCategory =
  | 'Code & Data'
  | 'Encoding'
  | 'Security & Utilities'
  | 'Design'
  | 'Other';

export interface ToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  icon: LucideIcon;
  description: string;
  keywords?: string[];
}

export const TOOL_REGISTRY: ToolDef[] = [
  // ---- Code & Data ----
  { id: 'json-formatter', name: 'JSON Formatter & Validator', category: 'Code & Data', icon: Braces, description: 'Pretty-print, minify, and validate JSON.' },
  { id: 'xml-formatter', name: 'XML Formatter', category: 'Code & Data', icon: FileCode2, description: 'Format and indent XML documents.' },
  { id: 'html-formatter', name: 'HTML Formatter', category: 'Code & Data', icon: Code2, description: 'Pretty-print HTML structure.' },
  { id: 'css-formatter', name: 'CSS Formatter', category: 'Code & Data', icon: HashIcon, description: 'Indent CSS rules consistently.' },
  { id: 'js-formatter', name: 'JavaScript Formatter', category: 'Code & Data', icon: FileJson, description: 'Basic JS indentation (line breaks).' },
  { id: 'yaml-formatter', name: 'YAML Formatter', category: 'Code & Data', icon: FileText, description: 'Normalize YAML spacing.' },
  { id: 'sql-formatter', name: 'SQL Formatter', category: 'Code & Data', icon: Database, description: 'Uppercase keywords and break lines.' },
  { id: 'markdown-preview', name: 'Markdown Preview', category: 'Code & Data', icon: FileText, description: 'Render Markdown to HTML preview.' },

  // ---- Encoding ----
  { id: 'base64', name: 'Base64 Encode/Decode', category: 'Encoding', icon: Binary, description: 'UTF-8 safe Base64 encode/decode.' },
  { id: 'url-encode', name: 'URL Encode/Decode', category: 'Encoding', icon: Link2, description: 'encodeURIComponent and decode.' },
  { id: 'html-entity', name: 'HTML Entity Encode/Decode', category: 'Encoding', icon: Code2, description: 'Escape and unescape HTML entities.' },
  { id: 'jwt-decoder', name: 'JWT Decoder', category: 'Encoding', icon: ShieldCheck, description: 'Decode JWT header/payload (signature NOT verified).' },
  { id: 'unicode-converter', name: 'Unicode Converter', category: 'Encoding', icon: Languages, description: 'Convert text ↔ Unicode escape sequences.' },
  { id: 'hex-converter', name: 'Hex Converter', category: 'Encoding', icon: BinaryIcon, description: 'Convert text ↔ hexadecimal.' },

  // ---- Security & Utilities ----
  { id: 'sha', name: 'SHA-256 / 384 / 512', category: 'Security & Utilities', icon: KeyRound, description: 'Web Crypto SHA-2 hashes.' },
  { id: 'uuid', name: 'UUID Generator', category: 'Security & Utilities', icon: Fingerprint, description: 'Generate RFC 4122 v4 UUIDs.' },
  { id: 'password', name: 'Password Generator', category: 'Security & Utilities', icon: KeyRound, description: 'Strong cryptographically-secure passwords.' },
  { id: 'random-string', name: 'Random String Generator', category: 'Security & Utilities', icon: Hash, description: 'Random strings from a custom charset.' },
  { id: 'regex-tester', name: 'Regex Tester', category: 'Security & Utilities', icon: Regex, description: 'Test JS regex with flags & matches.' },
  { id: 'timestamp', name: 'Timestamp Converter', category: 'Security & Utilities', icon: Clock, description: 'Unix epoch ↔ human-readable time.' },

  // ---- Design ----
  { id: 'color-converter', name: 'HEX / RGB / HSL Converter', category: 'Design', icon: Palette, description: 'Convert between color formats.' },
  { id: 'color-picker', name: 'Color Picker', category: 'Design', icon: Palette, description: 'Pick a color and copy in any format.' },
  { id: 'gradient-generator', name: 'Gradient Generator', category: 'Design', icon: Sparkles, description: 'Build CSS gradients visually.' },
  { id: 'shadow-generator', name: 'CSS Shadow Generator', category: 'Design', icon: Sparkles, description: 'Generate box-shadow CSS.' },
  { id: 'border-radius', name: 'Border Radius Generator', category: 'Design', icon: Sparkles, description: 'Visual border-radius with CSS output.' },
  { id: 'css-unit', name: 'CSS Unit Converter', category: 'Design', icon: Hash, description: 'px ↔ rem ↔ em ↔ % (given root).' },

  // ---- Other ----
  { id: 'qr-generator', name: 'QR Code Generator', category: 'Other', icon: QrCode, description: 'Generate QR codes from text or URLs.' },
  { id: 'qr-scanner', name: 'QR Scanner', category: 'Other', icon: QrCode, description: 'Scan QR codes with the device camera.' },
  { id: 'diff-checker', name: 'Text Diff Checker', category: 'Other', icon: GitCompare, description: 'Line-based diff between two texts.' },
  { id: 'word-counter', name: 'Word / Character Counter', category: 'Other', icon: Type, description: 'Counts words, characters, lines, sentences.' },
];
