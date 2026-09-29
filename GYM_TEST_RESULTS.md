# Gym QA Results

Run date: 2026-09-29
Branch: `main`
Commit under test: `2629aaa` plus local verification changes

## Status Rules

- `PASS`: executed and met the expected result.
- `FAIL`: executed and did not meet the expected result.
- `BLOCKED`: requires a browser/device, staging credentials, external provider, production backup, load runner, or an environment that is not available in this workspace. Blocked is not a pass.

## Automated Results

| Command | Status | Result |
|---|---|---|
| `backend/npm ci` | PASS | Clean install; 194 packages audited. |
| `backend/npm test` | PASS | 14 tests passed with live local MongoDB. |
| `backend/npm audit --omit=dev` | PASS | 0 vulnerabilities. |
| `backend/npm run db:indexes` | PASS | All registered model indexes synchronized. |
| `frontend/npm ci` | PASS | Clean install; 433 packages audited. |
| `frontend/npm run typecheck` | PASS | No TypeScript errors. |
| `frontend/npm run lint` | PASS | 0 errors; 67 existing warnings remain. |
| `frontend/npm run build` | PASS | Next.js production build generated 62 routes. |
| `frontend/npm audit --omit=dev` | PASS | 0 vulnerabilities. |

## Executed Case Status

### PASS

`AUTO-001` through `AUTO-009`, `AUTH-001`, `AUTH-002`, `SEC-003`, `PLAN-007`, `MEM-001`, `ATT-001`, `ATT-002`, `BILL-003`, `BILL-004`, `BILL-005`, `DEPLOY-001`, `DEPLOY-002`, `DEPLOY-003`, and `DEPLOY-006`.

These include live MongoDB tests for signup onboarding, tenant isolation of anonymous admin access, enrollment partial payment, renewal payment, billing overpayment protection, inventory, attendance deduplication, timezone helpers, readiness, and index provisioning.

### FAIL

None observed in the executed cases.

### BLOCKED

All other IDs in `GYM_TEST_CASES.md` are currently `BLOCKED`, not passed:

- `AUTO-010` through `AUTO-012`: Mongo outage and multi-process cron tests require controlled process orchestration.
- `AUTH-003` through `AUTH-018`: require a browser/staging account matrix, brute-force runner, or cross-origin test harness.
- `SEC-001`, `SEC-002`, and `SEC-004` through `SEC-014`: require adversarial two-tenant accounts and HTTP automation.
- `PLAN-001` through `PLAN-006` and `PLAN-008` through `PLAN-016`: require browser workflows and high-volume fixtures.
- `MEM-002` through `MEM-011`: require browser workflows and dedicated lifecycle fixtures.
- `ATT-003` through `ATT-015`: require timezone, mobile, correction, and permission scenarios.
- `BILL-001`, `BILL-002`, and `BILL-006` through `BILL-016`: require HTTP concurrency, PDF, export, and browser tests.
- `INV-001` through `INV-010`: require full inventory/POS, pagination, and mobile workflows.
- `CLASS-001` through `CLASS-011`: require staff/member portal and concurrent capacity tests.
- `OPS-001` through `OPS-010`: require browser/report/export and real notification-provider tests.
- `SET-001` through `SET-007`: require browser settings and timezone/channel verification.
- `PORTAL-001` through `PORTAL-008`: require browser/device portal tests and member sessions.
- `API-001` through `API-008`: require an HTTP security test runner and outage injection.
- `UI-001` through `UI-007`: require desktop/mobile browsers and accessibility tooling.
- `PERF-001` through `PERF-008`: require a load/concurrency runner and isolated high-volume database.
- `DEPLOY-004` through `DEPLOY-010`: require staging secrets, Atlas restore access, external cron, and hosting observability.

## Release Decision

The automated code/API gate passes. The product must not be marketed as fully verified until the blocked P0/P1 cases are executed on staging, especially payment concurrency, tenant isolation, mobile UI, Atlas restore, and real provider delivery.
