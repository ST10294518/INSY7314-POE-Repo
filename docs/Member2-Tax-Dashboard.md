# Income and tax estimate

The existing authenticated freelancer income endpoint now includes estimatedTax, incomeAfterEstimatedTax, taxRate, period and method. Existing currency, totalIncome and completedTransactions fields remain available. It uses only that freelancer's completed transactions; refunded transactions are excluded. The reporting period is all time, not an annual SARS assessment. Gig soft deletion does not remove financial records.

## Coursework assumptions
A flat 20% reserve is an illustrative application rule, not an official South African tax rate or an estimate of SARS liability. Tax brackets, tax years, rebates, deductions, expenses and other income are not modelled. The interface explicitly states these limits. Amounts are converted to cents, the reserve is rounded to the nearest cent, and remaining income is computed by subtraction. Example: R1,000 income yields R200 reserve and R800 remaining; R123.45 yields R24.69 reserve and R98.76 remaining.

## Verification
Run node --test src/tests/taxEstimate.test.cjs src/tests/taxIncomeController.test.cjs, npm test, npm --prefix client test, and npm --prefix client run build. Existing CI runs npm test, so Member 1 should add the new test command to CI or the npm test script. No package files or infrastructure files are replaced by this package.

Manual checks: zero income; create a completed transaction and refresh; check displayed totals against worked examples; verify Account A cannot access Account B income; check loading/error handling; check the allocation bar; verify income persists after gig deletion. Capture screenshots in Evidence/Part3/Tax. Add a link to this document from the final README.

Validation performed when packaged: six calculation tests and mocked income-controller tests. Full database and browser verification remains required. The frontend test/build commands must also be run in your project.
