# HustleHub+ — INSY7314 Part 2

HustleHub+ is a secure MERN-stack freelance marketplace built with MongoDB,
Express, React and Node.js. It supports three roles: Client, Freelancer and
Administrator. Clients browse services and create Bookings; Freelancers manage
Gigs, received Bookings and simulated-payment income; Administrators monitor
Users, Gigs, Bookings, Transactions and marketplace statistics through a
protected, read-only dashboard.

> **Payment disclaimer:** All Transactions and revenue figures in this project
> are simulated. HustleHub+ does not process real payments.

## Features by role

| Role | Main functionality | Access |
| --- | --- | --- |
| Client | Register and sign in; browse/filter Gigs; view details; book services; view confirmation and Booking history | `/client` |
| Freelancer | Register and sign in; create, edit and delete own Gigs; view received Bookings, income and Transactions | `/freelancer` |
| Administrator | Sign in with a separately provisioned account; view marketplace statistics, Users, Gigs, Bookings and Transactions; refresh and paginate lists | `/admin` |

Only Client and Freelancer accounts can be created through public registration.
Admin accounts must be provisioned separately.

## Responsibilities

- Member 1: MongoDB User integration, Gig APIs, Freelancer interface,
  Helmet, CSP, Freelancer React tests and Authentication/Gig API tests.
- Member 2: shared Login/Register screens, Client interface, Booking and
  Transaction APIs, income calculations, authentication/booking limits,
  and the Admin Dashboard, Admin API and account provisioning.
- Member 1 also prepared additional Client/Booking integration, Admin API,
  rate-limit and frontend test evidence after the feature implementations.

Develop is the integration branch. Completed work is submitted through
pull requests from Feature/Freelancer and Feature/Booking.

## Local setup

Prerequisites: Node.js, npm, Git and access to the agreed MongoDB Atlas
development database. Use the committed lockfiles when installing.

From the repository root:

```powershell
npm ci
npm --prefix client ci
```

Create a private .env file in the repository root:

```dotenv
PORT=5443
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
JWT_SECRET=REPLACE_WITH_A_PRIVATE_RANDOM_SECRET
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
MONGODB_URI=REPLACE_WITH_YOUR_PRIVATE_ATLAS_CONNECTION_STRING
```

Both members must connect to the agreed Atlas cluster and database so
User, Gig, Booking and Transaction references resolve to shared records.
Use a database account with read/write access to that database and add
your current public IP to Atlas Network Access.

Do not commit .env, database credentials or private certificates.

## Local HTTPS certificates

Place a local certificate and private key in certs/cert.pem and
certs/key.pem. The certificate must cover localhost.

For example, using OpenSSL included with Git for Windows:

```powershell
New-Item -ItemType Directory -Path certs -Force | Out-Null

& 'C:\Program Files\Git\usr\bin\openssl.exe' req `
    -x509 -newkey rsa:2048 -sha256 -nodes `
    -keyout certs/key.pem -out certs/cert.pem `
    -days 365 -subj '/CN=localhost' `
    -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
```

Generate certificates only if valid local files are not already present.
Trust the local certificate appropriately when directly accessing HTTPS.
For curl and Newman, supply certs/cert.pem as the trusted certificate.
For Postman, add cert.pem under CA certificates and keep SSL verification on.

## Start the application

Backend terminal, from the repository root:

```powershell
npm start
```

MongoDB connects before the HTTPS API starts at https://localhost:5443.
npm run dev is available for watched development.

Frontend development terminal:

```powershell
npm --prefix client run dev
```

Vite development runs at https://localhost:5173. Use the URL printed in the terminal.

To build and inspect the frontend with preview CSP:

```powershell
npm --prefix client run build
npm --prefix client run preview
```

Preview runs at https://localhost:4173.

Vite development and preview use `certs/cert.pem` and `certs/key.pem`.
Follow the certificate generation steps above before starting either server.
On Windows, add the public localhost certificate you generated to your
current-user Trusted Root Certification Authorities store, then reopen Chrome.
Keep the private key and `.env` out of Git.

The frontend makes same-origin `/api` requests. Vite forwards them to
`https://localhost:5443` and verifies the backend certificate against
`certs/cert.pem`. Frontend builds and tests can run without these local files.

