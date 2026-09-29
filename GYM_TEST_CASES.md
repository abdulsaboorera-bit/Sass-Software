# Gym SaaS Test Pack

This is the release test plan for the gym product. Execute it against a disposable staging database before every customer release. Record `PASS`, `FAIL`, or `BLOCKED` beside each case. A release is acceptable only when all P0/P1 cases pass and every blocked case has an approved owner and date.

## Test Setup

### Environments

- Local API: `http://localhost:4000`
- Local web: `http://localhost:3000`
- Staging web: the Vercel preview URL
- Staging API: the Render API URL
- Database: a disposable MongoDB database, never a production database

### Required test accounts

- Platform administrator
- Gym owner
- Receptionist
- Trainer with `members.view.assigned`
- Accountant
- Inventory manager
- A user with no active tenant membership
- A suspended user
- A suspended tenant
- Two tenants with similar member records

### Required test data

- At least three active plans, one archived plan, and one plan with a zero price
- Active, expired, frozen, cancelled, and future-start members
- Members assigned to different trainers
- At least one invoice in `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`, and `CANCELLED`
- At least 101 members, invoices, payments, inventory items, and attendance rows
- At least one class at capacity and one class with availability
- Inventory with stock above, at, and below minimum
- Expenses in every supported category and status
- Tenants in different timezones: UTC, Asia/Karachi, and Asia/Dubai

### Result fields

For each failed case capture the environment, account, request payload, response status/body, browser console, server log request ID, and a screenshot or video where relevant.

## Automated Gates

| ID | Priority | Action | Expected result |
|---|---|---|---|
| AUTO-001 | P0 | `cd backend && npm ci` | Clean install succeeds. |
| AUTO-002 | P0 | `cd backend && npm test` | All contract and MongoDB integration tests pass. |
| AUTO-003 | P0 | `cd backend && npm audit --omit=dev` | Zero production vulnerabilities. |
| AUTO-004 | P0 | `cd backend && npm run db:indexes` against staging | All schema indexes synchronize without duplicate/index errors. |
| AUTO-005 | P0 | `cd frontend && npm ci` | Clean install succeeds. |
| AUTO-006 | P0 | `cd frontend && npm run typecheck` | No TypeScript errors. |
| AUTO-007 | P1 | `cd frontend && npm run lint` | Zero errors; warnings are reviewed and tracked. |
| AUTO-008 | P0 | `cd frontend && npm run build` | Production build completes and all gym routes are generated. |
| AUTO-009 | P0 | `cd frontend && npm audit --omit=dev` | Zero production vulnerabilities. |
| AUTO-010 | P0 | Start API without MongoDB and call `/health/ready` | Returns `503`, never a false `200`. |
| AUTO-011 | P0 | Start API with missing production secrets | Startup fails closed with a clear configuration error. |
| AUTO-012 | P1 | Run two concurrent daily jobs | One job is skipped or safely idempotent; no duplicate notifications or state corruption. |

