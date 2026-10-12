# Booking, Transaction and Rate-Limit Tests

## Recorded results

- Booking/Transaction integration: 38 requests, 78 assertions, zero failures.
- Endpoint rate limits: 34 requests, 44 assertions, zero failures.
- Both Newman runs exited with code 0.

## Prerequisites

Run from the repository root with dependencies installed, MongoDB connected,
and the local HTTPS backend running on https://localhost:5443.

Use certs/cert.pem to verify the local certificate.
Newman runs through pinned npx rather than project dependencies.
Its known dependency-audit limitation is documented in README-Part2-Freelancer.md.

## Booking and Transaction integration

Collection: HustleHub-Part2-Booking-Integration.postman_collection.json

Creates four test accounts, two Gigs and one completed Booking/Transaction.
Records remain in the development database for inspection.
Each run generates fresh test credentials.

Coverage includes:
- Trusted Gig price and authenticated Client/Freelancer identities.
- Confirmed Booking and matching completed Transaction.
- Same-key retry returning the original IDs without duplicate records.
- Conflicting reuse of a key for another Gig.
- Roles, ownership, isolated histories and income.
- Missing, invalid and expired JWTs on Booking details.
- Unsupported fields, injection objects and invalid/missing IDs.
- Income increasing by the saved price exactly once.

Supply an expired JWT signed with the current local JWT secret.
Use the expired-token preparation instructions in README-Part2-Freelancer.md.
Keep that token in a local environment or terminal variable, not this repository.

With $postmanExpiredToken available in PowerShell:

```powershell
npx --yes --package=newman@6.2.3 newman run `
    "Postman Collection/HustleHub-Part2-Booking-Integration.postman_collection.json" `
    --env-var "expiredToken=$postmanExpiredToken" `
    --ssl-extra-ca-certs certs/cert.pem `
    --reporters cli,junit `
    --reporter-junit-export Evidence/Testing/booking-integration-results.xml `
    --timeout-request 20000 `
    --bail
```

This suite sends eight authenticated Client Booking POST requests.
Earlier requests and repeated runs can exhaust the IP-based limits.

## Endpoint rate limits

Collection: HustleHub-Part2-Rate-Limits.postman_collection.json

Run once against a freshly started local backend, with no concurrent
Login, Registration or Booking requests. The default in-memory counters
reset when the local backend restarts; configured limits remain unchanged.

Creates one Client account. Invalid Booking bodies ensure no Bookings
or Transactions are created by this suite.

Checks:
- Six successful logins remain accepted.
- Five failed logins return 401; the sixth returns 429.
- Ten authenticated Booking requests reach validation and return 400;
  the eleventh returns 429.
- The initial successful registration and nine invalid registration
  requests consume ten attempts; the eleventh request returns 429.
- Blocked responses include Retry-After, RateLimit and a safe message.

```powershell
npx --yes --package=newman@6.2.3 newman run `
    "Postman Collection/HustleHub-Part2-Rate-Limits.postman_collection.json" `
    --ssl-extra-ca-certs certs/cert.pem `
    --reporters cli,junit `
    --reporter-junit-export Evidence/Testing/rate-limit-results.xml `
    --timeout-request 20000 `
    --bail
```

After testing, restart the local backend before resuming normal use,
or wait for the rate-limit windows to expire.

## Evidence

Stored under Evidence/Testing:

- booking-integration-results.xml
- booking-integration-newman-run.png
- rate-limit-results.xml
- rate-limit-newman-run.png
- integration-booking-confirmation.png
- integration-freelancer-income.png
- integration-mongodb-booking.png
- integration-mongodb-transaction.png

The manual rehearsal confirmed a R125.50 Booking, matching MongoDB
Transaction, received Booking, income increase of R125.50 and transaction
count increase of one. The results remained after refreshing the dashboard.

## Scope

The retry test is sequential; it does not simulate simultaneous requests.
These suites do not establish Admin functionality, distributed rate-limit
persistence, or complete Client React test coverage.
