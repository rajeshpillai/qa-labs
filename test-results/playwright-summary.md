# Playwright Test Results — 2026-04-16 (After Fixes)

## Summary

- **Total**: 366 tests
- **Passed**: 359 (98%)
- **Failed**: 7 (2%)
- **Duration**: 4.5 minutes
- **Katas fully passing**: 40/44 (91%)

## Progress

| Run | Passed | Failed | Duration |
|-----|--------|--------|----------|
| Initial | 299 (82%) | 67 | 12.5 min |
| After fixes | 359 (98%) | 7 | 4.5 min |

## Remaining Failures (7)

| Kata | Test | Issue |
|------|------|-------|
| 21 tabs-and-windows | ex 2: verify new tab URL | Expected "terms.html" in URL but `serve` redirects to clean URL |
| 21 tabs-and-windows | ex 7: switch between multiple tabs | `terms-accepted` stays "No" (postMessage delivery issue) |
| 33 session-management | ex 3: refresh session before expiry | Timer shows "10s" instead of "15s" |
| 33 session-management | ex 4: let session expire | Expired overlay doesn't show (fake clock timing) |
| 33 session-management | ex 5: re-login after expiry | Same as ex 4 |
| 38 visual-regression | ex 1: full page screenshot | 296 pixels differ (minor rendering) |
| 40 test-data-and-fixtures | ex 6: error scenario | Expected `status-error` class, got `status-message` |

## Root Causes

- **Kata 21**: `npx serve` strips .html extension by default. Previous fix attempt with `serve.json` broke other tests. Alternative: test should expect the cleaned URL or use a different serving strategy.
- **Kata 33**: Session management with fake clock — complex timing interactions, needs deeper investigation.
- **Kata 38**: Screenshot baseline was generated on a different render. Can be fixed with `--update-snapshots`.
- **Kata 40**: Playground doesn't add error class on submission — minor playground bug.
