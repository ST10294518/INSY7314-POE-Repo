// Documentation references added during final review (9 November 2026).
// LOG: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
// CLOUD: https://betterstack.com/docs/logs/ingesting-data/http/logs/
// CRYPTO: https://nodejs.org/api/crypto.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
// Structured logging with optional Better Stack HTTP delivery.
// References: https://betterstack.com/docs/logs/ingesting-data/http/logs/
// https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
const SAFE_KEYS = new Set(['requestId','actorId','bookingId','transactionId','gigId','method','endpoint','status','durationMs','errorType','source','count']);
function safeMetadata(metadata = {}) {
  const safe = {};
  for (const [key,value] of Object.entries(metadata)) {
    if (!SAFE_KEYS.has(key)) continue;
    if (['status','durationMs','count'].includes(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) safe[key]=Math.round(value*100)/100;
    } else if (['actorId','bookingId','transactionId','gigId'].includes(key)) {
      if (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)) safe[key]=value;
    } else if (typeof value === 'string') {
      const patterns = {
        requestId: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
        method: /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/,
        endpoint: /^(unmatched|\/[a-zA-Z0-9/_:-]*)$/,
        errorType: /^(ApplicationError|ValidationError|CastError|SyntaxError|TypeError|MongoServerError|MongooseError)$/,
        source: /^[a-z0-9_-]{1,48}$/,
      };
      if (value.length <= 160 && patterns[key]?.test(value)) safe[key]=value;
    }
  }
  return safe;
}
function cloudEndpoint(host) {
  if (!host) return null;
  const url = new URL(host.startsWith('https://') ? host : `https://${host}`);
  const allowed = ['.betterstackdata.com','.logtail.com','.betterstack.com'].some(s=>url.hostname.endsWith(s));
  if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443') || url.pathname !== '/') {
    throw new Error('Unsupported log ingest host. Use the HTTPS ingesting host from your Better Stack source.');
  }
  return url.origin;
}
function createLogger({env=process.env,write=line=>process.stdout.write(line),fetchImpl=globalThis.fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}) {
  const queue=[];let running=null;
  const stats={delivered:0,dropped:0,deliveryFailures:0};
  let endpoint=null;const token=env.BETTER_STACK_SOURCE_TOKEN;
  const service='hustlehub-api';
  function output(record){try{write(JSON.stringify(record)+'\n')}catch{/* Logging must not replace an application response. */}}
  function diagnostic(event,count=1){output({dt:new Date().toISOString(),level:'warn',message:event,event,service,count});}
  if (token || env.BETTER_STACK_INGESTING_HOST) {
    try {
      if(!token || !env.BETTER_STACK_INGESTING_HOST)throw new Error('Incomplete cloud configuration');
      endpoint=cloudEndpoint(env.BETTER_STACK_INGESTING_HOST);
    } catch { diagnostic('cloud_logging_configuration_invalid'); }
  }
  async function drain(){
    while(queue.length){
      const batch=queue.splice(0,20);let delivered=false;
      for(let attempt=0;attempt<3;attempt++){
        try{
          const response=await fetchImpl(endpoint,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(batch),signal:AbortSignal.timeout(5000)});
          // Never log response bodies or exception messages: they can contain secrets.
          const status=response.status;
          if(response.body)await response.body.cancel();
          if(status>=200 && status<300){delivered=true;break}
          if(status!==429 && status<500)break;
        }catch{/* Bounded retry; originals remain in local stdout. */}
        if(attempt<2)await sleep(100*(2**attempt));
      }
      if(delivered)stats.delivered+=batch.length;
      else{stats.deliveryFailures++;stats.dropped+=batch.length;diagnostic('cloud_logging_delivery_failed',batch.length);}
    }
  }
  function start(){
    if(!running && endpoint && queue.length){
      running=Promise.resolve().then(drain).finally(()=>{running=null;if(queue.length)start()});
    }
    return running;
  }
  function log(level,event,metadata){
    const eventName=typeof event==='string' && /^[a-z][a-z0-9_]{0,63}$/.test(event)?event:'application_event';
    const record={dt:new Date().toISOString(),level:['info','warn','error'].includes(level)?level:'info',message:eventName,event:eventName,service,...safeMetadata(metadata)};
    output(record);
    if(endpoint){
      if(queue.length>=100){stats.dropped++;if(stats.dropped===1 || stats.dropped%100===0)diagnostic('cloud_logging_queue_full',stats.dropped);}
      else{queue.push(record);start();}
    }
    return record;
  }
  return {info:(e,m)=>log('info',e,m),warn:(e,m)=>log('warn',e,m),error:(e,m)=>log('error',e,m),
    flush:async()=>{while(running || queue.length){if(!endpoint)break;await start()}},
    stats:()=>({...stats,queued:queue.length,cloudEnabled:Boolean(endpoint)})};
}
const logger=createLogger();
module.exports={logger,createLogger,safeMetadata,cloudEndpoint};
