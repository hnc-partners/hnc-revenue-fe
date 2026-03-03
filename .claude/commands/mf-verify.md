---
description: Verify all MF apps render correctly in headless browser
---

Quick verification that shell and all micro-frontends render correctly in headless browser.

**Arguments**: $ARGUMENTS (optional: specific MF name or "screenshots" flag)

## Usage

```
/mf-verify              # Check all MFs, report only
/mf-verify screenshots  # Check all MFs + take screenshots
/mf-verify shell        # Check only shell
/mf-verify labels       # Check only labels MF
```

## MF Routes to Verify

| MF | URL | Expected Title |
|----|-----|----------------|
| shell | https://hncms-shell.scarif-0.duckdns.org/ | HNC Partners |
| labels | https://hncms-shell.scarif-0.duckdns.org/labels | HNC Partners |
| brands | https://hncms-shell.scarif-0.duckdns.org/brands | HNC Partners |
| contacts | https://hncms-shell.scarif-0.duckdns.org/contacts | HNC Partners |
| deals | https://hncms-shell.scarif-0.duckdns.org/deals | HNC Partners |
| gaming-accounts | https://hncms-shell.scarif-0.duckdns.org/gaming-accounts | HNC Partners |

## Execution Steps

For each MF (or specified MF):

1. **Navigate**:
   ```bash
   ab --session mf-verify open "<url>"
   ```

2. **Check for JS errors**:
   ```bash
   ab --session mf-verify errors
   ```
   - If errors found: Mark as FAIL, capture error text

3. **Check console for MF-specific issues**:
   ```bash
   ab --session mf-verify console
   ```
   - Look for: "e is not a function", "loadShare", "ChunkLoadError"

4. **Take screenshot** (if screenshots flag):
   ```bash
   ab --session mf-verify screenshot /artifacts/screenshots/verification/mf-<name>-$(date +%Y%m%d-%H%M%S).png
   ```

5. **Clear for next** (console resets between navigations)

6. **Close session when done**:
   ```bash
   ab --session mf-verify close
   ```

## Output Format

```
┌─ MF VERIFICATION ────────────────────────────────────────────┐
│ Shell      ✓ OK                                              │
│ Labels     ✓ OK                                              │
│ Brands     ✓ OK                                              │
│ Contacts   ✓ OK                                              │
│ Deals      ✓ OK                                              │
│ Gaming     ✓ OK                                              │
├──────────────────────────────────────────────────────────────┤
│ Result: 6/6 PASSED                                           │
└──────────────────────────────────────────────────────────────┘
```

Or if failures:

```
┌─ MF VERIFICATION ────────────────────────────────────────────┐
│ Shell      ✗ FAIL - TypeError: e is not a function          │
│ Labels     ✓ OK                                              │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│ Result: 5/6 PASSED, 1 FAILED                                 │
└──────────────────────────────────────────────────────────────┘
```

## Error Patterns to Flag

| Pattern | Meaning |
|---------|---------|
| `e is not a function` | MF runtime crash (PLAN-015) |
| `loadShare` | Shared dependency loading failure |
| `ChunkLoadError` | Module chunk failed to load |
| `Failed to fetch` | Network/CORS issue |
| `401` | Auth required (expected if not logged in) |

## When to Use

- After deploying any MF
- After shell changes
- Before concluding FE sessions
- Debugging MF loading issues

## Related

- `/browser-test` - General browser testing commands
- `/redeploy-fe` - Redeploy frontend services
- `/health` - Backend health checks
