// Documentation references added during final review (9 November 2026).
// NODETEST: https://nodejs.org/api/test.html
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {estimateTax} = require('../utils/taxEstimate');
test('zero income produces zero tax',()=>{assert.equal(estimateTax(0).estimatedTax,0)});
test('1000 income reserves 200 and leaves 800',()=>{const x=estimateTax(1000);assert.equal(x.estimatedTax,200);assert.equal(x.incomeAfterEstimatedTax,800)});
test('rounds to cents while preserving the total',()=>{const x=estimateTax(123.45);assert.equal(x.estimatedTax,24.69);assert.equal(x.incomeAfterEstimatedTax,98.76)});
test('one-cent income remains accounted for',()=>{const x=estimateTax(.01);assert.equal(x.estimatedTax,0);assert.equal(x.incomeAfterEstimatedTax,.01)});
test('rejects invalid amounts',()=>{for(const x of [-1,NaN,Infinity,'100',null]) assert.throws(()=>estimateTax(x),TypeError)});
test('rejects amounts outside safe cent precision',()=>assert.throws(()=>estimateTax(Number.MAX_VALUE),RangeError));
