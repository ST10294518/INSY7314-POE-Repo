# Member 1 Authentication and Gig API Tests

## Results

Postman and Newman passed all 99 assertions across 47 requests.
Newman exited with code 0.

Evidence:
- ../Evidence/Testing/freelancer-api-results.xml
- ../Evidence/Testing/freelancer-postman-run.png

## Coverage

Registration, login, authenticated profiles, safe user responses,
duplicate accounts, public Admin registration rejection and email injection.

Gig creation, browsing, details, own-Gig listing, editing and deletion.
Client/Freelancer permissions, ownership protection, invalid input,
missing records and missing, invalid and expired JWTs.

Booking, Transaction, income calculations and rate-limit thresholds
require separate API tests.

## Prerequisites

Run commands from the repository root in PowerShell.
Install backend dependencies using npm ci.
Configure the private .env file, MongoDB access and HTTPS certificates.
Start the backend in another terminal using npm start.
The API must be available at https://localhost:5443.

Each complete run creates three test accounts and one temporary Gig.
The final requests delete that Gig. Test accounts remain in MongoDB.
An interrupted run may leave its temporary Gig. Use the agreed development
database and never delete another member's records.

## Newman execution

Generate a correctly signed, already-expired token locally:

```powershell
$expiredApiToken = node -e "require('dotenv').config({quiet:true}); const jwt=require('jsonwebtoken'); if(!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing'); console.log(jwt.sign({id:'000000000000000000000000',role:'freelancer'},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:-60}));"

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($expiredApiToken)) {
    throw 'Could not prepare the expired token.'
}

New-Item -ItemType Directory -Path Evidence/Testing -Force | Out-Null

npx --yes --package=newman@6.2.3 newman run `
    "Postman Collection/HustleHub-Part2-Freelancer-Tests.postman_collection.json" `
    --env-var "expiredToken=$expiredApiToken" `
    --ssl-extra-ca-certs certs/cert.pem `
    --reporters cli,junit `
    --reporter-junit-export Evidence/Testing/freelancer-api-results.xml `
    --timeout-request 20000

"Newman exit code: $LASTEXITCODE"
```

Expected: 47 requests, 99 assertions, zero failures and exit code 0.
TLS verification remains enabled using the local certificate.

Repeated runs may trigger authentication rate limits. Investigate HTTP 429
against the configured window; do not disable protection to pass tests.

## Postman execution

Import the JSON collection. Select one iteration and all 47 requests in
their original order. Create and select a local environment containing
expiredToken with the generated expired token as its populated value.

Trust certs/cert.pem in Postman's CA certificate settings and keep SSL
verification enabled. Do not import the certificate's private key.

Expected rejection responses are tested outcomes: HTTP 400, 401, 403,
404 and 409 can represent passing tests.

Never put JWT_SECRET in Postman. Do not commit populated environments,
saved authentication responses or token values.

## Testing-tool limitation

Newman 6.2.3 introduced 19 reported dependency vulnerabilities, including
one critical finding, when installed into the project. It was removed
from project dependencies and is run separately using pinned npx.

This keeps its dependencies outside the application's package files;
it does not fix Newman itself. Run the reviewed project collection and
reassess tool advisories before future use.
