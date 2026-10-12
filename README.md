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

Vite uses port 5173. Use the URL printed in the terminal.

To build and inspect the frontend with preview CSP:

```powershell
npm --prefix client run build
npm --prefix client run preview
```

Preview runs at http://localhost:4173.

The frontend calls relative /api paths. Vite proxies those requests to
https://localhost:5443. Its secure:false proxy setting accommodates the
local self-signed backend certificate; it is a local development setting.

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
