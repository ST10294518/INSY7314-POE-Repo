# Member 2 evidence collected on 9 November 2026

Screenshots are supplied by the tester and preserved without image edits.

| Evidence | What it shows |
| --- | --- |
| Security/01-auth-security-integration-passed.jpeg | Earlier MongoDB integration run: 11 nested scenarios plus parent, 12 passed and 0 failed. This records that run; a later DNS failure remains a separate connectivity issue. |
| Security/02-registration-and-failed-login-events.jpeg | Integration-test registration, safe account-fields subtest and failed-login events. These terminal events do not establish cloud delivery. |
| Functional/01-active-gigs-after-deletion.jpeg | Active listing with blank search and all categories; Logging Verification Gig is absent. |
| Functional/02-booking-history-retained.jpeg | Logging Verification Gig remains in client booking history with category, R5,000 amount and confirmed status. Paired with the listing screenshot and tester-reported deletion workflow. |

## Logging tests

Logging/01-logging-tests-passed.png records 13 passed, 0 failed. Covers structured fields, sensitive-data exclusion, injection protection, approved ingest hosts, bounded cloud delivery/retries/queue, and HTTP event tests. Cloud delivery in this test suite uses simulated responses; live Better Stack evidence is collected separately.

Docker and current Atlas connectivity verification are still pending with Member 1.

## Backend test evidence

- Security/03-rate-limits-and-booking-validation-passed.png: npm test command, login/registration/booking HTTP 429 limits, response headers and six booking validation checks.
- Security/04-shared-ip-and-tax-tests-passed.png: shared-IP isolation, tax calculations, authenticated income filtering and error handling; Node test summary is 10 passed, 0 failed. This summary covers the final Node test group, not the preceding standalone test scripts.

## Frontend tests

Frontend/01-frontend-tests-passed.png: npm --prefix client test, 11 test files and 51 tests passed; duration 18.50 seconds. Visible examples include form validation, server-confirmed logout and delete confirmation.

## Production build

Frontend/02-production-build-passed.png: Vite production build completed in 414 ms, transforming 48 modules and generating HTML, CSS and JavaScript assets. This demonstrates build success, not deployment or dependency audit status.

## Tax dashboard

- Tax/01-income-and-completed-transactions.png: R5,000 total income from one completed simulated payment.
- Tax/02-tax-reserve-and-remaining-income.png: all-time completed transactions, R1,000 estimated reserve and R4,000 remaining at the 20% coursework estimate rate. Transaction-history evidence is included below.

- Tax/03-completed-transaction-history.png: Logging Verification Gig, R5,000, completed status, transaction and booking references, recorded 9 November 2026 at 18:01:48. Also displays the coursework estimate explanation. Together with the active-listing screenshot, supports preservation of transaction history after the tester-reported gig deletion.

## Live cloud transaction event

Logging/02-cloud-transaction-recorded.png shows Better Stack Live tail, HustleHub API source, INFO transaction_recorded at 2026-11-09 18:01:48.303 SAST. The timestamp matches the displayed transaction history to the second. Event payload is not expanded, so request and transaction identifiers cannot be compared from this screenshot alone.

Logging/03-cloud-transaction-event-details.png expands the same live cloud event: service hustlehub-api, POST /api/bookings, status 201, requestId f68c1387-0d70-44b1-92fd-d94f2417852d, bookingId 6af1ee6cb4e6e504de29ec94 and transactionId 6af1ee6cb4e6e504de29ec95. Both record identifiers match Tax/03-completed-transaction-history.png, linking the application transaction to its cloud log.

## Live cloud failed-login events

- Logging/04-cloud-login-failed-list.png shows three WARN login_failed events from HustleHub API.
- Logging/05-cloud-login-failed-details.png shows a complete JSON event at 17:55:03.374 SAST, service hustlehub-api, POST /api/auth/login, status 401 and request correlation ID. The displayed payload contains no password, token, email or request body.

## Live cloud successful-login events

- Logging/06-cloud-login-succeeded-list.png shows INFO login_succeeded events from HustleHub API.
- Logging/07-cloud-login-succeeded-details.png shows the complete event at 18:01:34.129 SAST: service hustlehub-api, POST /api/auth/login, status 200, actorId and requestId. The displayed payload contains no password, token, email or request body.

## Live cloud logout events

- Logging/08-cloud-logout-succeeded-list.png shows multiple INFO logout_succeeded events from HustleHub API.
- Logging/09-cloud-logout-succeeded-details.png shows logout_succeeded at 17:59:14.331 SAST, service hustlehub-api, POST /api/auth/logout, status 200, actor and request IDs. Cloud event confirms the successful logout response; token revocation behavior is separately covered by the integration-test evidence.

## Live cloud booking creation

- Logging/10-cloud-booking-created-list.png shows booking_created at 18:01:48.303 SAST.
- Logging/11-cloud-booking-created-details.png shows service hustlehub-api, POST /api/bookings, status 201 and requestId f68c1387-0d70-44b1-92fd-d94f2417852d, matching the transaction_recorded cloud event. The booking_created payload has no booking ID; the transaction event supplies booking and transaction IDs matching the history screenshot.

## Security unit tests

Security/05-auth-security-unit-tests-passed.png shows 7 passed, 0 failed: distinct tokens, token digests, lock expiry and legacy accounts, atomic failure-update structure, success reset conditions, digest-only revocation writes and propagation of revocation read failures. These unit checks complement the earlier MongoDB integration run.

## Second freelancer account comparison

Account-Isolation/01-second-freelancer-identity.png identifies the test account p3testing@gmail.com as Freelancer. The accompanying screenshots, supplied as that account session, show R6,634 from three completed transactions (R2,700 + R1,234 + R2,700), a 20% reserve of R1,326.80 and R5,307.20 remaining. These differ from the earlier R5,000 account screenshots and support the tester-reported account separation. Separate screenshots do not independently establish which session fetched each response; no direct cross-account API authorization test is claimed from these images.

## Local development HTTPS

HTTPS/01-local-development-https-url.png shows https://localhost:5173/freelancer. HTTPS/02-local-development-secure-connection.png shows the browser reporting Connection is secure and Certificate is valid for localhost:5173. These establish browser trust for the local development frontend; they do not establish Docker port 8443 or backend TLS verification.