- [Confirmed booking over HTTPS](Evidence/Part3/HTTPS/01-booking-over-https.png)
- [Chrome HTTPS verification](Evidence/Part3/HTTPS/02-chrome-valid-https.png)

## Run HustleHub+ with Docker Compose

Start Docker Desktop and make sure the Linux engine is running. From the
repository root, prepare the local `.env` and `certs/` directory using the setup
steps above. Set `MONGODB_URI` to your test database URI and `JWT_SECRET` to a
locally generated secret. Compose mounts `certs/cert.pem` and `certs/key.pem`
read-only and sets the certificate paths inside the backend container.

```powershell
docker compose config --quiet
docker compose up --build --detach --wait --wait-timeout 120
docker compose ps
```

Open [HustleHub+](https://localhost:8443/). Nginx serves the React build on
port `8443` and forwards `/api` requests to the Express backend on port `5443`
inside the Compose network. It verifies the backend certificate using
`certs/cert.pem`.

To verify the React route and API over HTTPS, run:

```powershell
curl.exe --cacert ".\certs\cert.pem" --head https://localhost:8443/client/bookings
curl.exe --cacert ".\certs\cert.pem" --fail https://localhost:8443/api/gigs
```

The booking route should return `200 OK` with HTML. The gigs endpoint should
return `200 OK` with a JSON `gigs` array. To stop the local stack, run:

```powershell
docker compose down
```

GitHub Actions builds both application images and runs the stack with
`compose.ci.yml`. That file adds a temporary MongoDB 7 container to work around
the MongoDB 8 startup incompatibility observed on the CI runner. CI generates
its own certificate and JWT secret, verifies both HTTPS routes, checks the
JSON response, and removes the temporary stack and volumes.

- [Local Compose and HTTPS checks](Evidence/Part3/Docker/01-local-compose-https.png)
- [Passing GitHub Actions run #15](Evidence/Part3/Docker/02-ci-compose-passed.png)
- [Containers running in CI](Evidence/Part3/Docker/03-ci-containers-running.png)
- [HTTPS smoke checks in CI](Evidence/Part3/Docker/04-ci-https-checks-passed.png)

## Authentication and shared User model

Authentication uses MongoDB rather than the previous JSON user store.
Passwords are hashed with bcrypt. Responses exclude password fields.
JWTs contain MongoDB user IDs and are verified using HS256.
Protected requests load the current User document from MongoDB.

Public registration accepts Client and Freelancer roles only.
The schema supports Admin, but public registration cannot create Admins.
Member 2 implemented separate Admin provisioning and an Admin-only oversight dashboard.

Existing users.json accounts are not automatically migrated. Register
development accounts through the MongoDB authentication API.

Authentication validates body shape, permitted fields, email types and
format, role choices and password strength. Passwords are limited to
72 UTF-8 bytes to respect bcrypt's input limit.

## Gig API contract

| Method | Route | Access |
| --- | --- | --- |
| POST | /api/gigs | Authenticated Freelancer |
| GET | /api/gigs | Public |
| GET | /api/gigs/mine | Authenticated Freelancer's own Gigs |
| GET | /api/gigs/:id | Public |
| PUT | /api/gigs/:id | Freelancer owner |
| DELETE | /api/gigs/:id | Freelancer owner |

The Mongoose model is Gig. Fields include title, description, price,
optional category, freelancer, createdAt and updatedAt.
freelancer references User using an ObjectId.

Creation assigns ownership from req.user._id. Submitted ownership fields
are rejected. Updates require the permitted Gig fields and preserve ownership.
Prices must be positive JSON numbers with at most two decimal places.

List responses use { gigs }; individual responses use { gig }.
Public Gig responses populate freelancer with _id and email.
Own-Gig responses retain freelancer as its ObjectId string.

Member 2 uses the stored Gig price and Freelancer reference for bookings,
rather than accepting those values from the Client.

## Freelancer interface

The /freelancer route is restricted to authenticated Freelancers.

The dashboard provides:

- Account details and logout.
- Own-Gig listing and refresh.
- Create and Edit forms with validation and retry handling.
- Delete confirmation with cancellation and pending controls.
- Received bookings from /api/bookings/freelancer.
- Income from /api/transactions/income.
- Transaction history from /api/transactions/mine.
- Loading, empty, success and error states.

The Freelancer stylesheet matches the shared Client design and scopes
its colours, inputs, cards and responsive layout to the Freelancer page.

Income represents completed simulated payments, not real payment processing.

## Security

Backend protections include JWT checks, Freelancer permissions, ownership
checks, permitted-field validation, input trimming and rejection of script
markup/control characters in Gig text.

Helmet provides API security headers and CSP. The Express error handler
returns safe responses for malformed JSON, oversized bodies, invalid data,
duplicate records, missing routes and unexpected errors.

Member 2 provides Login, Registration and Booking rate limiting.
Their middleware suites and the separate endpoint rate-limit tests passed.

Frontend preview sends CSP on the HTML response. It restricts scripts and
styles to self, blocks inline scripts and event handlers, blocks objects
and framing, and permits the configured API connection.

API CSP alone does not protect a frontend served from another origin.
Preview headers apply to Vite preview; any future deployed frontend host
must configure its own corresponding response headers.

Evidence is stored in Evidence/Security, including response headers and
a screenshot demonstrating blocked inline script execution.

## Tests and evidence

The following commands verify the React frontend:

```powershell
npm --prefix client test
npm --prefix client run build
npm --prefix client run lint
```

The original Freelancer-only run passed 25 tests across six files. The later
combined Client/Freelancer run passed **41 tests across nine files** (25
Freelancer tests and 16 Client tests). These use mocked API responses and
cover Gig workflows, Booking UI, navigation, received Bookings, income,
loading/empty states, form validation and error recovery. The React suite
does **not** include automated Admin Dashboard component tests; Admin API
and manual UI verification are recorded separately below.

See client/src/tests/README.md and
Evidence/Testing/client-freelancer-react-results.json.

Authentication/Gig API tests passed in both Postman and Newman:
47 requests, 99 assertions and zero failures. Newman exited with code 0.

See [API test instructions](Postman%20Collection/README-Part2-Freelancer.md)
for prerequisites, expired-token preparation, certificate trust and commands.

Evidence:

- Evidence/Testing/freelancer-api-results.xml
- Evidence/Testing/freelancer-postman-run.png

Newman runs through pinned npx outside project dependencies because its
dependency tree reported vulnerabilities. This does not remediate Newman
itself; the testing-tool limitation is documented in the API test instructions.

## Troubleshooting and final sign-off

A frontend HTTP 502 can indicate that the local backend proxy target is
unavailable. Check the backend terminal and MongoDB connection first.

Intermittent Atlas network/TLS connection failures were observed after a
network change. Successful retries do not establish a permanent fix.
Check current IP access, DNS, connectivity and backend startup; do not
disable MongoDB TLS verification.

Before submission, confirm the agreed integration branch contains all required
code, the local application still runs, the video/screenshots meet the rubric,
and the team has completed final joint sign-off. Recorded test passes are
important evidence but do not, by themselves, guarantee full rubric marks.

## Freelancer screenshot evidence

The Client and Freelancer interfaces use the shared Barbie Pink `#E0218A`
accent (`--theme-pink`) with dark navy text for readability. The global theme
variable is defined in `client/src/index.css`; Admin and Freelancer pages also
have scoped stylesheets. Some evidence screenshots may show the earlier pink
colour because they were captured before the final styling change.

Screenshots of the Freelancer interface:

- [Dashboard and Create Gig](Evidence/Freelancer/dashboard-and-create-gig.png)
- [Create Gig form](Evidence/Freelancer/create-gig-form.png)
- [Edit Gig form](Evidence/Freelancer/edit-gig-form.png)
- [Delete Gig confirmation](Evidence/Freelancer/delete-gig-confirmation.png)
- [Received bookings](Evidence/Freelancer/received-bookings.png)
- [Income and transactions](Evidence/Freelancer/income-and-transactions.png)

Frontend CSP evidence:

- [Freelancer inline script blocked](Evidence/Security/freelancer-csp-inline-script-blocked.png)

## Client frontend CSP verification

Client dashboard navigation, Gig details and My Bookings were checked
in the frontend preview without console errors during normal use.
An injected inline script was blocked by CSP, and its execution marker
remained unset.

- [Client inline script blocked](Evidence/Security/client-csp-inline-script-blocked.png)

These checks apply to the local Vite preview configuration.

## Booking and Transaction integration results

The live application rehearsal passed:
Client booking created a matching MongoDB Transaction, the Freelancer
received the Booking, income increased by R125.50, and the completed
transaction count increased by one. Results persisted after refresh.

Automated Newman results:

- Booking/Transaction integration: 38 requests and 78 assertions passed.
- Endpoint rate limits: 34 requests and 44 assertions passed.
- Both runs had zero failures and exited with code 0.

The integration suite verifies trusted pricing, identities, sequential
idempotent retries, roles, ownership, JWT rejection and isolated income.
The rate-limit suite verifies Login, Registration and Booking limits
through the actual API endpoints.

See [Integration test instructions](Postman%20Collection/README-Part2-Integration.md)
for commands, test data, evidence and limitations.

## Combined Client and Freelancer React tests

The combined run passed 41 tests across nine files:
25 Freelancer tests and 16 Client tests.

Client coverage includes Gig browsing and filtering, Booking submission,
confirmation navigation, retry-key preservation, pending controls,
Booking history and recovery from errors.

Production build and ESLint passed. Application code was unchanged
when adding these Client tests.

Report: Evidence/Testing/client-freelancer-react-results.json

See client/src/tests/README.md for coverage and execution instructions.

## Admin permissions and verification

Member 2 implemented the Admin dashboard and backend.
Admins have read-only oversight of users, Gigs, Bookings and Transactions,
plus overview counts and total completed simulated revenue.
This access is separate from Client booking and Freelancer Gig ownership.

All /api/admin routes require a valid JWT and the current MongoDB
User's Admin role. Public registration cannot create Admin accounts.
User responses exclude password hashes.

Admin lists default to 20 records per page and cap the limit at 50.


### Admin API endpoints

All routes below require `Authorization: Bearer <JWT>` from a current User
whose role is `admin`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/admin/me` | Verify Admin identity/permissions |
| GET | `/api/admin/overview` | Read counts and total completed simulated revenue |
| GET | `/api/admin/users` | Read paginated Users and roles |
| GET | `/api/admin/gigs` | Read paginated Gig information |
| GET | `/api/admin/bookings` | Read paginated Booking information |
| GET | `/api/admin/transactions` | Read paginated simulated Transactions |

List endpoints support `page` and `limit` query parameters; the default
limit is 20 and the maximum limit is 50. The Admin interface has no edit or
delete functionality. An unauthenticated request is rejected with HTTP 401,
while an authenticated non-Admin request is rejected with HTTP 403.

### Provisioning

scripts/provision-admin.js creates an Admin directly in MongoDB.
It requires ADMIN_PROVISION_ENABLED=true and private ADMIN_EMAIL and
ADMIN_PASSWORD environment variables, hashes the password with bcrypt,
and refuses to alter an existing account.

The password validation requires at least 12 JavaScript string characters
and no more than 72 UTF-8 bytes. Provisioning values must remain private, and the enabling
flag and password should be removed after use.


Provisioning is disabled by default. For an authorised one-time setup,
from a **new PowerShell session**, use the same MongoDB database as the app:

```powershell
$env:ADMIN_PROVISION_ENABLED = "true"
$env:ADMIN_EMAIL = "admin-demo@example.com"
$secure = Read-Host "Enter a unique Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password
node scripts/provision-admin.js
Remove-Item Env:ADMIN_PASSWORD,Env:ADMIN_EMAIL,Env:ADMIN_PROVISION_ENABLED -ErrorAction SilentlyContinue
Remove-Variable secure -ErrorAction SilentlyContinue
```

Use a private Admin email and a strong password. Do not persist the
provisioning flag or password in `.env` or commit any credentials. The script
refuses to overwrite an existing account; it does not reset passwords.

An existing shared Admin account was used for verification.
No additional Admin account was provisioned during these tests.

### Recorded verification

The Admin Newman suite passed 41 requests and 61 assertions,
with zero failures and exit code 0.

Verified all six Admin endpoints:

- Admin requests return 200.
- Client and Freelancer requests return 403.
- Missing, invalid and expired JWTs return 401.
- Password fields are excluded.
- List pagination is returned and the maximum limit is enforced.
- Public Admin registration is rejected.

Manual browser checks passed for Users, Gigs, Bookings, Transactions,
refresh, pagination and logout. Client/Freelancer page access was blocked.
Opening /admin after logout redirected to Login.

The post-merge Client/Freelancer suite also passed all 41 React tests.
Frontend build and ESLint passed. These component tests do not include
automated Admin dashboard coverage.

### Test execution and evidence

Collection:
Postman Collection/HustleHub-Part2-Admin-Tests.postman_collection.json

Supply adminEmail, adminPassword and expiredToken through a private
temporary Postman environment. Use an expired JWT signed with the current
local JWT secret. Never commit the environment or credentials.

Run from the repository root with the HTTPS backend running:

```powershell
npx --yes --package=newman@6.2.3 newman run "Postman Collection/HustleHub-Part2-Admin-Tests.postman_collection.json" --environment "<PRIVATE_ENVIRONMENT_PATH>" --ssl-extra-ca-certs certs/cert.pem --reporters cli,junit --reporter-junit-export Evidence/Testing/admin-api-results.xml --timeout-request 20000 --bail
```

Remove the private temporary environment after execution.
The suite creates two ordinary test accounts and reads existing Admin data.
Registration attempts remain subject to the configured rate limit.
The Newman dependency limitation described earlier also applies here.

Evidence:

- [Admin API report](Evidence/Testing/admin-api-results.xml)
- [Admin Newman summary](Evidence/Testing/admin-api-newman-run.png)


### Part 3 dependency audit

- **Backend:** `npm audit` reported zero vulnerabilities after updating `body-parser`, `ip-address`, and `qs`. All three backend test scripts passed after a clean install.
- **Frontend production dependencies:** `npm --prefix client audit --omit=dev` reported zero vulnerabilities.
- **Frontend development dependencies:** The full audit still reports four moderate entries linked to one [`minimatch` advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) in the ESLint dependency chain. The installed version is `10.2.6`, and the advisory lists `11.0.1` as the first patched version. The latest ESLint and `@eslint/config-array` versions checked still require `minimatch` 10.x. ESLint 10 was retained because npm proposed a major-version downgrade. The advisory remains open and should be rechecked when the upstream dependency ranges change. Lint, all 41 frontend tests, the production build, and CI passed on commit `dd0e131`.
- **Static source analysis:** The baseline Semgrep scan ran 70 rules on 51 files and reported zero findings in the scanned files. See the [Semgrep scan evidence](Evidence/Part3/StaticAnalysis/01-semgrep-baseline-passed.png).

## GitHub Actions CI

The workflow in `.github/workflows/ci.yml` runs on pushes to
`Feature/Member-1` and `Developer`, and on pull requests targeting `Developer`.
It uses Node.js 24 and installs backend and frontend dependencies from their
lockfiles before running the tests and building the React frontend.

To reproduce the test-and-build job from the repository root:

```powershell
npm ci
npm --prefix client ci
npm test
npm --prefix client test
npm --prefix client run build
```

The backend test command runs authentication rate-limit, booking rate-limit,
and booking validation checks. Semgrep scans the backend and frontend source
in a separate job. Once the test-and-build and Semgrep jobs pass, the Compose
job builds both application images and checks the React page and proxied API
over HTTPS. See the Docker Compose section above for local startup commands.

- [Run #1: initial tests and build passed](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42448870578)
- [Run #2: deliberate test failure skipped the build](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42450301541)
- [Run #3: tests and build recovered after the revert](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42450959998)
- [Run #15: tests, Semgrep, and Compose smoke test passed](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42459982042)
- [Run #21: Member 1 post-merge CI passed on Developer](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42462286422) | [Screenshot](Evidence/Part3/CI/07-developer-post-merge-passed.png)
- [Expanded backend test log](Evidence/Part3/CI/08-merged-backend-tests-passed.png). All 10 added tests passed in the PR checks.
- [Run #26](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42629217319) and [screenshot](Evidence/Part3/CI/09-developer-expanded-tests-passed.png). All three CI jobs passed on Developer after PR #4 merged at 431ec40.
- [CI failure evidence](Evidence/Part3/CI/04-frontend-test-failed.png)
- [Skipped build evidence](Evidence/Part3/CI/05-frontend-build-skipped.png)
- [Successful recovery evidence](Evidence/Part3/CI/06-ci-recovery-passed.png)

## Part 3 security review

| Threat | Implemented controls | Verification |
| --- | --- | --- |
| NoSQL injection and request tampering | The API allowlists request fields and validates input types. Authentication requires a string email. Booking accepts only a valid `gigId` and derives the client identity and price on the server. | The [booking integration report](Evidence/Testing/booking-integration-results.xml) records a rejected injection object. The [Part 3 backend CI log](Evidence/Part3/CI/01-backend-tests-passed.png) shows that malformed IDs and client-supplied prices and identities were rejected. |
| Cross-site scripting (XSS) | Gig text validation rejects HTML delimiters and control characters. React renders gig data as text. The frontend preview and Nginx set a Content Security Policy that restricts scripts to the same origin and blocks inline scripts. Express applies Helmet security headers to API responses. | The [freelancer API report](Evidence/Testing/freelancer-api-results.xml) records a rejected script description. The [CSP evidence](Evidence/Security/client-csp-inline-script-blocked.png) shows an inline script being blocked. |
| Authentication abuse and token misuse | Passwords are hashed with bcrypt. The API checks JWT signatures with HS256, checks token expiry, and loads the current user from MongoDB. Login rate limiting blocks repeated failed attempts. The browser and Compose checks verified HTTPS with a trusted local certificate. | The [admin API report](Evidence/Testing/admin-api-results.xml) records HTTP 401 for missing, invalid, and expired tokens. The [Part 3 backend CI log](Evidence/Part3/CI/01-backend-tests-passed.png) shows HTTP 429 after repeated failed login attempts. The [Chrome HTTPS evidence](Evidence/Part3/HTTPS/02-chrome-valid-https.png) shows a trusted TLS connection. |
| Unauthorised access | Express checks roles and resource ownership on the server. Gig updates and deletions are restricted to the owner. Booking history, freelancer income, and transactions are scoped to the authenticated user's identity. | The [freelancer API report](Evidence/Testing/freelancer-api-results.xml) records rejected non-owner gig updates and deletions. The [booking integration report](Evidence/Testing/booking-integration-results.xml) records account isolation. The [admin API report](Evidence/Testing/admin-api-results.xml) records HTTP 403 for client and freelancer requests to admin endpoints. |

The Newman reports above are retained integration evidence from Part 2.
The Part 3 workflow runs the backend rate-limit and booking-validation
scripts, frontend tests, Semgrep, and the HTTPS Compose smoke checks.

The local Docker Compose browser smoke test passed through Nginx HTTPS. A test client signed in and saw the new booking marked confirmed in My Bookings. After sign-out, reopening the protected bookings URL redirected to login. See the [confirmed booking screenshot](Evidence/Part3/HTTPS/03-compose-booking-confirmed.png).

### Remaining limitations and integration checks

- Server-side logout revokes the presented token. CI verified that
  revocation persists across a MongoDB reconnection. Browser verification
  of logout and token replay on the merged Compose stack remains open.
- The rate-limit scripts verify thresholds on a standalone Express server.
  Verify how requests from separate clients are counted behind Nginx on the
  integrated stack.
- The local HTTPS evidence uses a locally trusted development certificate.
  The Semgrep scan covers the files and rules reported in its summary, and the
  open `minimatch` development dependency advisory is recorded in the audit
  section above.
- [GitHub Actions run #36](https://github.com/ST10294518/INSY7314-POE-Repo/actions/runs/42651327500) verified MongoDB-backed account lockout
  and token revocation on `Developer` after PR #7 merged. All 11 scenarios
  passed. Node reported 12 passes including the parent test, with zero
  failures and zero skips.
  See the [post-merge test log screenshot](Evidence/Part3/Security/02-developer-mongodb-security-integration-passed.png).


<!-- MEMBER2-FEEDBACK-START -->
## Consolidated API endpoint reference

This table is derived from src/app.js and all five route modules. Public means no JWT is required. Protected endpoints require Authorization: Bearer <token>. Admin is not an automatic bypass for owner or freelancer-only checks. Unknown paths return 404. There is no independent payment-create endpoint: booking creation records the simulated payment atomically. Update this table when logout or other new endpoints are added.

| Method | Endpoint | Access | Behaviour / restriction |
| --- | --- | --- | --- |
| GET | / | Public | API status |
| POST | /api/auth/register | Public | Creates client/freelancer only; registration limit |
| POST | /api/auth/login | Public | Network + account throttling |
| GET | /api/auth/me | Any authenticated role | Own profile |
| POST | /api/auth/logout | Any authenticated role | Revoke the current token until expiry |
| GET | /api/gigs | Public | Active gigs |
| GET | /api/gigs/mine | Freelancer | Own active gigs |
| GET | /api/gigs/:id | Public | Active gig details |
| POST | /api/gigs | Freelancer | Create own gig |
| PUT | /api/gigs/:id | Freelancer owner | Update own active gig |
| DELETE | /api/gigs/:id | Freelancer owner | Soft-delete own gig |
| POST | /api/bookings | Client | Own booking and simulated transaction; Idempotency-Key required |
| GET | /api/bookings/mine | Client | Own booking history |
| GET | /api/bookings/freelancer | Freelancer | Own received bookings |
| GET | /api/bookings/:id | Authenticated booking participant | Controller requires matching client or freelancer ID; otherwise 404 |
| GET | /api/transactions/income | Freelancer | Own income; includes estimate after tax package installation |
| GET | /api/transactions/mine | Freelancer | Own transaction history |
| GET | /api/admin/me | Admin | Verify admin access |
| GET | /api/admin/overview | Admin | System overview |
| GET | /api/admin/users | Admin | Paginated users |
| GET | /api/admin/gigs | Admin | Paginated gigs |
| GET | /api/admin/bookings | Admin | Paginated bookings |
| GET | /api/admin/transactions | Admin | Paginated transactions |

## Authentication rate limiting for real users

This section supersedes earlier descriptions of an IP-only five-attempt login limit.

An IP identifies a network connection, not necessarily an individual. Shared campus Wi-Fi, households, offices, mobile carriers and proxies can place many accounts behind one IP. The old five-failure IP bucket could block unrelated users.

This revision layers two independent login budgets: 200 requests per resolved IP/subnet per 15 minutes and five unsuccessful requests per normalized account email per 15 minutes. The numbers are project defaults, not OWASP-prescribed thresholds; tune using observed traffic and support data. Email normalization runs before the account limiter, matching the login lookup. Existing and nonexistent account names follow the same limiter path. SHA-256 avoids raw email keys but is not encryption or protection against email guessing. Successful responses are removed from the account failure count; they do not reset preceding failures. Concurrent in-flight requests can temporarily consume the budget. IP limits count every login request, including malformed inputs. Registration retains a distinct 10-per-hour network cap; this still affects shared networks and needs capacity planning or a verified enrolment flow.

The account bucket spans source IPs, so rotating IPs does not reset its budget. Different accounts sharing an IP have separate five-failure budgets but still share the larger network ceiling. Deliberate account throttling can deny access to a victim; recovery, MFA, risk-based challenges and monitoring are further mitigations. This does not replace the separately planned persistent account-lockout feature.

### Proxy and deployment configuration

Express defaults to trusting no proxy. The supplied Nginx proxy does not forward client IP headers, so Docker traffic may currently share the proxy IP. Before a real-user rollout, Member 1 must configure Nginx to overwrite X-Forwarded-For with the client address at a controlled public edge, then configure Express trust proxy with only the actual proxy addresses/subnets. Do not use trust proxy = true blindly. Do not trust a client-supplied header directly. If there are upstream load balancers, map the complete trusted chain and header rewriting policy first. Verify req.ip with two clients and a spoofed forwarding header. Do not log tokens in diagnostic endpoints.

The default MemoryStore is process-local and resets on restart. Multiple replicas need an external shared store with independent key prefixes for each limiter. Persistent account protection, monitoring and store-failure policy must be designed and verified before claiming production readiness. Do not whitelist shared public IPs. Keep IPv6 subnet-aware handling via the library's default IP key generator and ipKeyGenerator fallback.

### Evidence and tests

Run npm test and node --test src/tests/authSharedIp.test.cjs. Capture account A's sixth failed request returning 429, account B still reaching authentication on the same IP, a successful login not consuming the failure allowance, and a rate-limit response with Retry-After. The isolated test uses mocked authentication, not real user credentials. Perform real-account, proxy and multi-instance checks separately. Add the new test command to CI in coordination with Member 1.

## Code attribution and research sources

Attribution is required for adapted code and external assistance, not just a general bibliography. Retain original copyright and licence notices. The group must verify and complete earlier code provenance; this section does not assert that unreviewed code is original.

| Scope | Source / assistance | Use and remaining verification |
| --- | --- | --- |
| Soft deletion package: Gig model, gig/booking/admin controllers | OpenAI ChatGPT assistance in this project conversation, 8 November 2026 | Generated/adapted from supplied group code; existing tests passed locally per group terminal output; database history evidence still required |
| Tax estimate utility, income controller/UI and supplied tests | OpenAI ChatGPT assistance in this project conversation, 8 November 2026 | Illustrative 20% coursework rule, not SARS law; installation and application evidence must be recorded |
| Revised authRateLimiter.js, authRoutes.js and shared-IP tests | OpenAI ChatGPT assistance, 8 November 2026; express-rate-limit and OWASP documentation below | Project-specific implementation adapted from documented APIs and design guidance; group must run supplied tests |
| Existing Part 1/2 code, assets and Member 1 infrastructure | Group members must identify actual authors, tutorials, repositories, AI assistance and licences | Provenance not established by this patch; replace this row with verified entries before submission |

When code is copied or adapted, add a nearby comment naming the source and adaptation, and include author/organisation, title, URL, access date and licence where applicable in this register. Attribute images/icons separately. Package dependencies do not establish provenance for copied snippets. Review the institution's AI-use policy and disclose assistance accurately. Attribution does not guarantee reversal of the earlier mark deduction.

### References (accessed 8 November 2026)

- OWASP (n.d.) Authentication Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (login throttling and account-level counters).
- OWASP (n.d.) Bot Management and Anti-Automation Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html (independent account and network budgets).
- express-rate-limit contributors (n.d.) Configuration. https://express-rate-limit.mintlify.app/reference/configuration (key generation, successful-request handling and stores).
- express-rate-limit contributors (n.d.) Error codes. https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/ (proxy/IPv6 checks).
- Express contributors (n.d.) Express behind proxies. https://expressjs.com/en/guide/behind-proxies/ (trusted proxy topology and forwarded headers).
<!-- MEMBER2-FEEDBACK-END -->


<!-- MEMBER2-SECURITY-FEATURES -->
## Additional authentication security features

Implemented persistent temporary account lockout and MongoDB-backed per-token revocation on logout. See [Security feature implementation, tests and limitations](docs/Member2-Security-Features.md). New endpoint: POST /api/auth/logout, available to any authenticated role. Lockout persists across API restarts; logout revokes only the presented token. CI runs the authentication security unit tests and the isolated MongoDB integration suite. See the post-merge results above. Manual browser verification remains open.


<!-- MEMBER2-LOGGING-MONITORING -->
## Logging and monitoring

The API emits structured JSON for authentication, bookings, committed simulated transactions, gig changes, logout, rate limiting and errors. Each request has a generated request ID. Secrets, request bodies, raw errors and query strings are excluded. Optional Better Stack HTTPS ingestion supports cloud search and monitoring. See [Logging implementation, cloud setup and evidence checklist](docs/Member2-Logging-Monitoring.md). Cloud connectivity and real-event delivery must be verified separately; pending Atlas connectivity still blocks database-dependent evidence. Logging uses bounded best-effort delivery and is not a guaranteed financial audit trail.
