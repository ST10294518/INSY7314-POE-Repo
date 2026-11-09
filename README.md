# HustleHub+ - INSY7314 POE, Parts 2 and 3

A MERN freelance marketplace with Client, Freelancer and Administrator roles. All payments and revenue are **simulated**; no real charge is processed.

## Features and team responsibilities

| Role | Application flow |
| --- | --- |
| Client | Register/sign in, search gigs, view service details, book using simulated payment, view confirmation and own booking history |
| Freelancer | Register/sign in, create/edit/soft-delete own gigs, view received bookings, own completed transaction history, income and coursework tax reserve |
| Administrator | Separately provisioned account; read-only, paginated oversight of users, active gigs, bookings, transactions and statistics |

Part 2 implementation responsibilities and historical API results are retained in [README history](docs/README-HISTORY.md). Part 3 responsibilities: Member 1 - CI, Semgrep, Docker/HTTPS, trusted proxy setup and infrastructure evidence; Member 2 - tax dashboard, persistent authentication controls, structured/cloud logging, historical gig preservation and evidence assembly. Shared integration uses **Developer** and feature branches **Feature/Member-1** and **Feature/Member-2**. Submit PRs to Developer and verify their current checks before merging.

## Prerequisites and installation

Use Node.js 24 to match CI, npm, Git, and a MongoDB Atlas database accessible from the machine/container. Booking/payment operations use MongoDB transactions, so use a replica set or Atlas deployment supporting transactions. Local CI's standalone MongoDB is used for authentication integration and a read-only smoke test, not a complete booking transaction rehearsal.

```powershell
npm ci
npm --prefix client ci
```

Create a private root `.env` using these placeholders; replace values locally:

```dotenv
PORT=5443
MONGODB_URI=REPLACE_WITH_PRIVATE_APPLICATION_DATABASE_URI
JWT_SECRET=REPLACE_WITH_PRIVATE_RANDOM_SECRET
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
# Optional, for isolated security tests:
SECURITY_TEST_MONGODB_URI=REPLACE_WITH_PRIVATE_TEST_DEPLOYMENT_URI
# Optional, for Better Stack cloud export:
BETTER_STACK_SOURCE_TOKEN=REPLACE_WITH_PRIVATE_SOURCE_TOKEN
BETTER_STACK_INGESTING_HOST=REPLACE_WITH_SOURCE_INGESTING_HOST
```

Omit optional entries when not used; do not leave an optional test URI placeholder if you intend to use the application's deployment as the test connection. The integration suite selects a separate database explicitly (see below). Keep `.env`, private keys, tokens and Postman environments out of Git. Atlas Network Access must allow the current public IP, and the database user must have appropriate database-scoped permissions. Old JSON-store accounts are not automatically migrated; register test accounts against the active MongoDB database.

### Trusted local HTTPS

Do not replace existing working certificates. For a new setup, install mkcert and generate local files:

```powershell
mkcert -install
New-Item -ItemType Directory -Path certs -Force | Out-Null
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 "::1"
```

Vite and Nginx verify the backend using `certs/cert.pem`. For the mkcert-issued leaf, append its public root CA once to make the trust bundle used by these clients:

