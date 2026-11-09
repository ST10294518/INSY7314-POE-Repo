// Documentation references added during final review (9 November 2026).
// NODETEST: https://nodejs.org/api/test.html
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
// AI-assisted tests; see README attribution.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {loginRateLimiter,loginIpRateLimiter}=require('../middleware/authRateLimiter');
test('shared IP isolates accounts; successful logins do not consume failure budget',async()=>{
const app=express();app.use(express.json());
app.post('/login',loginIpRateLimiter,(req,res,next)=>{req.body.email=req.body.email.trim().toLowerCase();next()},loginRateLimiter,(req,res)=>res.status(req.body.password==='correct'?200:401).json({}));
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/login`;
async function send(email,password='wrong'){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});await r.text();return r}
try {
for(let i=0;i<5;i++)assert.equal((await send('a@example.test')).status,401);
const blocked=await send('a@example.test');assert.equal(blocked.status,429);assert.ok(blocked.headers.get('retry-after'));
assert.equal((await send('b@example.test','correct')).status,200);
for(let i=0;i<5;i++)assert.equal((await send('c@example.test','correct')).status,200);
for(let i=0;i<5;i++)assert.equal((await send('c@example.test')).status,401);
assert.equal((await send('c@example.test')).status,429);
assert.equal((await send(' A@EXAMPLE.TEST ')).status,429);
assert.equal((await send('d@example.test')).status,401);
}finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))}
});
