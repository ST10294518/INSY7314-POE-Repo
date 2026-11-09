// Integration tests must not export synthetic events to a real cloud source.
process.env.BETTER_STACK_SOURCE_TOKEN = '';
process.env.BETTER_STACK_INGESTING_HOST = '';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID,randomBytes,createHash}=require('node:crypto');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
// Use a separate randomly named DB. Never drop a database named in the URI.
test('persistent lockout and token revocation with MongoDB',{
 skip: !process.env.SECURITY_TEST_MONGODB_URI,
},async(t)=>{
 process.env.JWT_SECRET=randomBytes(32).toString('hex');
 process.env.BCRYPT_SALT_ROUNDS='10';
 const dbName='hhst_kairah_security';
 await mongoose.connect(process.env.SECURITY_TEST_MONGODB_URI,{dbName});
 const User=require('../models/User');
 const RevokedToken=require('../models/RevokedToken');
 const security=require('../services/authSecurity');
 const {loginRateLimiter}=require('../middleware/authRateLimiter');
 const app=require('../app');
 const server=app.listen(0,'127.0.0.1');
 await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function request(path,method='GET',body,token){
  const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,body:await r.json()};
 }
 const password='SecurePassword123!';
 const email='security-a@example.test';
 const emailB='security-b@example.test';
 let initialToken, sessionB, relogin;
 function clearAccountLimit(e){loginRateLimiter.resetKey('account:'+createHash('sha256').update(e).digest('hex'));}
 try{
 await Promise.all([User.init(),RevokedToken.init()]);
 await t.test('registration returns only safe account fields',async()=>{
  const r=await request('/api/auth/register','POST',{email,password,role:'client'});
  assert.equal(r.status,201);initialToken=r.body.token;
  for(const key of ['passwordHash','failedLoginAttempts','lockUntil'])assert.equal(r.body.user[key],undefined);
  assert.equal((await request('/api/auth/me','GET',null,initialToken)).status,200);
 });
 await t.test('five failed passwords persist a temporary lock',async()=>{
  for(let i=0;i<5;i++)assert.equal((await request('/api/auth/login','POST',{email,password:'Incorrect123!'})).status,401);
  const user=await User.findOne({email}).select('+failedLoginAttempts +lockUntil');
  assert.equal(user.failedLoginAttempts,5);assert.ok(user.lockUntil>new Date());
  assert.equal((await request('/api/auth/login','POST',{email,password})).status,429);
 });
 await t.test('clearing in-memory rate limits does not remove database lock',async()=>{
  clearAccountLimit(email);
  const before=await User.findOne({email}).select('+lockUntil');
  const r=await request('/api/auth/login','POST',{email,password});
  assert.equal(r.status,401);assert.equal(r.body.message,'Invalid email or password.');
  const after=await User.findOne({email}).select('+lockUntil');
  assert.equal(+after.lockUntil,+before.lockUntil);
 });
 await t.test('another account sharing the network can authenticate',async()=>{
  const r=await request('/api/auth/register','POST',{email:emailB,password,role:'freelancer'});
  assert.equal(r.status,201);sessionB=r.body.token;
  assert.equal((await request('/api/auth/login','POST',{email:emailB,password})).status,200);
 });
 await t.test('expired lock allows login and resets failure state',async()=>{
  await User.updateOne({email},{$set:{lockUntil:new Date(Date.now()-1000),lastFailedLoginAt:new Date(Date.now()-16*60*1000)}});
  clearAccountLimit(email);
  const r=await request('/api/auth/login','POST',{email,password});
  assert.equal(r.status,200);relogin=r.body.token;
  const user=await User.findOne({email}).select('+failedLoginAttempts +lockUntil');
  assert.equal(user.failedLoginAttempts,0);assert.equal(user.lockUntil,null);
 });
 await t.test('atomic concurrent failures cannot lose increments',async()=>{
  const user=await User.findOne({email:emailB});
  await Promise.all(Array.from({length:8},()=>security.recordLoginFailure(user._id)));
  const state=await User.findById(user._id).select('+failedLoginAttempts +lockUntil');
  assert.equal(state.failedLoginAttempts,5);assert.ok(state.lockUntil>new Date());
 });
 await t.test('logout revokes only that exact token and stores no raw token',async()=>{
  assert.equal((await request('/api/auth/logout','POST',{},relogin)).status,200);
  assert.equal((await request('/api/auth/me','GET',null,relogin)).status,401);
  assert.equal((await request('/api/auth/me','GET',null,initialToken)).status,200);
  assert.equal((await request('/api/auth/me','GET',null,sessionB)).status,200);
  const entry=await RevokedToken.findOne({tokenDigest:security.digestToken(relogin)}).lean();
  assert.ok(entry);assert.ok(entry.expiresAt>new Date());assert.equal(entry.token,undefined);
  assert.equal((await request('/api/auth/logout','POST',{},relogin)).status,401);
 });
 await t.test('revocation persists across a database reconnection',async()=>{
  await mongoose.disconnect();await mongoose.connect(process.env.SECURITY_TEST_MONGODB_URI,{dbName});
  assert.equal((await request('/api/auth/me','GET',null,relogin)).status,401);
 });
 await t.test('expired and missing-exp tokens are rejected',async()=>{
  const user=await User.findOne({email});
  const expired=jwt.sign({id:String(user._id)},process.env.JWT_SECRET,{expiresIn:-1});
  const noExpiry=jwt.sign({id:String(user._id)},process.env.JWT_SECRET);
  assert.equal((await request('/api/auth/me','GET',null,expired)).status,401);
  assert.equal((await request('/api/auth/me','GET',null,noExpiry)).status,401);
 });
 await t.test('successful login clears preceding failed attempts',async()=>{
  assert.equal((await request('/api/auth/login','POST',{email,password:'Incorrect123!'})).status,401);
  assert.equal((await request('/api/auth/login','POST',{email,password})).status,200);
  const state=await User.findOne({email}).select('+failedLoginAttempts');assert.equal(state.failedLoginAttempts,0);
 });
 await t.test('legacy users without security fields can log in',async()=>{
  await User.collection.updateOne({email},{$unset:{failedLoginAttempts:'',lastFailedLoginAt:'',lockUntil:''}});
  assert.equal((await request('/api/auth/login','POST',{email,password})).status,200);
 });
 }finally{
  await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
  } catch {
    console.error('Cleanup could not remove the temporary test database. Atlas permissions need review.');
  } finally {
    await mongoose.disconnect();
  }
 }
});
