import { afterEach, expect, it, vi } from 'vitest'
import { authApi, setUnauthorizedHandler } from '../services/api'
afterEach(()=>vi.unstubAllGlobals())
it('sends logout POST with bearer authorization',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({message:'Logged out'})})
 vi.stubGlobal('fetch',fetchMock)
 await authApi.logout('token-a')
 expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout',expect.objectContaining({method:'POST',headers:expect.objectContaining({Authorization:'Bearer token-a'})}))
})
it('propagates revocation failures rather than reporting success',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:500,json:async()=>({message:'Cannot revoke'})}))
 await expect(authApi.logout('token-a')).rejects.toMatchObject({status:500})
})
it('invalidates only the rejected token through existing handler',async()=>{
 const handler=vi.fn();const remove=setUnauthorizedHandler(handler)
 try{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401,json:async()=>({})}))
 await expect(authApi.logout('old-token')).rejects.toMatchObject({status:401})
 expect(handler).toHaveBeenCalledWith('old-token')
 }finally{remove()}
})