```powershell
$caDirectory = (mkcert -CAROOT).Trim()
$certificatePath = Join-Path (Get-Location).Path "certs/cert.pem"
$bundle = [IO.File]::ReadAllText($certificatePath) + "`n" + [IO.File]::ReadAllText((Join-Path $caDirectory "rootCA.pem"))
[IO.File]::WriteAllText($certificatePath, $bundle, (New-Object Text.UTF8Encoding($false)))
```

Never copy or publish mkcert's rootCA-key.pem. The earlier self-signed OpenSSL alternative remains in [historical setup](docs/README-HISTORY.md#local-https-certificates); it uses a different certificate trust approach. Do not disable TLS verification to work around connection errors. These are local development certificates, not public production certificates.

### Development servers

Leave the backend running in one terminal and frontend in another:

```powershell
npm start
```

```powershell
npm --prefix client run dev
```

API: https://localhost:5443. Frontend: https://localhost:5173. Vite proxies same-origin `/api` to the HTTPS API and verifies its certificate. Production build: `npm --prefix client run build`; optional local preview: `npm --prefix client run preview` at https://localhost:4173. Stopping either development server stops its service.

### Docker Compose

Start Docker Desktop's Linux engine; prepare `.env` and `certs/` first:

```powershell
docker info --format '{{.OSType}}'
docker compose config --quiet
docker compose up --build --detach --wait --wait-timeout 180
docker compose ps
```

Open https://localhost:8443. Compose builds frontend and backend; Nginx serves the React build on loopback port 8443 and proxies to the internal HTTPS backend port 5443 with certificate verification. Normal Compose uses the configured external Atlas database; only `compose.ci.yml` adds a temporary MongoDB 7 container.

```powershell
curl.exe --cacert certs/cert.pem --fail https://localhost:8443/api/gigs
docker compose logs --tail 50 backend
# Stop containers when finished:
docker compose down
```

The controlled single Nginx proxy has address `172.30.254.2`; Compose sets `TRUSTED_PROXY_IP` to that address. Nginx overwrites `X-Forwarded-For` with `$remote_addr`; Express trusts only the configured proxy address. A different network or upstream load balancer requires a reviewed topology and header policy. Do not set blanket `trust proxy = true`. See [Express proxy documentation](https://expressjs.com/en/guide/behind-proxies/).

## Complete application flow

1. Sign in as Freelancer and create a gig with title, description, price and optional category.
2. Log out, sign in as Client, search for the service and click View Gig.
3. Click Book Gig once. Successful simulated payment creates a confirmed Booking and completed Transaction together. The API derives client, freelancer and price from authenticated identity and stored gig data.
4. Show the confirmation references before refreshing. Transaction details on that confirmation page come from the immediate response and are unavailable there after refresh; saved history remains available.
5. Open View My Bookings and View Details; refresh the details page to retrieve the saved record.
6. Sign in as the original Freelancer; view Received bookings, Refresh income and Transaction history.
7. Optional infrastructure evidence: match application references to Atlas documents and Better Stack events.

The frontend supplies an Idempotency-Key for booking retries. A retry of a completed operation with the same client/key returns its existing records instead of a second transaction. Real payment processing is out of scope. Admins do not create or alter marketplace records through the read-only dashboard.

## Consolidated API reference

Protected routes require `Authorization: Bearer <JWT>`. Role checks use the current MongoDB user. Lists/details return their route-specific JSON wrappers. Admin list endpoints support `page` and `limit` (20 default, 50 maximum).

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | API status message |
| POST | `/api/auth/register` | Public; Client/Freelancer only | Register |
| POST | `/api/auth/login` | Public | Sign in |
| GET | `/api/auth/me` | Any authenticated role | Current safe profile |
| POST | `/api/auth/logout` | Any authenticated role | Revoke presented token |
| GET | `/api/gigs` | Public | Active services |
| GET | `/api/gigs/mine` | Freelancer | Own active gigs |
| GET | `/api/gigs/:id` | Public | Active service details |
| POST | `/api/gigs` | Freelancer | Create own gig |
| PUT | `/api/gigs/:id` | Freelancer owner | Update own active gig |
| DELETE | `/api/gigs/:id` | Freelancer owner | Soft-delete own gig |
| POST | `/api/bookings` | Client | Booking and simulated transaction; Idempotency-Key required |
| GET | `/api/bookings/mine` | Client | Own booking history |
| GET | `/api/bookings/freelancer` | Freelancer | Own received bookings |
| GET | `/api/bookings/:id` | Authenticated matching client/freelancer ID | Own booking; non-participant gets 404 |
| GET | `/api/transactions/income` | Freelancer | Own completed income and coursework estimate |
| GET | `/api/transactions/mine` | Freelancer | Own transaction history |
| GET | `/api/admin/me` | Admin | Verify access |
| GET | `/api/admin/overview` | Admin | Counts and completed simulated revenue |
| GET | `/api/admin/users` | Admin | Paginated users |
| GET | `/api/admin/gigs` | Admin | Paginated active gigs |
| GET | `/api/admin/bookings` | Admin | Paginated bookings |
| GET | `/api/admin/transactions` | Admin | Paginated transactions |

Admin provisioning is opt-in via `scripts/provision-admin.js`; it hashes the private password and refuses to overwrite an existing account. Public registration cannot provision Admins. Follow [private provisioning instructions](docs/README-HISTORY.md#provisioning); remove provisioning credentials and enabling flags after use.

## Authentication rate limits for real users and shared IPs

An IP may represent many campus, household or mobile users. Account-based failure budgets avoid applying a five-failure limit to every unrelated person on that network (OWASP, Authentication Cheat Sheet; express-rate-limit configuration - see [references](docs/PROJECT-ATTRIBUTIONS.md)).

| Control | Project default | Scope and limitation |
| --- | --- | --- |
| Login network ceiling | 200 requests / 15 minutes | Resolved IP/IPv6 subnet; includes malformed requests |
| Login failure budget | 5 unsuccessful requests / 15 minutes | SHA-256 key of normalized email; account bucket spans networks |
| Registration | 10 requests / hour | Shared network budget; busy shared networks can still be throttled |
| Booking | 10 requests / 15 minutes | Network-based limiter, applied after Client authentication |
| Persistent lockout | 5 failed passwords, 15-minute inactivity observation reset, 15-minute lock | Stored per account; rate limiter can reject earlier with 429 |

Successful logins are removed from the in-memory failure budget but do not reset its earlier failures. The separate persistent account state resets on successful login. Limits are coursework defaults, not universal recommended capacities: tune from measured use and support impact. Hashing limiter keys avoids storing raw email as the key but is not encryption. Successful concurrent requests can temporarily occupy account budget.

Default limiter MemoryStore is process-local and resets on restart. Multiple replicas need a shared store and tested failure policy. The MongoDB lock persists independently. Do not exempt shared public networks entirely; account recovery, MFA and risk-based challenges can reduce abuse and deliberate victim lockout. The configured trusted proxy must match the real deployment path; reassess if adding a public edge/load balancer.

## Security review and additional controls

| Threat | Implemented protection | Evidence / limits |
| --- | --- | --- |
| Injection and client tampering | Allowlisted fields and typed validation; server chooses booking price and identities | Booking validation and historical API reports |
| XSS and browser script injection | React text rendering, restricted gig text, frontend CSP, Helmet API headers | CSP evidence; no claim of protection against every XSS vector |
| Credential abuse | bcrypt hashing, password input limits, generic login failure, layered limits, MongoDB temporary lock | Unit/shared-IP/DB integration tests; lockout can be abused for denial of service |
| Stolen or replayed JWT | HS256 signature/expiry, random jti, digest-only revocation checked on protected requests | Logout revokes only presented token; other sessions and already authorised requests remain |
| Broken access control | Server role and ownership checks, authenticated account-scoped queries | API reports and two-account UI comparison; Admin has separate read-only endpoints |
| Historical data loss | Soft-delete Gig flags; active queries exclude deleted gigs, history references retained | Active list, booking history and transaction screenshots |
| Transport interception | Local trusted HTTPS and Nginx-to-backend TLS verification | Local/Compose screenshots; local certificates are not production deployment |
| Sensitive log exposure | Allowlisted fields; no bodies, passwords, raw JWTs, queries or raw errors | Logging unit tests and live cloud JSON payloads |

Additional controls are detailed in [persistent account lockout and per-token revocation](docs/Member2-Security-Features.md). Revocation reads fail closed on database errors. TTL cleanup is asynchronous; authorization checks expiry separately. These are implementation and recorded-test claims, not a comprehensive penetration-test certification.

## Income and coursework tax estimate

Only the authenticated freelancer's completed simulated transactions contribute to all-time income; refunded records are excluded. The illustrative 20% reserve rounds to cents and computes the remainder by subtraction. R1,000 produces R200 reserve and R800 remaining. This is not an annual SARS calculation and omits tax brackets, rebates, deductions, expenses and other income. See [tax design and verification](docs/Member2-Tax-Dashboard.md).

## Logging and Better Stack

Structured stdout includes time, service, event, request ID, normalized endpoint, status and duration. Optional Better Stack credentials remain private in `.env`. Restart/recreate the relevant service after configuration changes.

```powershell
node scripts/test-cloud-logging.js
```

This emits a synthetic connectivity event, not a real booking. Real cloud screenshots separately show login success/failure, logout, booking creation and committed simulated transaction events. Search `transaction_recorded` in Live tail, then match its requestId to `booking_created` and record IDs to application history. Logs use UTC; Better Stack may display SAST. See [logging setup and delivery limits](docs/Member2-Logging-Monitoring.md).

Cloud export is best effort: bounded queue, timeout and retries; no durable spool. Outage/restart may lose pending records and retries may duplicate them. It is not a guaranteed financial ledger. Cloud alerts, retention and production access policies require separate configuration.

## Tests, CI and evidence

```powershell
npm test
npm --prefix client test
npm --prefix client run build
npm --prefix client run lint
node scripts/run-security-integration.js
```

The final command is separate and requires a permitted test deployment. The integration suite explicitly uses **hhst_kairah_security** and drops that database during cleanup. Use a dedicated disposable test database with create/index/read/write/drop permissions; do not point the suite at valuable test records or run it concurrently. The runner prefers SECURITY_TEST_MONGODB_URI, falling back to MONGODB_URI. It does not use the URI's database name as its cleanup target.

Recorded local verification after updating through 255065f: rate-limit scripts and six booking validation checks passed, followed by **30 Node tests**; frontend **51 tests in 11 files** passed and production build succeeded. The earlier DB run records **11 nested scenarios plus parent = 12 passes**. These are recorded runs, not a fresh execution performed by this documentation update. Historical Part 2 runs reported 41 frontend tests; those counts do not describe the expanded current suite. Admin UI component coverage is not included in the 51-test suite.

The workflow runs on pushes to Feature/Member-1 and Developer, and PRs targeting Developer. A direct Member-2 push alone does not trigger it. CI uses Node 24, npm ci, npm test (including security/logging), isolated MongoDB 7 authentication integration, frontend tests/build, Semgrep, then Compose HTTPS smoke checks. The Compose job depends on both test and scan jobs succeeding. The isolated authentication DB test does not prove the booking transaction path; the live application rehearsal supplies that evidence.

Repository documentation records [CI run #33](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42648142206). Treat historical green runs as evidence of their commit only; verify the current PR/Developer head before final submission. Earlier failed-run/build-skip/recovery evidence is retained under Evidence/Part3/CI. CI currently uses a floating Semgrep image/rules and major-version action tags; production hardening should consider immutable pinning and reviewed updates.

### Evidence navigation

- [Member 2 evidence index](Evidence/Part3/Member2-Evidence-Index.md): tax, soft deletion/history, account comparison, security tests, cloud event correlation, frontend and development HTTPS.
- [Docker](Evidence/Part3/Docker/), [HTTPS](Evidence/Part3/HTTPS/), [CI](Evidence/Part3/CI/) and [static analysis](Evidence/Part3/StaticAnalysis/).
- [Security scenarios and CI evidence](docs/Member2-Security-Features.md).
- Historical [Postman/API test instructions and reports](docs/README-HISTORY.md#tests-and-evidence).

### Dependency review

Latest supplied clean-install output reported zero backend vulnerabilities and **four moderate frontend development-tool findings**. The historical audit identifies an ESLint/minimatch chain; this documentation update does not rerun or remediate that audit. Recheck `npm audit`, `npm --prefix client audit` and `npm --prefix client audit --omit=dev` on the submission commit. Do not equate a successful build/Semgrep scan with an absence of vulnerable dependencies or apply forced breaking upgrades without review.

## Project-wide attribution and sources

See the [file-by-file attribution/reference register](docs/PROJECT-ATTRIBUTIONS.md) for backend, frontend, styles, tests, infrastructure and retained assets. Nearby source comments identify the official documentation checked during this final review. They do not invent original snippet provenance. Existing notices and assistance disclosures are preserved in source and [README history](docs/README-HISTORY.md#code-attribution-and-research-sources). Retain third-party copyright/licence notices and complete any earlier copied-snippet/asset provenance from the group's actual development history.

## Demonstration and final sign-off

The recording should show the full application flow and matching transaction references. Docker, Atlas and cloud logs can support the Part 3 explanation. The prepared script is separate from the repository archive; recording and publication are not established by this documentation update. Add the final accessible video URL here after upload, test access while signed out, and avoid including credentials.

Before submitting: confirm current CI checks, review the dependency findings and source provenance, ensure evidence matches the demonstrated version, add the video link, and complete team sign-off. For Atlas DNS/TLS issues inspect network access, database permissions, DNS and container connectivity without disabling TLS verification. A temporary successful retry alone is not proof of a permanent network fix.