## Onboarding and Authentication

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| AUTH-001 | P0 | Submit `/signup` with a valid gym name, `GYM`, owner name, email, and password. | A trial tenant, owner role, tenant membership, cookies, and dashboard session are created. |
| AUTH-002 | P0 | Complete signup, then request `/api/admin/tenants` without changing the account. | Returns `401/403`; the new owner is not a platform admin. |
| AUTH-003 | P0 | Signup with an existing email. | Returns `409`; no second tenant or user is created. |
| AUTH-004 | P1 | Signup with duplicate business names. | Unique slugs are generated; both tenants remain isolated. |
| AUTH-005 | P1 | Submit missing business name, industry, email, password, or name. | Returns validation error; no partial records remain. |
| AUTH-006 | P1 | Submit invalid industry, invalid email, short password, and oversized strings. | Returns `400`; no server error or record creation. |
| AUTH-007 | P0 | Login with valid owner credentials. | Cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax`, and correctly scoped. |
| AUTH-008 | P1 | Login with wrong password, unknown email, suspended user, and invited user. | Correct `401/403` response without credential disclosure. |
| AUTH-009 | P0 | Refresh a valid session. | Access and refresh tokens rotate; old refresh token is revoked. |
| AUTH-010 | P0 | Reuse the old refresh token after rotation. | Returns `401`. |
| AUTH-011 | P1 | Logout, then call a protected endpoint. | Cookies are cleared and access is denied after token expiry/revalidation. |
| AUTH-012 | P0 | Suspend a user, then use an existing access token. | Protected requests are rejected promptly. |
| AUTH-013 | P0 | Suspend or cancel a tenant, then use an existing token and refresh token. | Protected requests and refresh are rejected. |
| AUTH-014 | P1 | Use the same email in login after creating duplicate legacy records. | The system rejects ambiguity or uses a documented unique-email policy. |
| AUTH-015 | P1 | Inspect `/api/admin/users` as platform admin. | No `passwordHash`, password, token, or secret field is returned. |
| AUTH-016 | P1 | Brute-force login and portal login from one IP. | Rate limits trigger with useful `429` responses. |
| AUTH-017 | P1 | Send cross-origin cookie mutation requests. | CSRF/origin policy rejects unauthorized mutation requests. |
| AUTH-018 | P1 | Load public landing, signup, login, and portal-login pages without JWT secrets in Vercel. | Public pages render; protected requests show a login/configuration error, not a 500. |

## Tenant Isolation and Authorization

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| SEC-001 | P0 | Create tenant A and tenant B with members, invoices, trainers, and inventory. | Fixtures are created with distinct tenant IDs. |
| SEC-002 | P0 | Use tenant A credentials to request tenant B IDs in members, invoices, payments, attendance, trainers, inventory, expenses, and settings. | Each request returns `403/404`; no B data leaks. |
| SEC-003 | P0 | Send `$set`, `$unset`, dotted keys, and nested operator keys to every generic PATCH route. | Returns `400`; no tenant or reference mutation occurs. |
| SEC-004 | P0 | Create a session using a trainer ID from tenant B. | Returns `400`; no cross-tenant session is created. |
| SEC-005 | P0 | Create a measurement using a member ID from tenant B. | Returns `400`; no cross-tenant measurement is created. |
| SEC-006 | P0 | Create an invoice using a member or plan ID from tenant B. | Returns `400/404`. |
| SEC-007 | P1 | Populate related documents from another tenant through every list endpoint. | Related data is absent; response contains only same-tenant references. |
| SEC-008 | P0 | Open a school, clinic, restaurant, or bookshop dashboard route as a gym user and vice versa. | Wrong-industry route redirects or shows a clear unavailable screen; no wrong API is requested. |
| SEC-009 | P0 | Use owner, receptionist, trainer, accountant, and inventory-manager credentials against every gym route. | Only documented permissions succeed. |
| SEC-010 | P0 | Trainer with assigned access requests an unassigned member ID, payment history, badge, card, attendance, report, and analytics endpoint. | Returns `403/404`; no unassigned data leaks. |
| SEC-011 | P1 | Remove a tenant membership, then retry requests with an existing token. | Access is denied without waiting for token expiry. |
| SEC-012 | P1 | Request admin users and tenants as a tenant owner. | Returns `403`. |
| SEC-013 | P1 | Request tenant messages without membership or with a suspended tenant. | Returns `401/403`. |
| SEC-014 | P1 | Send invalid ObjectIds, oversized page limits, invalid status values, and regex metacharacters. | Returns controlled `400` or safe literal search; never 500 or unbounded work. |

## Plans and Membership Sales

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| PLAN-001 | P0 | Open Plans with zero plans. | Actionable empty state explains that a plan is required before enrollment. |
| PLAN-002 | P0 | Create a plan with name, duration, price, and description. | Plan appears active and selectable for enrollment. |
| PLAN-003 | P1 | Create zero-duration, negative-price, missing-name, and huge-value plans. | Validation rejects invalid values. |
| PLAN-004 | P1 | Edit active plan name/price/duration. | Existing member history remains unchanged; new sales use the new price. |
| PLAN-005 | P1 | Archive a plan. | It cannot be selected for new enrollment; existing members retain it. |
| PLAN-006 | P0 | Enroll a member with payment equal to invoice amount. | One member, one invoice, one payment; invoice is `PAID`; receipt data is available. |
| PLAN-007 | P0 | Enroll with payment below invoice amount. | Invoice is `PARTIAL`; paid amount and balance are exact. |
| PLAN-008 | P0 | Enroll with zero payment. | Invoice is `PENDING`; member status and dates are correct. |
| PLAN-009 | P0 | Double-click enrollment and retry the same request. | No duplicate member, invoice, payment, or welcome event. |
| PLAN-010 | P1 | Auto-generate member number and create two concurrent members. | Numbers are unique or one request receives a safe conflict to retry. |
| PLAN-011 | P1 | Enroll with all profile fields: gender, DOB, address, emergency contact, trainer, start date, and note. | Every field is saved and displayed correctly. |
| PLAN-012 | P0 | Enroll using an inactive/archived plan. | Request is rejected. |
| PLAN-013 | P1 | Start a future membership. | Check-in and class booking are blocked before the start date. |
| PLAN-014 | P1 | Archive a member with financial history. | Member becomes cancelled/archived; invoices, payments, attendance, and audit history remain. |
| PLAN-015 | P1 | Search members with quotes, commas, regex characters, empty results, and 101+ records. | Search is literal, counts reset correctly, and pagination reaches every record. |
| PLAN-016 | P1 | Export members containing quotes, commas, newlines, and formula-like values. | CSV is valid and spreadsheet-safe; all filtered records are exported. |

## Renewals, Freeze, and Member Profile

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| MEM-001 | P0 | Renew an active member. | End date extends from existing end date; renewal history and invoice are created once. |
| MEM-002 | P0 | Renew an expired member. | End date extends from today; status becomes active. |
| MEM-003 | P0 | Renew with full payment and partial payment. | Invoice status and payment balance are correct. |
| MEM-004 | P1 | Renew with archived/inactive plan. | Request is rejected. |
| MEM-005 | P1 | Freeze a member with a reason. | Check-in and booking are blocked; freeze reason and timestamp persist. |
| MEM-006 | P1 | Unfreeze a member. | Membership becomes active only if the end date is valid. |
| MEM-007 | P1 | Cancel a member. | Check-in, booking, and portal actions are blocked; financial history remains. |
| MEM-008 | P1 | Edit a member without changing the plan. | Dates and invoice history remain unchanged. |
| MEM-009 | P1 | Edit a member with a new plan. | It must not silently change dates; user is directed to renewal/change-plan flow. |
| MEM-010 | P1 | Add notes with quotes, long text, and multiple authors. | Notes append, never overwrite, and author/date are recorded. |
| MEM-011 | P1 | Open member history. | Attendance uses the correct response key, payments are present, and permission errors are visible. |

## Attendance and Staff

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| ATT-001 | P0 | Check in an active member. | One record, correct fee status, streak update, and current attendance timestamp. |
| ATT-002 | P0 | Check in the same member twice on the same tenant day. | Second request returns `409`; only one record exists. |
| ATT-003 | P0 | Check in expired, frozen, cancelled, and future-start members. | All are rejected with clear messages. |
| ATT-004 | P1 | Check in with invalid, future, or malicious date values. | Controlled validation error. |
| ATT-005 | P0 | Check out an open check-in. | Checkout time is saved and is not before check-in time. |
| ATT-006 | P1 | Check in at 23:55 and check out at 00:10 in the gym timezone. | The open record is found and closed correctly. |
| ATT-007 | P1 | Backdate a check-in before the latest attendance. | Streak and latest attendance are recomputed or the correction is explicitly restricted. |
| ATT-008 | P0 | Run duplicate check-ins concurrently. | Unique index/conditional logic prevents duplicates. |
| ATT-009 | P1 | Filter attendance by member, from, to, page, and method. | Correct inclusive results and pagination. |
| ATT-010 | P1 | Generate monthly summary/trend around timezone midnight. | Totals and day buckets match the gym timezone. |
| ATT-011 | P0 | Add active and inactive staff. | Inactive staff cannot be marked; active staff appears in the roster. |
| ATT-012 | P1 | Mark PRESENT, LATE, ABSENT, and LEAVE. | Upsert is idempotent and list reflects the selected status. |
| ATT-013 | P1 | Mark invalid date/status/staff ID. | Controlled validation error. |
| ATT-014 | P1 | Run staff monthly summary. | Counts by status and marked total are accurate. |
| ATT-015 | P1 | Use attendance view-only account. | Records are visible; check-in, checkout, staff add, and mark buttons are hidden/blocked. |

## Billing and Payments

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| BILL-001 | P0 | Create invoice for same-tenant member and plan. | Correct reference, due date, amount, and pending state. |
| BILL-002 | P0 | Create invoice with foreign member/plan, invalid date, reversed period, negative amount. | Rejected with no record. |
| BILL-003 | P0 | Record full payment. | Payment and invoice update atomically from the customer perspective. |
| BILL-004 | P0 | Record partial payment. | `paidAmount`, `PARTIAL`, and balance are exact. |
| BILL-005 | P0 | Overpay, zero-pay, NaN-pay, or pay cancelled/paid invoice. | Rejected; totals remain unchanged. |
| BILL-006 | P0 | Submit two payments concurrently. | No overpayment; one request retries/conflicts safely. |
| BILL-007 | P1 | Delete an unlinked payment. | Payment is deleted without changing unrelated invoices. |
| BILL-008 | P1 | Delete an invoice-linked payment. | Invoice balance/status is reconciled; audit/reason is captured. |
| BILL-009 | P1 | Update invoice-linked payment amount. | Rejected; replacement/refund workflow is required. |
| BILL-010 | P0 | Mark overdue concurrently with a payment. | A newly paid invoice cannot be overwritten to overdue. |
| BILL-011 | P1 | Cancel pending, partial, paid, and overdue invoices. | Only permitted states cancel; partial/paid policy is enforced. |
| BILL-012 | P1 | Load billing, click the active tab repeatedly, create invoice/payment from either tab. | No infinite loading; both lists refresh. |
| BILL-013 | P1 | Inspect invoice list. | Total, paid, balance, status, due date, overdue age, and receipt action are visible. |
| BILL-014 | P0 | Download invoice PDF as owner and unauthorized user. | Correct receipt only for authorized tenant; no cross-tenant PDF. |
| BILL-015 | P1 | Record each payment method/reference. | Method and reference persist and appear in payment history/export. |
| BILL-016 | P1 | Load 101+ invoices/payments. | Pagination, filters, and exports reach every record. |

## Inventory and Product Sales

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| INV-001 | P0 | Create inventory item with each category and valid integer stock. | Item saves with supplier, min stock, prices, and active status. |
| INV-002 | P0 | Use invalid category, fractional quantity, negative price, or duplicate SKU. | Request is rejected. |
| INV-003 | P0 | Record PURCHASE/RETURN/ADJUSTMENT/DAMAGED/SALE. | Stock and movement ledger stay consistent. |
| INV-004 | P0 | Sell more than available stock. | Request is rejected and stock is unchanged. |
| INV-005 | P0 | Run two concurrent stock-out movements. | Stock never becomes negative; ledger matches final quantity. |
| INV-006 | P1 | Search with regex characters and filter low stock true/false. | Literal search and boolean filter work. |
| INV-007 | P1 | Archive/delete item with movement history. | Policy preserves or explicitly archives ledger history; no silent orphan data. |
| INV-008 | P1 | Record product sale with member, price, tax, discount, method, and receipt. | Stock decrements and product revenue/payment is reconciled. |
| INV-009 | P1 | Open inventory on mobile. | Table is scrollable or card-based; no clipped actions. |
| INV-010 | P1 | Load 101+ inventory items and movements. | Pagination and search reach all records. |

## Trainers, Classes, and Bookings

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| CLASS-001 | P0 | Add trainer once, double-click, retry after timeout, and reuse phone. | Exactly one trainer is created; duplicate phone is rejected. |
| CLASS-002 | P1 | Archive trainer with assigned members and sessions. | Documented detach/archive policy executes; no dangling active assignments. |
| CLASS-003 | P0 | Create class with trainer, day, time, and positive integer capacity. | Class appears in staff and portal schedules. |
| CLASS-004 | P1 | Create class with foreign trainer, invalid time, zero capacity, or reversed time. | Rejected. |
| CLASS-005 | P0 | Book active member for matching future class day. | Booking is created once. |
| CLASS-006 | P0 | Book expired/frozen/cancelled/future-start member. | Booking rejected. |
| CLASS-007 | P0 | Book same member/session/date twice. | Second booking returns conflict. |
| CLASS-008 | P0 | Run 50 concurrent bookings against capacity 10. | At most 10 active bookings exist. |
| CLASS-009 | P1 | Cancel booked, checked-in, and already-cancelled bookings. | State rules and ownership are enforced. |
| CLASS-010 | P1 | Check in a class booking. | Booking status changes and attendance/streak policy is applied. |
| CLASS-011 | P1 | Trainer opens assigned roster. | Only assigned members are visible. |

## Expenses, Reports, and Notifications

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| OPS-001 | P0 | Add expense in every category and payment method. | Expense appears with date, amount, category, and status. |
| OPS-002 | P1 | Submit invalid expense date, category, or amount. | Rejected. |
| OPS-003 | P1 | Compare expense summary and P&L. | Approved/paid expenses are consistent in both reports. |
| OPS-004 | P1 | Generate membership, attendance, revenue, P&L, trainer, and dashboard reports with date filters. | Filters are honored, totals reconcile, and zero-activity months are visible. |
| OPS-005 | P1 | Export member, payment, attendance, PDF, and invoice data with special characters. | Complete, valid, spreadsheet-safe output with tenant isolation. |
| OPS-006 | P0 | Run daily job with each tenant’s settings. | Expiry, overdue, missed attendance, low stock, and maintenance policies are tenant-specific. |
| OPS-007 | P1 | Run daily job twice and on two processes. | No duplicate state changes or notification deliveries. |
| OPS-008 | P0 | Use unconfigured WhatsApp/email/SMS channel. | Notification is `FAILED/NOT_CONFIGURED`, never falsely `SENT`. |
| OPS-009 | P1 | Provider succeeds, fails, times out, and retries. | Attempts, errors, retry/backoff, and final state are visible. |
| OPS-010 | P1 | Click notification bell, filter, retry, and mark read. | Notification center reflects actual delivery/read state. |

## Settings and Currency

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| SET-001 | P0 | Load settings for a newly onboarded gym. | Tenant business name, currency, timezone, and default hours are prefilled. |
| SET-002 | P0 | Save gym name, email, phone, address, hours, timezone, currency. | Reload preserves values in settings, dashboard, portal, and PDF. |
| SET-003 | P1 | Change currency to USD/AED/INR. | All financial screens, invoices, PDFs, and portal use the selected currency. |
| SET-004 | P1 | Set invalid time, timezone, currency, or negative thresholds. | Validation rejects invalid settings. |
| SET-005 | P1 | Close a day and attempt a class/check-in outside hours. | The product follows the documented operating-hours policy. |
| SET-006 | P1 | Enable/disable notifications and channel settings. | Daily jobs and delivery queues honor the setting. |
| SET-007 | P1 | Enable maintenance mode. | Staff/customer behavior matches the documented maintenance policy. |

## Member Portal

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| PORTAL-001 | P0 | Login with valid member number, phone, and gym code. | Member session starts for the correct tenant only. |
| PORTAL-002 | P0 | Use invalid credentials, duplicate numbers, blocked member, deleted member, and suspended tenant. | Login/session is rejected. |
| PORTAL-003 | P1 | Refresh/close/reopen portal. | Session expiry and logout work; no stale token remains usable. |
| PORTAL-004 | P1 | View profile, plan, trainer, status, streak, and expiry. | Values match staff data and effective status. |
| PORTAL-005 | P1 | View attendance history and monthly summary. | Dates, check-in/out, and totals are correct. |
| PORTAL-006 | P0 | View invoices, paid amount, balance, due date, and payment history. | Financial data is complete and tenant-scoped. |
| PORTAL-007 | P1 | View available classes, book next class, duplicate-book, and cancel. | Booking rules, capacity, and ownership are enforced. |
| PORTAL-008 | P1 | Open portal on mobile and with API section failure. | Partial/retry-friendly error state; no blank/crashed page. |

## API Contract and Error Handling

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| API-001 | P0 | Call every protected route without token. | `401` JSON response, never HTML/stack trace. |
| API-002 | P0 | Call every route with expired/invalid token. | `401`; no internal error. |
| API-003 | P0 | Call every route with valid token but wrong permission. | `403`; frontend shows a permission state, not an empty success state. |
| API-004 | P1 | Send malformed JSON, oversized body, unknown fields, and wrong primitive types. | Controlled `400` response. |
| API-005 | P1 | Send invalid ObjectId/date/enum/status. | Controlled `400/404`, no stack trace. |
| API-006 | P1 | Force Mongo outage during request. | `503/500` is logged safely with request ID; no secret/PII leak. |
| API-007 | P1 | Inspect every response. | No password hash, refresh token, internal stack, or cross-tenant data. |
| API-008 | P1 | Verify documented keys: `checkIns`, pagination, invoice balance, trainer IDs, virtual/populated fields. | Docs and actual response contracts match. |

## UI and Mobile

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| UI-001 | P0 | Test at 320x568, 375x812, 412x915, 768px, and desktop. | No accidental page-wide horizontal scroll or clipped primary actions. |
| UI-002 | P1 | Open every modal, submit with keyboard Enter, cancel, click backdrop, and use browser back. | Modal state is correct; no duplicate submission. |
| UI-003 | P1 | Test loading, empty, unauthorized, server error, timeout, and retry states on every gym page. | Each state is distinct and actionable. |
| UI-004 | P1 | Test refresh during every form submission and list fetch. | No duplicate record or corrupted state. |
| UI-005 | P1 | Test keyboard navigation, labels, focus, contrast, and screen-reader names. | Core workflows are accessible. |
| UI-006 | P1 | Test long names, Arabic/Urdu text, quotes, emojis, and large numbers. | Layout and CSV/PDF output remain safe and readable. |
| UI-007 | P1 | Test browser refresh after login, logout, expired session, and backend outage. | Correct redirect or error state without a 500 page. |

## Performance and Concurrency

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| PERF-001 | P0 | Seed 2,000 members, invoices, payments, items, and check-ins. | Lists remain responsive and paginated. |
| PERF-002 | P1 | Run concurrent duplicate check-ins. | One succeeds; all others conflict safely. |
| PERF-003 | P0 | Run concurrent invoice payments. | No overpayment and payment/invoice sums reconcile. |
| PERF-004 | P0 | Run concurrent stock sales. | No negative stock or lost ledger entries. |
| PERF-005 | P0 | Run concurrent class bookings at capacity. | Capacity is never exceeded. |
| PERF-006 | P1 | Run search with long/regex-heavy strings. | Query is escaped, bounded, and responsive. |
| PERF-007 | P1 | Request maximum report/export ranges. | Memory/timeout limits are controlled and documented. |
| PERF-008 | P1 | Run two daily jobs at the same time. | Distributed lock/idempotency prevents duplicates. |

## Deployment and Recovery

| ID | Priority | Steps | Expected result |
|---|---|---|---|
| DEPLOY-001 | P0 | Deploy cleanly from GitHub using `npm ci`. | Both services build from lockfiles. |
| DEPLOY-002 | P0 | Verify Render `/health/ready` with Mongo connected and disconnected. | `200` only when ready; `503` when unavailable. |
| DEPLOY-003 | P0 | Verify Vercel rewrite `/api/auth/me` and signup/login. | Requests reach the correct Render backend. |
| DEPLOY-004 | P0 | Verify Vercel and Render JWT secrets match. | Login and middleware verification both succeed. |
| DEPLOY-005 | P1 | Verify CORS from the production Vercel origin. | Allowed origin succeeds; unknown origin is rejected. |
| DEPLOY-006 | P0 | Run `npm run db:indexes` against staging/production before traffic. | Required unique/TTL indexes exist. |
| DEPLOY-007 | P0 | Take Atlas backup and restore into an isolated database. | Users, tenants, members, invoices, payments, indexes, and permissions survive restore. |
| DEPLOY-008 | P1 | Disable cron and test external cron secret. | Disabled scheduler does not run; bad secret is rejected; valid secret runs once. |
| DEPLOY-009 | P1 | Restart Render during a request and during daily job. | Graceful shutdown/restart leaves no partial financial state. |
| DEPLOY-010 | P1 | Verify logs, monitoring, alerts, rate limits, and secret redaction. | No passwords/tokens/PII are logged. |

## Acceptance Sign-Off

Record these before release:

- Test run date:
- Tester:
- Commit SHA:
- Staging URL:
- API URL:
- MongoDB restore date:
- Passed cases:
- Failed cases:
- Blocked cases:
- Known risks accepted by:
- Customer handover approved by:
