# Freelancer React Tests

## Run tests

From the repository root:
npm --prefix client ci
npm --prefix client test

Watch mode:
npm --prefix client run test:watch

## Setup

Tools: Vitest, React Testing Library, user-event, jest-dom and jsdom.
Configuration: client/vitest.config.js
Shared setup: client/src/tests/setup.js

## Coverage

25 tests across six files cover:
- Create Gig: submission, validation, retry and pending controls.
- Edit Gig: existing values, cancellation, updates, validation and retry.
- Delete Gig: confirmation, cancellation, deletion, retry and pending controls.
- Dashboard: account details, own gigs, empty state, recovery and logout.
- Received bookings: rendering, empty state, recovery and missing references.
- Income: totals display, transaction history, empty state, recovery and invalid responses.

API responses are mocked. Tests do not access MongoDB or modify records.
Backend JWT, permissions, ownership, booking transactions and income calculations require separate API tests.

## Recorded results

All 25 tests passed across six test files.
Production build and ESLint passed.
npm audit reported zero vulnerabilities.

Report: Evidence/Testing/freelancer-react-results.json

To regenerate the report, run inside client:
npm test -- --reporter=verbose --reporter=json --outputFile=../Evidence/Testing/freelancer-react-results.json

## Client React tests

The additional Client suites contain 16 tests:

- ClientDashboard: 5 tests for rendering, filters, empty results,
  API-error recovery and logout.
- GigDetails: 7 tests for rendering, booking submission, confirmation
  navigation, retry-key preservation, pending controls and error messages.
- MyBookings: 4 tests for saved details, empty history, retry recovery
  and missing Gig references.

The combined Client/Freelancer run passed 41 tests across nine files.
API responses are mocked; these tests do not access MongoDB.
Separate Newman integration tests verify actual API behaviour.

Combined report: Evidence/Testing/client-freelancer-react-results.json

Regenerate from the repository root:
npm --prefix client test -- --reporter=verbose --reporter=json --outputFile=../Evidence/Testing/client-freelancer-react-results.json
