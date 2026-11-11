#!/bin/bash
# Test all 10 AI modes against the OpenRouter proxy.
# This proves the AI section works end-to-end with a real provider.

set -e
PROVIDER="env-openrouter-default"
URL="http://localhost:3000/api/ai/proxy"

test_mode() {
  local mode="$1"
  local system="$2"
  local user="$3"
  local needs_code="$4"
  local code="$5"

  echo "=========================================="
  echo "MODE: $mode"
  echo "=========================================="

  local full_prompt="$user"
  if [ "$needs_code" = "1" ]; then
    full_prompt="$user

CODE:
\`\`\`
$code
\`\`\`"
  fi

  local body=$(jq -n \
    --arg pid "$PROVIDER" \
    --arg sp "$system" \
    --arg up "$full_prompt" \
    '{providerId:$pid, systemPrompt:$sp, userPrompt:$up}')

  local response=$(curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    --max-time 60 \
    -d "$body" 2>&1)

  if echo "$response" | jq -e .text 2>/dev/null > /dev/null; then
    echo "✓ Response:"
    echo "$response" | jq -r '.text' | head -10
    echo "---"
    echo "Tokens used: $(echo "$response" | jq -r '.usage.total_tokens // "?"')"
  else
    echo "✗ Error response:"
    echo "$response" | head -5
  fi
  echo ""
}

# Mode 1: AI Chat
test_mode "chat" \
  "You are a helpful, concise coding assistant. Wrap code in fenced code blocks." \
  "What's the difference between let and const in JavaScript? One short paragraph." \
  0 ""

# Mode 2: AI Code Generator
test_mode "code-generator" \
  "You are a code generator. Output only the code, wrapped in a fenced code block with a language tag. No explanations." \
  "A JavaScript function that returns the sum of two numbers." \
  0 ""

# Mode 3: AI Code Explainer (needs code)
test_mode "code-explainer" \
  "You are a code explainer. Explain the provided code clearly and concisely." \
  "Explain what this code does briefly." \
  1 "const sum = (a, b) => a + b;"

# Mode 4: AI Code Reviewer (needs code)
test_mode "code-reviewer" \
  "You are a code reviewer. List specific issues with line references where possible. Suggest concrete fixes." \
  "Review this code for any issues." \
  1 "function add(a, b) { return a + b; }"

# Mode 5: AI Bug Assistant (needs code)
test_mode "bug-assistant" \
  "You are a bug-finding assistant. Identify likely root cause and propose a fix." \
  "This code throws 'Cannot read property of undefined'. Find the bug." \
  1 "function getUser(user) { return user.profile.name; }"

# Mode 6: AI Code Fixer (needs code)
test_mode "code-fixer" \
  "You are a code fixer. Output the corrected code in a single fenced code block with a language tag, then a short summary." \
  "Fix the syntax error." \
  1 "function greet(name { return 'Hello ' + name; }"

# Mode 7: AI Regex Builder
test_mode "regex-builder" \
  "You are a regex builder. Output only the regex pattern on the first line, then a brief explanation, then example matches." \
  "Match a valid email address." \
  0 ""

# Mode 8: AI SQL Assistant
test_mode "sql-assistant" \
  "You are a SQL assistant. Output only SQL in a fenced code block, then a brief explanation." \
  "Find all users who signed up in the last 30 days." \
  0 ""

# Mode 9: AI Documentation Generator
test_mode "doc-generator" \
  "You are a documentation generator. Output clean Markdown documentation." \
  "Write a JSDoc comment for a function that returns the sum of two numbers." \
  0 ""

# Mode 10: Code Translation Assistant (needs code)
test_mode "code-translator" \
  "You are a code translator. Translate the provided code to the target language. Output only the translated code in a fenced code block." \
  "Translate this JavaScript to Python." \
  1 "const sum = (a, b) => a + b;"

echo ""
echo "=========================================="
echo "ALL 10 MODES TESTED"
echo "=========================================="
