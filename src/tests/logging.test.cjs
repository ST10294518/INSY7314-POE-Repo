// Documentation references added during final review (9 November 2026).
// NODETEST: https://nodejs.org/api/test.html
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createLogger,safeMetadata,cloudEndpoint}=require('../services/logger');
const {endpointFor,createRequestLogger}=require('../middleware/requestLogger');
const express=require('express');
const {errorHandler}=require('../middleware/errorHandler');
function capture(options={}){const lines=[];const logger=createLogger({env:{},write:l=>lines.push(JSON.parse(l)),...options});return {logger,lines}}
test('logs include time, level, service and event',()=>{const {logger,lines}=capture();logger.info('login_succeeded',{status:200});assert.equal(lines[0].event,'login_succeeded');assert.equal(lines[0].service,'hustlehub-api');assert.ok(Date.parse(lines[0].dt));assert.equal(lines[0].status,200)});
test('passwords, tokens, email, body, headers and raw error messages are excluded',()=>{const {logger,lines}=capture();logger.warn('login_failed',{password:'secret-password',token:'jwt-secret',email:'person@example.test',body:{password:'secret-password'},headers:{Authorization:'Bearer jwt-secret'},message:'mongodb+srv://user:password@host',errorType:'mongodb+srv://secret',status:401});const output=JSON.stringify(lines);assert.ok(!output.includes('secret'));assert.ok(!output.includes('person@'));assert.equal(lines[0].status,401)});
test('rejects log injection, query strings and arbitrary event text',()=>{const {logger,lines}=capture();logger.info('bad\nsecret',{endpoint:'/api/gigs?token=secret',source:'raw\nsecret'});assert.equal(lines[0].event,'application_event');assert.equal(lines[0].endpoint,undefined);assert.equal(lines[0].source,undefined)});
test('safe identifiers and finite numeric fields are preserved',()=>{const safe=safeMetadata({actorId:'507f1f77bcf86cd799439011',durationMs:2.345,status:200,count:NaN,requestId:'not-a-uuid'});assert.equal(safe.durationMs,2.35);assert.equal(safe.actorId,'507f1f77bcf86cd799439011');assert.equal(safe.count,undefined);assert.equal(safe.requestId,undefined)});
test('only approved HTTPS ingest hosts are accepted',()=>{assert.equal(cloudEndpoint('source.eu-nbg-2.betterstackdata.com'),'https://source.eu-nbg-2.betterstackdata.com');for(const host of ['http://example.com','https://example.com','https://user:pass@source.betterstackdata.com','https://source.betterstackdata.com?token=secret'])assert.throws(()=>cloudEndpoint(host))});
test('local logs work without cloud credentials',async()=>{const {logger,lines}=capture();logger.info('local_test');await logger.flush();assert.equal(lines.length,1);assert.equal(logger.stats().cloudEnabled,false)});
test('cloud success sends bearer token privately and a JSON batch',async()=>{let sent;const {logger,lines}=capture({env:{BETTER_STACK_SOURCE_TOKEN:'private-source-token',BETTER_STACK_INGESTING_HOST:'source.betterstackdata.com'},fetchImpl:async(url,options)=>{sent={url,options};return {status:202}}});logger.info('logging_connectivity_test');await logger.flush();assert.equal(sent.options.headers.Authorization,'Bearer private-source-token');assert.equal(JSON.parse(sent.options.body)[0].event,'logging_connectivity_test');assert.ok(!JSON.stringify(lines).includes('private-source-token'));assert.equal(logger.stats().delivered,1)});
test('cloud failures are retried finitely, originals remain local, details stay private',async()=>{let calls=0;const {logger,lines}=capture({env:{BETTER_STACK_SOURCE_TOKEN:'private-token',BETTER_STACK_INGESTING_HOST:'source.betterstackdata.com'},fetchImpl:async()=>{calls++;throw new Error('private-token')},sleep:async()=>{}});logger.info('login_failed');await logger.flush();assert.equal(calls,3);assert.equal(logger.stats().dropped,1);assert.ok(lines.some(l=>l.event==='cloud_logging_delivery_failed'));assert.ok(!JSON.stringify(lines).includes('private-token'))});
test('permanent authentication failures are not retried',async()=>{let calls=0;const {logger}=capture({env:{BETTER_STACK_SOURCE_TOKEN:'token',BETTER_STACK_INGESTING_HOST:'source.betterstackdata.com'},fetchImpl:async()=>{calls++;return {status:403}}});logger.info('local_test');await logger.flush();assert.equal(calls,1)});
test('invalid cloud configuration cannot leak credentials or break local logs',()=>{const {logger,lines}=capture({env:{BETTER_STACK_SOURCE_TOKEN:'secret',BETTER_STACK_INGESTING_HOST:'https://bad.example.test'}});logger.info('local_test');assert.equal(logger.stats().cloudEnabled,false);assert.ok(lines.some(l=>l.event==='cloud_logging_configuration_invalid'));assert.ok(!JSON.stringify(lines).includes('secret'))});
test('endpoint templates never retain arbitrary path/query contents',()=>{assert.equal(endpointFor('/api/gigs/507f1f77bcf86cd799439011?token=secret'),'/api/gigs/:id');assert.equal(endpointFor('/private/password-value'),'unmatched')});
test('HTTP events cover login, lockout, committed payment, reuse and errors',async()=>{
 const {logger,lines}=capture();const app=express();app.use(createRequestLogger(logger));app.use(express.json());
 app.post('/api/auth/login',(req,res)=>{if(req.body.locked)res.locals.accountLocked=true;res.status(req.body.success?200:401).json({})});
 app.post('/api/bookings',(req,res)=>{res.locals.auditActorId='507f1f77bcf86cd799439011';if(!req.body.reused)res.locals.completedPayment={bookingId:'507f1f77bcf86cd799439012',transactionId:'507f1f77bcf86cd799439013'};res.status(req.body.reused?200:201).json({})});
 app.get('/crash',(req,res,next)=>next(new Error('secret database password')));app.use(errorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
 const url=`http://127.0.0.1:${server.address().port}`;
 async function send(path,body){const r=await fetch(url+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});await r.text();return r}
 try{
  const r=await send('/api/auth/login?token=secret',{success:true,password:'secret'});assert.match(r.headers.get('x-request-id'),/^[a-f\d-]{36}$/);
  await send('/api/auth/login',{locked:true});await send('/api/bookings',{});await send('/api/bookings',{reused:true});await send('/crash');
  for(const event of ['login_succeeded','login_failed','account_lockout_enforced','booking_created','booking_reused','transaction_recorded','application_error'])assert.ok(lines.some(l=>l.event===event),event);
  assert.equal(lines.filter(l=>l.event==='transaction_recorded').length,1);assert.ok(!JSON.stringify(lines).includes('secret'));
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))}
});
test('cloud queue is bounded under a burst',async()=>{const {logger}=capture({env:{BETTER_STACK_SOURCE_TOKEN:'token',BETTER_STACK_INGESTING_HOST:'source.betterstackdata.com'},fetchImpl:async()=>({status:202})});for(let i=0;i<150;i++)logger.info('burst_test');assert.ok(logger.stats().queued<=100);assert.equal(logger.stats().dropped,50);await logger.flush();assert.equal(logger.stats().delivered,100)});
