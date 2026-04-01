#!/usr/bin/env bash
# PreToolUse hook: block browser navigation to GitHub issue/PR URLs.
# Instructs the agent to use `gh` CLI instead.
#
# Input: JSON on stdin with tool name and parameters.
# Output: JSON on stdout with permissionDecision.

set -euo pipefail

input=$(cat)

tool_name=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('toolName',''))" 2>/dev/null || true)

# Only inspect browser/page navigation tools
if [[ "$tool_name" != "open_browser_page" && "$tool_name" != "navigate_page" ]]; then
  exit 0
fi

url=$(echo "$input" | python3 -c "
import sys, json
d = json.load(sys.stdin)
params = d.get('toolParameters', d.get('parameters', {}))
print(params.get('url', ''))
" 2>/dev/null || true)

if echo "$url" | grep -qE 'github\.com/[^/]+/[^/]+/(issues|pull)/[0-9]+'; then
  echo '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": "Use the gh CLI instead of a browser to interact with GitHub issues and pull requests (see copilot-instructions.md). Example: gh issue view <number> or gh pr view <number>."
    }
  }'
  exit 0
fi

exit 0
