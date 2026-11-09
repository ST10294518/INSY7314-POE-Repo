# Project-wide documentation references and attribution register

Reviewed 9 November 2026. Scope covers backend, frontend, tests, styles, infrastructure and retained assets across both members' work.

## What the file comments mean

New headers identify official documentation consulted during this final review to explain the APIs and design patterns in each file. They do **not** claim that those organisations authored this project, that code was copied from those pages, or that the team used those sources during the original implementation. All original source bytes and existing attribution comments are retained beneath the new headers.

Existing assistance/provenance disclosures are retained in [README history](README-HISTORY.md#code-attribution-and-research-sources) and existing source comments. The history's old pending-test statements are superseded by current evidence. Library documentation is a technical reference, not a substitute for acknowledging actual copied code or assistance. Group members must confirm any earlier tutorial/snippet origins and preserve applicable notices. No new third-party snippet origin or sole-original-authorship claim is invented here.

## Code and design provenance

- The supplied repository contains the group's project-specific marketplace features and infrastructure; member roles are described in the README.
- The 20% tax reserve is a project coursework assumption. It is not a SARS schedule or a rate taken from an external tax authority.
- Soft deletion, account-scoped queries, transaction matching and the dashboard layout are project implementations; relevant API documentation is mapped below without asserting snippet provenance.
- Existing assistance disclosures are not removed or relabelled as official-documentation authorship.
- npm lockfiles record exact installed dependency versions. Dependencies retain their own licences; this document does not relicense them or claim ownership of their code.

## Retained assets and scaffolding

`client/src/assets/react.svg` and `client/src/assets/vite.svg` are retained React/Vite logo assets. Check their original distribution and applicable trademark/licence terms before reuse outside coursework. No group authorship is claimed for these logos. The current entry-point/configuration structure resembles the Vite React starter, but exact original template revision is not recorded in the supplied archive. Confirm that revision from project history if template provenance is required.

Evidence screenshots are team-supplied records of testing and provider interfaces. Provider names/logos remain those of their owners; no image-generator or stock-image provenance is claimed. There are no newly added image assets in this update.

## File-to-reference mapping

Reference IDs below are documentation references, not original author credits. Files with previous notices retain those notices. Generated lockfiles, reports, evidence and vendored logo SVG bytes are not modified.

| File | Documentation IDs |
| --- | --- |
| `.github/workflows/ci.yml` | CI, DOCKER, SEMGREP |
| `Dockerfile` | DOCKER |
| `client/Dockerfile` | DOCKER |
| `client/eslint.config.js` | REACT |
| `client/nginx.conf` | NGINX |
| `client/src/App.css` | CSS |
| `client/src/App.jsx` | REACT, ROUTER |
| `client/src/components/CreateGigForm.jsx` | REACT |
| `client/src/components/DeleteGigConfirmation.jsx` | REACT |
| `client/src/components/EditGigForm.jsx` | REACT |
| `client/src/components/FreelancerIncome.jsx` | REACT |
| `client/src/components/ProtectedRoute.jsx` | REACT, ROUTER |
| `client/src/components/ReceivedBookings.jsx` | REACT |
| `client/src/context/AuthContext.jsx` | REACT |
| `client/src/context/AuthStateContext.js` | REACT |
| `client/src/hooks/useAuth.js` | REACT |
| `client/src/index.css` | CSS |
| `client/src/main.jsx` | REACT |
| `client/src/pages/AdminDashboard.jsx` | REACT, ROUTER |
| `client/src/pages/BookingConfirmation.jsx` | REACT, ROUTER |
| `client/src/pages/BookingDetails.jsx` | REACT, ROUTER |
| `client/src/pages/ClientDashboard.jsx` | REACT, ROUTER |
| `client/src/pages/FreelancerDashboard.jsx` | REACT, ROUTER |
| `client/src/pages/GigDetails.jsx` | REACT, ROUTER |
| `client/src/pages/Login.jsx` | REACT, ROUTER |
| `client/src/pages/MyBookings.jsx` | REACT, ROUTER |
| `client/src/pages/Register.jsx` | REACT, ROUTER |
| `client/src/services/adminApi.js` | FETCH |
| `client/src/services/api.js` | FETCH |
| `client/src/services/freelancerApi.js` | FETCH |
| `client/src/styles/admin.css` | CSS |
| `client/src/styles/freelancer.css` | CSS |
| `client/src/styles/tax-estimate.css` | CSS |
| `client/src/tests/AuthApiLogout.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/AuthLogout.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/ClientDashboard.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/CreateGigForm.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/DeleteGigConfirmation.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/EditGigForm.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/FreelancerDashboard.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/FreelancerIncome.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/GigDetails.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/MyBookings.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/ReceivedBookings.test.jsx` | VITEST, RTL, REACT |
| `client/src/tests/setup.js` | VITEST, RTL, REACT |
| `client/vite.config.js` | VITE, HTTPS, VITEST |
| `client/vitest.config.js` | EXP |
| `compose.ci.yml` | DOCKER |
| `compose.yml` | DOCKER |
| `scripts/provision-admin.js` | MONG, BCRYPT |
| `scripts/run-security-integration.js` | NODETEST |
| `scripts/test-cloud-logging.js` | LOG, CLOUD, CRYPTO |
| `src/app.js` | EXP, PROXY, HELMET |
| `src/config/db.js` | MONG |
| `src/controllers/adminController.js` | EXP, MONG |
| `src/controllers/authController.js` | AUTH, BCRYPT, JWT, MONG |
| `src/controllers/bookingController.js` | EXP, TXN |
| `src/controllers/gigController.js` | EXP, MONG |
| `src/controllers/transactionController.js` | EXP, MONG |
| `src/middleware/authMiddleware.js` | JWT, CRYPTO, MONG |
| `src/middleware/authRateLimiter.js` | RATE, AUTH |
| `src/middleware/bookingRateLimiter.js` | RATE, AUTH |
| `src/middleware/bookingValidation.js` | EXP |
| `src/middleware/errorHandler.js` | EXP |
| `src/middleware/gigValidators.js` | VAL |
| `src/middleware/requestLogger.js` | LOG, CLOUD, CRYPTO |
| `src/middleware/requireFreelancer.js` | EXP |
| `src/middleware/requireRole.js` | EXP |
| `src/middleware/validators.js` | VAL |
| `src/models/Booking.js` | MONG |
| `src/models/Gig.js` | MONG |
| `src/models/RevokedToken.js` | MONG |
| `src/models/Transaction.js` | MONG |
| `src/models/User.js` | MONG, BCRYPT |
| `src/models/userStore.js` | FS |
| `src/routes/adminRoutes.js` | EXP |
| `src/routes/authRoutes.js` | EXP |
| `src/routes/bookingRoutes.js` | EXP |
| `src/routes/gigRoutes.js` | EXP |
| `src/routes/transactionRoutes.js` | EXP |
| `src/server.js` | HTTPS, FS |
| `src/services/authSecurity.js` | AUTH, ATOMIC, CRYPTO |
| `src/services/logger.js` | LOG, CLOUD, CRYPTO |
| `src/tests/authSecurity.integration.cjs` | NODETEST, EXP |
| `src/tests/authSecurity.test.cjs` | NODETEST, EXP |
| `src/tests/authSharedIp.test.cjs` | NODETEST, EXP |
| `src/tests/logging.test.cjs` | NODETEST, EXP |
| `src/tests/taxEstimate.test.cjs` | NODETEST, EXP |
| `src/tests/taxIncomeController.test.cjs` | NODETEST, EXP |
| `src/tests/testAuthRateLimiter.js` | NODETEST, EXP |
| `src/tests/testBookingRateLimiter.js` | NODETEST, EXP |
| `src/tests/testBookingValidation.js` | NODETEST, EXP |
| `src/utils/generateToken.js` | JWT, CRYPTO, MONG |
| `src/utils/taxEstimate.js` | Coursework assumption; no external tax source |

## Official references

All links accessed 9 November 2026 during final review. Documentation may describe a newer release; use the project lockfiles as the installed-version record.

- **EXP**: Express contributors (n.d.) *Express 5 API*. Available at: https://expressjs.com/en/5x/api/ (Accessed: 9 November 2026).
- **PROXY**: Express contributors (n.d.) *Express behind proxies*. Available at: https://expressjs.com/en/guide/behind-proxies/ (Accessed: 9 November 2026).
- **MONG**: Mongoose contributors (n.d.) *Schemas*. Available at: https://mongoosejs.com/docs/guide.html (Accessed: 9 November 2026).
- **TXN**: Mongoose contributors (n.d.) *Transactions*. Available at: https://mongoosejs.com/docs/transactions.html (Accessed: 9 November 2026).
- **ATOMIC**: Mongoose contributors (n.d.) *findOneAndUpdate*. Available at: https://mongoosejs.com/docs/tutorials/findoneandupdate.html (Accessed: 9 November 2026).
- **AUTH**: OWASP Foundation (n.d.) *Authentication Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (Accessed: 9 November 2026).
- **RATE**: express-rate-limit contributors (n.d.) *Configuration*. Available at: https://express-rate-limit.mintlify.app/reference/configuration (Accessed: 9 November 2026).
- **VAL**: express-validator contributors (n.d.) *Documentation*. Available at: https://express-validator.github.io/docs/ (Accessed: 9 November 2026).
- **JWT**: Auth0 contributors (n.d.) *node-jsonwebtoken documentation*. Available at: https://github.com/auth0/node-jsonwebtoken (Accessed: 9 November 2026).
- **BCRYPT**: bcrypt.js contributors (n.d.) *bcrypt.js documentation*. Available at: https://github.com/dcodeIO/bcrypt.js (Accessed: 9 November 2026).
- **HELMET**: Helmet contributors (n.d.) *Helmet reference*. Available at: https://helmet.js.org/ (Accessed: 9 November 2026).
- **LOG**: OWASP Foundation (n.d.) *Logging Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html (Accessed: 9 November 2026).
- **CLOUD**: Better Stack (n.d.) *Ingesting logs*. Available at: https://betterstack.com/docs/logs/ingesting-data/http/logs/ (Accessed: 9 November 2026).
- **CRYPTO**: Node.js contributors (n.d.) *Crypto*. Available at: https://nodejs.org/api/crypto.html (Accessed: 9 November 2026).
- **HTTPS**: Node.js contributors (n.d.) *HTTPS*. Available at: https://nodejs.org/api/https.html (Accessed: 9 November 2026).
- **FS**: Node.js contributors (n.d.) *File system*. Available at: https://nodejs.org/api/fs.html (Accessed: 9 November 2026).
- **NODETEST**: Node.js contributors (n.d.) *Test runner*. Available at: https://nodejs.org/api/test.html (Accessed: 9 November 2026).
- **REACT**: React contributors (n.d.) *React reference overview*. Available at: https://react.dev/reference/react (Accessed: 9 November 2026).
- **ROUTER**: React Router contributors (n.d.) *Declarative routing*. Available at: https://reactrouter.com/start/declarative/routing (Accessed: 9 November 2026).
- **FETCH**: MDN contributors (n.d.) *Fetch API*. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API (Accessed: 9 November 2026).
- **CSS**: MDN contributors (n.d.) *CSS reference*. Available at: https://developer.mozilla.org/en-US/docs/Web/CSS (Accessed: 9 November 2026).
- **VITEST**: Vitest contributors (n.d.) *Getting started*. Available at: https://vitest.dev/guide/ (Accessed: 9 November 2026).
- **RTL**: Testing Library contributors (n.d.) *React Testing Library introduction*. Available at: https://testing-library.com/docs/react-testing-library/intro/ (Accessed: 9 November 2026).
- **VITE**: Vite contributors (n.d.) *Server options*. Available at: https://vite.dev/config/server-options (Accessed: 9 November 2026).
- **DOCKER**: Docker Inc. (n.d.) *Docker Compose*. Available at: https://docs.docker.com/compose/ (Accessed: 9 November 2026).
- **NGINX**: NGINX contributors (n.d.) *HTTP proxy module*. Available at: https://nginx.org/en/docs/http/ngx_http_proxy_module.html (Accessed: 9 November 2026).
- **CI**: GitHub (n.d.) *Workflow syntax for GitHub Actions*. Available at: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax (Accessed: 9 November 2026).
- **SEMGREP**: Semgrep (n.d.) *Sample CI configurations*. Available at: https://docs.semgrep.dev/semgrep-ci/sample-ci-configs (Accessed: 9 November 2026).
- **MKCERT**: Filippo Valsorda (n.d.) *mkcert*. Available at: https://github.com/FiloSottile/mkcert (Accessed: 9 November 2026).
