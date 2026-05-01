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

## Creating Cross-Fork Pull Requests

This repo's branches follow the pattern `pgfeller/issue<N>` (branch name contains a slash).
When creating a PR from fork `pgfeller/openhab-vscode` into `openhab/openhab-vscode`, use
`owner:branch` format for `--head` — never `owner/branch`:

```bash
gh pr create --draft --repo openhab/openhab-vscode --base main --head pgfeller:pgfeller/issue334 --title "..." --body "..."
```

See the global `github-pr-cli.instructions.md` for the general rule and rationale.
