// Documentation references added during final review (9 November 2026).
// Project coursework rule: flat 20% reserve; no official tax-rate source is claimed.
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
// Coursework assumption only: a flat 20% reserve, not a SARS calculation.
const RATE = 0.20;
function estimateTax(income) {
  if (typeof income !== 'number' || !Number.isFinite(income) || income < 0) {
    throw new TypeError('Income must be a finite non-negative number.');
  }
  const cents = Math.round(income * 100);
  if (!Number.isSafeInteger(cents)) throw new RangeError('Income is too large.');
  const taxCents = Math.round(cents * RATE);
  return {
    totalIncome: cents / 100,
    estimatedTax: taxCents / 100,
    incomeAfterEstimatedTax: (cents - taxCents) / 100,
    taxRate: RATE,
    period: 'All recorded completed transactions (all time)',
    method: 'Coursework flat-rate estimate: income x 20%. Not SARS tax payable; excludes tax brackets, rebates, expenses and other income.',
  };
}
module.exports = { estimateTax };
