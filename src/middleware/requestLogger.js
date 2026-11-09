// Documentation references added during final review (9 November 2026).
// LOG: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
// CLOUD: https://betterstack.com/docs/logs/ingesting-data/http/logs/
// CRYPTO: https://nodejs.org/api/crypto.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const {randomUUID}=require('node:crypto');
const {logger}=require('../services/logger');
const STATIC_PATHS=new Set(['/','/api/auth/login','/api/auth/register','/api/auth/me','/api/auth/logout','/api/gigs','/api/gigs/mine','/api/bookings','/api/bookings/mine','/api/bookings/freelancer','/api/transactions/income','/api/transactions/mine','/api/admin/me','/api/admin/overview','/api/admin/users','/api/admin/gigs','/api/admin/bookings','/api/admin/transactions']);
function endpointFor(url){
 const path=String(url || '').split('?')[0].replace(/\/$/,'') || '/';
 if(STATIC_PATHS.has(path))return path;
 if(/^\/api\/gigs\/[a-f\d]{24}$/i.test(path))return '/api/gigs/:id';
 if(/^\/api\/bookings\/[a-f\d]{24}$/i.test(path))return '/api/bookings/:id';
 return 'unmatched';
}
function createRequestLogger(log=logger){return function requestLogger(req,res,next){
 const start=performance.now();const endpoint=endpointFor(req.originalUrl);
 req.requestId=randomUUID();res.setHeader('X-Request-Id',req.requestId);
 let completed=false;
 function emit(aborted=false){
  if(completed)return;completed=true;
  const metadata={requestId:req.requestId,actorId:res.locals.auditActorId || (req.user?._id?String(req.user._id):undefined),method:req.method,endpoint,status:aborted?499:res.statusCode,durationMs:performance.now()-start,errorType:res.locals.auditErrorType};
  let event='http_request';const success=res.statusCode>=200 && res.statusCode<300;
  if(aborted)event='request_aborted';
  else if(endpoint==='/api/auth/login' && req.method==='POST')event=res.statusCode===429?'auth_rate_limited':success?'login_succeeded':'login_failed';
  else if(endpoint==='/api/auth/register' && req.method==='POST')event=success?'registration_succeeded':res.statusCode===429?'auth_rate_limited':'registration_failed';
  else if(endpoint==='/api/auth/logout' && req.method==='POST')event=success?'logout_succeeded':'logout_failed';
  else if(endpoint==='/api/bookings' && req.method==='POST')event=res.statusCode===201?'booking_created':res.statusCode===200?'booking_reused':'booking_failed';
  else if((endpoint==='/api/gigs' || endpoint==='/api/gigs/:id') && ['POST','PUT','DELETE'].includes(req.method))event=success?({POST:'gig_created',PUT:'gig_updated',DELETE:'gig_deleted'}[req.method]):'gig_change_failed';
  if(!aborted && res.statusCode>=500)event='application_error';
  const level=aborted || res.statusCode>=400?(res.statusCode>=500?'error':'warn'):'info';
  log[level](event,metadata);
  if(res.locals.accountLocked)log.warn('account_lockout_enforced',metadata);
  // Only set after the booking/payment transaction commits, not on retries.
  if(!aborted && res.statusCode===201 && res.locals.completedPayment){
    log.info('transaction_recorded',{...metadata,bookingId:res.locals.completedPayment.bookingId,transactionId:res.locals.completedPayment.transactionId});
  }
 }
 res.once('finish',()=>emit());
 res.once('close',()=>{if(!res.writableFinished)emit(true)});
 next();
}}
module.exports={requestLogger:createRequestLogger(),createRequestLogger,endpointFor};
