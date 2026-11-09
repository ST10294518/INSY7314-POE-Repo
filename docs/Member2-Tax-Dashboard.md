# Income and tax estimate

The existing authenticated freelancer income endpoint now includes estimatedTax, incomeAfterEstimatedTax, taxRate, period and method. Existing currency, totalIncome and completedTransactions fields remain available. It uses only that freelancer's completed transactions; refunded transactions are excluded. The reporting period is all time, not an annual SARS assessment. Gig soft deletion does not remove financial records.

## Coursework assumptions
A flat 20% reserve is an illustrative application rule, not an official South African tax rate or an estimate of SARS liability. Tax brackets, tax years, rebates, deductions, expenses and other income are not modelled. The interface explicitly states these limits. Amounts are converted to cents, the reserve is rounded to the nearest cent, and remaining income is computed by subtraction. Example: R1,000 income yields R200 reserve and R800 remaining; R123.45 yields R24.69 reserve and R98.76 remaining.

## Verification
Run node --test src/tests/taxEstimate.test.cjs src/tests/taxIncomeController.test.cjs, npm test, npm --prefix client test, and npm --prefix client run build. npm test includes both tax test files and the shared-IP test; CI invokes npm test.

Manual checks: zero income; create a completed transaction and refresh; check displayed totals against worked examples; verify Account A cannot access Account B income; check loading/error handling; check the allocation bar; verify income persists after gig deletion. Capture screenshots in Evidence/Part3/Tax. Add a link to this document from the final README.

Recorded verification: six utility tests and three mocked controller tests pass in npm test; the frontend suite passed 51 tests across 11 files. Browser evidence shows R5,000 income, R1,000 reserve, R4,000 remaining and one completed transaction. A second freelancer session shows R6,634 across three transactions, R1,326.80 reserve and R5,307.20 remaining. The supplied screenshots and tester report support account separation; they are not an independent cross-account API penetration test. See [evidence index](../Evidence/Part3/Member2-Evidence-Index.md).
