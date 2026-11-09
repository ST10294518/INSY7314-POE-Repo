import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContext, useState } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { AuthContext } from '../context/AuthStateContext'
import { authApi } from '../services/api'
vi.mock('../services/api', () => ({
 authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), logout: vi.fn() },
 setUnauthorizedHandler: vi.fn(() => () => {}),
}))
const account = {id:'507f1f77bcf86cd799439011',email:'a@example.test',role:'client'}
function Consumer(){
 const auth=useContext(AuthContext)
 const [error,setError]=useState('')
 return <>
  <p data-testid="identity">{auth.user?.email || 'signed out'}</p>
  <p data-testid="token">{auth.token || 'no token'}</p>
  <button onClick={()=>auth.login('a@example.test','password')}>Sign in</button>
  <button onClick={()=>auth.logout().catch(()=>setError('Logout failed'))}>Sign out</button>
  {error && <p role="alert">{error}</p>}
 </>
}
beforeEach(()=>{
 vi.mocked(authApi.login).mockReset().mockResolvedValue({token:'token-a',user:account})
 vi.mocked(authApi.me).mockReset().mockResolvedValue({user:account})
 vi.mocked(authApi.logout).mockReset().mockResolvedValue({message:'Logged out'})
})
describe('Server-confirmed logout',()=>{
 it('calls server logout with the current token then clears local state',async()=>{
  const user=userEvent.setup();render(<AuthProvider><Consumer /></AuthProvider>)
  await user.click(screen.getByText('Sign in'))
  expect(await screen.findByText('a@example.test')).toBeInTheDocument()
  await user.click(screen.getByText('Sign out'))
  expect(authApi.logout).toHaveBeenCalledWith('token-a')
  expect(await screen.findByText('signed out')).toBeInTheDocument()
  expect(screen.getByText('no token')).toBeInTheDocument()
 })
 it('keeps session visible when revocation cannot be confirmed',async()=>{
  vi.mocked(authApi.logout).mockRejectedValue(new Error('Network unavailable'))
  const user=userEvent.setup();render(<AuthProvider><Consumer /></AuthProvider>)
  await user.click(screen.getByText('Sign in'));await screen.findByText('a@example.test')
  await user.click(screen.getByText('Sign out'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Logout failed')
  expect(screen.getByTestId('identity')).toHaveTextContent('a@example.test')
  expect(screen.getByTestId('token')).toHaveTextContent('token-a')
 })
 it('clears state if the server reports the token already invalid',async()=>{
  vi.mocked(authApi.logout).mockRejectedValue(Object.assign(new Error('Unauthorized'),{status:401}))
  const user=userEvent.setup();render(<AuthProvider><Consumer /></AuthProvider>)
  await user.click(screen.getByText('Sign in'));await screen.findByText('a@example.test')
  await user.click(screen.getByText('Sign out'))
  expect(await screen.findByText('signed out')).toBeInTheDocument()
 })
 it('a late logout response does not clear a newer signed-in session',async()=>{
  let finish;vi.mocked(authApi.logout).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
  const user=userEvent.setup();render(<AuthProvider><Consumer /></AuthProvider>)
  await user.click(screen.getByText('Sign in'));await screen.findByText('token-a')
  await user.click(screen.getByText('Sign out'))
  vi.mocked(authApi.login).mockResolvedValue({token:'token-b',user:account})
  await user.click(screen.getByText('Sign in'));await screen.findByText('token-b')
  finish({});await user.click(screen.getByText('Sign in'))
  expect(screen.getByTestId('token')).toHaveTextContent('token-b')
 })
})
