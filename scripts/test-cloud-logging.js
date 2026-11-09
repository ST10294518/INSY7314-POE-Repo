// Documentation references added during final review (9 November 2026).
// LOG: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
// CLOUD: https://betterstack.com/docs/logs/ingesting-data/http/logs/
// CRYPTO: https://nodejs.org/api/crypto.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
require('dotenv').config({quiet:true});
const {logger}=require('../src/services/logger');
const {randomUUID}=require('node:crypto');
(async()=>{
 if(!logger.stats().cloudEnabled){console.error('Cloud logging is not configured. Add BETTER_STACK_SOURCE_TOKEN and BETTER_STACK_INGESTING_HOST to .env locally.');process.exitCode=1;return}
 const requestId=randomUUID();
 logger.info('logging_connectivity_test',{requestId,source:'cloud-connectivity-test'});
 await logger.flush();
 const stats=logger.stats();
 if(stats.delivered>0 && stats.dropped===0){console.log(`Cloud accepted the synthetic connectivity event. Search requestId: ${requestId}`)}
 else{console.error('Cloud delivery was not confirmed. Check source token, ingesting host, quota and network locally. No credentials were printed.');process.exitCode=1}
})().catch(()=>{console.error('Cloud connectivity test failed.');process.exitCode=1});
