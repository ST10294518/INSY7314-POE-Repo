// Documentation references added during final review (9 November 2026).
// NODETEST: https://nodejs.org/api/test.html
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('node:crypto');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const generateToken = require('../utils/generateToken');
const security = require('../services/authSecurity');
test('new tokens are distinct even for the same account in the same second', () => {
 const user = {_id:{toString:()=> '507f1f77bcf86cd799439011'},email:'a@example.test',role:'client'};
 const a=generateToken(user), b=generateToken(user);
 assert.notEqual(a,b);const decoded=jwt.verify(a,process.env.JWT_SECRET,{algorithms:['HS256']});
 assert.ok(decoded.jti);assert.ok(decoded.exp);assert.equal(decoded.id,user._id.toString());
});
test('token digests are stable, distinct, and do not contain the token',()=>{
 const a=security.digestToken('token-a');assert.match(a,/^[a-f0-9]{64}$/);
 assert.equal(a,security.digestToken('token-a'));assert.notEqual(a,security.digestToken('token-b'));
});
test('lock state expires at its boundary and tolerates legacy accounts',()=>{
 const now=new Date('2026-11-08T12:00:00Z');
 assert.equal(security.isLocked({},now),false);
 assert.equal(security.isLocked({lockUntil:new Date(now.getTime()+1)},now),true);
 assert.equal(security.isLocked({lockUntil:now},now),false);
 assert.equal(security.isLocked({lockUntil:new Date(now.getTime()-1)},now),false);
});
test('failed-login update is a DB pipeline excluding currently locked accounts',async()=>{
 const User=require('../models/User');const original=User.updateOne;let captured;
 User.updateOne=async(...args)=>{captured=args;return {modifiedCount:1}};
 try{
 const now=new Date('2026-11-08T12:00:00Z');await security.recordLoginFailure('account',now);
 assert.equal(captured[0]._id,'account');assert.equal(captured[0].$or[2].lockUntil.$lte,now);
 assert.ok(Array.isArray(captured[1]));assert.equal(captured[2].updatePipeline,true);
 assert.equal(captured[1][1].$set.lockUntil.$cond[1].getTime(),now.getTime()+security.LOCK_MS);
 }finally{User.updateOne=original}
});
test('successful-login reset rechecks both password hash and lock state',async()=>{
 const User=require('../models/User');const original=User.findOneAndUpdate;let captured;
 User.findOneAndUpdate=async(...args)=>{captured=args;return {}};
 try{
 await security.completeSuccessfulLogin({_id:'account',passwordHash:'observed-hash'});
 assert.equal(captured[0].passwordHash,'observed-hash');assert.ok(captured[0].$or);
 assert.equal(captured[1].$set.failedLoginAttempts,0);
 assert.equal(captured[2].returnDocument,'after');
 }finally{User.findOneAndUpdate=original}
});
test('revocation writes only digest/expiry and tolerates duplicate concurrent inserts',async()=>{
 const RevokedToken=require('../models/RevokedToken');const original=RevokedToken.updateOne;let captured;
 RevokedToken.updateOne=async(...args)=>{captured=args;throw Object.assign(new Error('duplicate'),{code:11000})};
 try{
 const expiry=new Date(Date.now()+60000);await security.revokeToken({tokenDigest:'a'.repeat(64),expiresAt:expiry});
 assert.equal(captured[0].tokenDigest,'a'.repeat(64));assert.equal(captured[1].$setOnInsert.expiresAt,expiry);
 assert.equal(JSON.stringify(captured).includes('raw-token'),false);
 }finally{RevokedToken.updateOne=original}
});
test('revocation database read failures propagate, preventing fail-open access',async()=>{
 const RevokedToken=require('../models/RevokedToken');const original=RevokedToken.exists;
 RevokedToken.exists=async()=>{throw new Error('database unavailable')};
 try{await assert.rejects(()=>security.isRevoked('digest'),/database unavailable/)}finally{RevokedToken.exists=original}
});
