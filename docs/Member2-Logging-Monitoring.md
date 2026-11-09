# Structured logging and cloud monitoring

## Events and purpose

| Event | Trigger | Monitoring purpose |
| --- | --- | --- |
| login_succeeded / login_failed | Login response | Authentication activity and suspicious failures |
| auth_rate_limited | Login/registration returns 429 | Excessive attempts; separate from a database lock |
| account_lockout_enforced | Login handler observes an active persisted lock | Persistent account protection; an earlier rate limit can prevent the handler running |
| registration_succeeded / registration_failed | Registration response | Account creation activity |
| logout_succeeded / logout_failed | Logout response | Confirm or investigate revocation attempts |
| booking_created / booking_failed | Booking creation response | Booking workflow outcomes |
| booking_reused | Existing idempotent booking returned | Distinguish safe retries from new payments |
| transaction_recorded | Booking/payment transaction committed, followed by 201 | Record simulated financial completion once per successful creation response |
| gig_created / gig_updated / gig_deleted | Successful gig mutation response | Changes to advertised work |
| gig_change_failed | Failed gig mutation | Invalid or unauthorized changes |
| application_error | API response >=500 | Service failures; safe error category only |
| request_aborted | Client connection closes before completion | Interrupted requests |
| http_request | Other completed requests | API status and duration baseline |

Each application log is one JSON line with UTC timestamp (dt), level, event, message and service. Requests have a generated UUID returned in X-Request-Id. Safe account/resource IDs, method, normalized endpoint, status and duration are included when available. Booking/payment metadata is assigned after the DB transaction commits. A repeated completed idempotency key produces booking_reused, not another transaction_recorded event. This is application telemetry, not a tamper-proof financial ledger: a process can fail after commit and before logging, and client disconnects may prevent a completion event.

## Data protection

Metadata is allowlisted. Passwords, JWTs, authorization headers, request bodies, email addresses, database URLs, raw exception messages/stacks and URL query strings are not recorded. Unmatched user-supplied paths become unmatched. Normalized endpoint templates omit resource IDs; explicit resource fields allow only MongoDB ObjectId-shaped values. Existing Morgan URL output is replaced to avoid accidentally logging query strings. Only safe predefined error categories are recorded. IDs are still potentially linkable information: limit access, choose an appropriate retention period, and remove unnecessary exports. Review original Nginx/access logs separately with Member 1.

## Local operation

No new dependency is required. Start the API using the existing project setup. JSON logs appear on stdout. Docker captures them in its existing container logs; with Member 1's Compose stack, use docker compose logs --tail 50 backend. The database must work for actual authentication, booking and payment flows. A connectivity test is not evidence that real business events reached the cloud.

Run node --test src/tests/logging.test.cjs for isolated logging/HTTP tests without MongoDB. They use injected mock cloud transport and a temporary Express test server. They cover field exclusion, injection resistance, event routing, committed-payment metadata versus retries, cloud success/failure, bounded retries and a bounded queue. Security DB integration tests are updated to disable cloud export of synthetic events.

## Better Stack setup

1. Create/sign into Better Stack and open its Logs/Telemetry area. Create a source for this API using the HTTP/JSON ingestion instructions (or the relevant Node.js source).
2. Copy the source's Source token and Ingesting host. Use the source token, not an account-management API token. Current setup labels can vary; consult the official source instructions.
3. Add the following only to local .env or your deployment secret configuration. Do not put tokens in .env.example, README, evidence, or Git:

```dotenv
BETTER_STACK_SOURCE_TOKEN=replace_locally_with_source_token
BETTER_STACK_INGESTING_HOST=replace_locally_with_source_ingesting_host
```

The host may be the hostname or HTTPS origin supplied by Better Stack. Supported provider domains are betterstackdata.com, logtail.com and betterstack.com subdomains. The URL must use HTTPS without credentials, query, path or fragment. No default host/token is supplied. Invalid/incomplete configuration produces a local cloud_logging_configuration_invalid diagnostic and leaves local logging enabled.

4. Run node scripts/test-cloud-logging.js. It emits a clearly labelled synthetic connectivity event and reports whether the cloud accepted it. Search the printed requestId in Live tail. It needs no database. This sends one test event to your configured cloud source; do not include credentials in screenshots.
5. Restart the API after changing .env. Generate real login, booking and transaction events with a working database connection. Search login_failed, booking_created and transaction_recorded; correlate by requestId and safe IDs.
6. Create saved views for application_error and auth_rate_limited/login_failed. Optionally configure a count-based alert with a threshold/window appropriate to the demonstration. Test and capture evidence; no alert is created automatically by this package.

## Delivery and operational limits

Local stdout output is immediate. Optional HTTP delivery is asynchronous, serial, and batched (20 records) with a maximum pending queue of 100 records plus one in-flight batch. Each attempt times out after five seconds; transient failures/429/5xx get at most three attempts. Permanent 4xx responses are not retried. The source bearer token is only used in the outgoing HTTPS authorization header, and redirects are rejected. Response bodies and exception strings are never logged. Missing/invalid cloud configuration does not prevent API requests.

A cloud outage, full queue, restart or abrupt termination can lose pending cloud records. Bounded delivery diagnostics (cloud_logging_delivery_failed, cloud_logging_queue_full) remain local; failure does not roll back bookings or change API responses. Retried batches may duplicate events. There is no durable on-disk spool or guaranteed delivery. Arrange stdout collection/log rotation and monitor diagnostics for production; do not claim this is a guaranteed audit trail. This patch does not install infrastructure alerts or configure cloud account retention/access permissions.

## Verification and evidence checklist

- Run node --test src/tests/logging.test.cjs.
- Run npm test and node --test src/tests/authSecurity.test.cjs src/tests/authSharedIp.test.cjs src/tests/taxEstimate.test.cjs src/tests/taxIncomeController.test.cjs.
- Run the cloud connectivity command; confirm the synthetic event in Live tail.
- MongoDB integration passed in the recorded local run and repository CI evidence. Re-run against a dedicated test database when database/security code changes; see Member2-Security-Features.md.
- Generate and capture real login success/failure, a booking, its transaction and an error log. Keep tokens and secrets hidden.
- Verify a booking retry does not produce a second transaction_recorded event.
- Check the same events with the Docker Compose stack. Its existing backend env_file reads .env; coordinate container rebuild/recreation with Member 1.
- Capture filtering by event/requestId, plus any configured alert test, under Evidence/Part3/Logging.
- npm test now includes the logging and security unit tests, so the CI backend-test step executes them.

## References

OWASP Foundation (n.d.) Logging Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html (Accessed: 9 November 2026).

Better Stack (n.d.) Ingesting logs. Available at: https://betterstack.com/docs/logs/ingesting-data/http/logs/ (Accessed: 9 November 2026).

Better Stack (n.d.) Get started with logging. Available at: https://betterstack.com/docs/logs/logging-start/ (Accessed: 9 November 2026).

## Recorded verification update - 9 November 2026

The evidence package contains 13 passing logging tests and live Better Stack login_failed (401), login_succeeded (200), logout_succeeded (200), booking_created (201) and transaction_recorded events. Booking and transaction cloud events share requestId f68c1387-0d70-44b1-92fd-d94f2417852d; transaction identifiers match the application history screenshot. See [evidence index](../Evidence/Part3/Member2-Evidence-Index.md). These screenshots establish the recorded run, not guaranteed delivery or cloud alerts. A separate application-error cloud example, alert setup and container-specific real-event delivery are not established by this evidence package.
