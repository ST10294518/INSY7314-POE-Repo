# Additional security features

## 1. Persistent temporary account lockout

Five unsuccessful password attempts with no successful login and no gap of 15 minutes or longer cause a 15-minute lock in the User document. Expired observation state resets on the next failed attempt. During a lock, requests do not extend its expiry. A successful login atomically rechecks the lock/password hash and clears the failure state. Existing documents without the new fields remain compatible. Updates use the current database state, preventing lost increments when several failures arrive concurrently.

Locked accounts, unknown emails and incorrect passwords return the same 401 message. A dummy bcrypt comparison is performed for unknown and locked accounts; this reduces an obvious timing difference but does not promise identical response timing. Existing independent network and account rate limits remain active and may return 429 first. Persistent lockout differs from those process-local limits: clearing their counters or restarting the API does not clear the database lock. Deliberately locking a victim's account remains a denial-of-service risk; recovery, monitoring and MFA are further mitigations. Lockout affects new logins, not already issued sessions. Verify with the assessor that this persistent control is sufficiently distinct from baseline rate limiting for the additional-feature criterion.

## 2. Persistent per-token revocation on logout

POST /api/auth/logout requires a valid bearer token for any authenticated role. The server stores only a SHA-256 digest of that token with its original expiry in the revokedtokens collection. Every protected request checks revocation after signature/expiry validation. New tokens include a random jti so separately issued sessions are distinct even within the same second. Existing signed tokens with an expiry are still accepted until expired or revoked; tokens without an expiry are rejected. Logging out one token does not log out all devices. Requests already authorized before logout are not cancelled.

Revocation persists across restarts and database reconnections. Database errors propagate to the API error handler instead of allowing access. The expiresAt TTL index removes old records asynchronously; authorization also explicitly checks expiry and does not depend on immediate TTL cleanup. The tokenDigest unique index prevents duplicate rows. Normal Mongoose auto-index creation handles both indexes; if autoIndex is disabled, provision these indexes through the deployment process and confirm them before release.

Frontend logout waits for server confirmation before clearing the current session. If the token already returns 401, local state is cleared. Other failures keep the session visible and show a retry message on all three dashboards. A delayed old-session logout response cannot clear a newer session. The frontend token remains in memory as before. A failed or interrupted logout must not be described as confirmed revocation.

## API reference addition

| Method | Endpoint | Access | Behaviour |
| --- | --- | --- | --- |
| POST | /api/auth/logout | Any authenticated role | Revoke the presented token until expiry; other sessions remain valid |

No package dependencies, JWT secret, Docker files, proxy configuration or tax/deletion files are changed. MongoDB write/read availability is required. Never commit .env or token values.

## Verification

- node --test src/tests/authSecurity.test.cjs
- node scripts/run-security-integration.js
- npm test
- node --test src/tests/authSharedIp.test.cjs src/tests/taxEstimate.test.cjs src/tests/taxIncomeController.test.cjs
- npm --prefix client test
- npm --prefix client run build

The integration runner loads .env locally, prefers SECURITY_TEST_MONGODB_URI and otherwise uses MONGODB_URI as the server connection. Use a test deployment. It creates an isolated randomly named hustlehub_security_test_* database, never uses the URI's database name, and drops only that generated database afterwards. The account needs create/write/drop permissions for that temporary database. There are 11 nested MongoDB integration scenarios; report them as unverified if the test is skipped or cannot connect. Do not paste the connection string into chat. The integration test script skips without an explicit test URI; the runner supplies it locally. CI must use a test MongoDB service and include the new tests with Member 1.

Packaging validation: 7 backend security unit tests, existing backend tests, 51 frontend tests and production build passed. A real MongoDB test was attempted but the container could not start the database process (environment restriction), so the 11 database scenarios remain unverified here. The tests cover persistent lockout, shared-IP independence, expiry/reset, concurrent failed attempts, per-token logout, reconnection, expired/missing-exp tokens and legacy documents. Run them in your environment before claiming the features fully verified.

## Manual evidence

1. Record the account lock after five wrong passwords. Clear only rate-limit state by restarting the API; show the correct password is still rejected while the DB lock is active.
2. Show a different account can sign in from the same Wi-Fi. Wait for lock expiry and confirm the locked account can sign in again.
3. In a test client, retain a token, use /api/auth/me successfully, call POST /api/auth/logout, then show the old token receives 401. Keep tokens out of screenshots and submission files.
4. Show another independently signed-in session still works. Confirm frontend logout success and visible retry behaviour on a server/network failure.
5. Capture test summary screenshots in Evidence/Part3/Security and add links to the final README.

## References

OWASP Foundation (n.d.) Authentication Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (Accessed: 8 November 2026).

OWASP Foundation (n.d.) JSON Web Token Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html (Accessed: 8 November 2026).

Mongoose contributors (n.d.) How to use findOneAndUpdate(). Available at: https://mongoosejs.com/docs/tutorials/findoneandupdate.html (Accessed: 8 November 2026).
