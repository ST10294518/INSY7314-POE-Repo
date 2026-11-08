const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {estimateTax}=require('../utils/taxEstimate');
function load(aggregate){const ctx={require:n=>n.includes('taxEstimate')?{estimateTax}:{aggregate},module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../controllers/transactionController.js'),'utf8'),ctx);return ctx.module.exports;}
function response(){return {status(x){this.code=x;return this},json(x){this.body=x;return this}}}
test('uses authenticated identity and completed-only transactions',async()=>{let pipeline;const c=load(async p=>{pipeline=p;return [{totalIncome:1000,completedTransactions:2}]});const r=response();await c.getIncome({user:{_id:'account-a'},query:{freelancer:'account-b'}},r,e=>{throw e});assert.equal(pipeline[0].$match.freelancer,'account-a');assert.equal(pipeline[0].$match.status,'completed');assert.equal(r.body.estimatedTax,200);assert.equal(r.body.completedTransactions,2)});
test('empty account returns zero estimate',async()=>{const c=load(async()=>[]);const r=response();await c.getIncome({user:{_id:'empty'}},r,e=>{throw e});assert.equal(r.body.totalIncome,0);assert.equal(r.body.estimatedTax,0);assert.equal(r.body.incomeAfterEstimatedTax,0)});
test('database failures are forwarded rather than shown as zero',async()=>{const error=new Error('database unavailable');const c=load(async()=>{throw error});let received;await c.getIncome({user:{_id:'a'}},response(),e=>{received=e});assert.equal(received,error)});
