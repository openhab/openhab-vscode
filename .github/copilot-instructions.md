## GitHub Issue & Pull Request Operations

Always use the `gh` CLI to interact with GitHub issues and pull requests instead of navigating to GitHub URLs in a browser.

Preferred commands:

- `gh issue view <number>` — fetch issue details
- `gh issue edit <number> --title "..." --body "..."` — update an issue
- `gh issue create --title "..." --body "..."` — create an issue
- `gh issue list` — list issues
- `gh issue close <number>` — close an issue
- `gh pr view [<number>]` — fetch PR details
- `gh pr edit <number> --title "..." --body "..."` — update a PR
- `gh pr create` — create a PR
- `gh pr list` — list PRs

Never open a browser page to a GitHub issue or pull request URL to read or edit it.

## JS/TS Coding Best Practices

### Guard clauses (early returns)

When a function's entire body is wrapped in a single `if` block with no `else`, invert the condition and return early instead. This eliminates a level of indentation and makes the no-op path explicit.

```javascript
// ❌ Anti-pattern — entire body inside one if block
async restartIfConfigChanged(host, port) {
  if (host !== this.host || port !== this.port) {
    this.stop()
    const err = await this.start(host, port)
    return err
  }
}

// ✅ Preferred — guard clause, no-op path is explicit
async restartIfConfigChanged(host, port) {
  if (host === this.host && port === this.port) {
    return
  }
  this.stop()
  const err = await this.start(host, port)
  return err
}
```

The ESLint rule `unicorn/prefer-early-return` (from `eslint-plugin-unicorn`) enforces this pattern automatically. It is tracked for addition in issue #334.

## Code Review Checklist

When reviewing code in this repository, check for:

- **Guard-clause opportunities:** Any function whose entire body is a single `if` block (no `else`) should use an early return instead. Flag with the guard-clause pattern above.
- **Strict equality (`===`):** The `eqeqeq` rule is currently disabled due to existing violations (issue #334), but all **new** code must use `===` and `!==`. Flag any `==` or `!=` introduced in the PR diff.
- **Curly braces:** The `curly` rule is currently `'off'` (issue #334), but **new** code should include braces around all control-flow bodies (`if`, `else`, `for`, `while`). Flag omissions in newly added lines.
