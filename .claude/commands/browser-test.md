---
description: Headless browser testing using agent-browser
---

Headless browser automation using agent-browser CLI.

**Arguments**: $ARGUMENTS

## Commands

Parse the first word of $ARGUMENTS to determine command:

| Command | Usage | Description |
|---------|-------|-------------|
| `open` | `/browser-test open <url>` | Navigate to URL |
| `screenshot` | `/browser-test screenshot [path]` | Capture screenshot |
| `errors` | `/browser-test errors` | Get JS exceptions |
| `console` | `/browser-test console` | Get console output |
| `snapshot` | `/browser-test snapshot` | Get accessibility tree |
| `close` | `/browser-test close` | Close browser session |

## Execution

Use the `ab` wrapper script (symlinked to agent-browser):

```bash
ab [--session <name>] <command> [args]
```

### Examples

**Navigate and check for errors**:
```bash
ab --session test open "https://hncms-shell.scarif-0.duckdns.org/contacts"
ab --session test errors
ab --session test console
```

**Take screenshot**:
```bash
ab --session test screenshot /tmp/verify.png
```

**Full verification flow**:
```bash
ab --session verify open "$URL"
ab --session verify errors
ab --session verify screenshot /artifacts/screenshots/verification/$(date +%Y%m%d-%H%M%S).png
ab --session verify close
```

## Session Management

- Use `--session <name>` to maintain isolated browser contexts
- Sessions persist until explicitly closed
- List active: `ab session list`
- Close session: `ab --session <name> close`

## Output

- Report results clearly to user
- If errors found, display them
- If screenshot taken, show the path
- For `snapshot`, summarize key elements found

## When to Use

- Verifying FE deployments work
- Checking for JS errors in headless mode
- Taking verification screenshots
- Testing MF loading

## Related

- `/mf-verify` - Quick verification of all MF apps
- `/health` - Backend service health checks
