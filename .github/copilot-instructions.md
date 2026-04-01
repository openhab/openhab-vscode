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
