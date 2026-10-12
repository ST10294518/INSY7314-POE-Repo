
import { useEffect, useState } from 'react'
import { authApi, setUnauthorizedHandler } from '../services/api'
import { AuthContext } from './AuthStateContext'

const ALLOWED_ROLES = ['client', 'freelancer', 'admin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    return setUnauthorizedHandler((rejectedToken) => {
      if (token && rejectedToken === token) {
        setUser(null)
        setToken(null)
        setSessionExpired(true)
      }
    })
  }, [token])

  async function establishSession(result) {
    if (!result?.token || !result?.user) {
      throw new Error('Invalid authentication response.')
    }

    const verified = await authApi.me(result.token)

    if (
      !verified?.user ||
      !ALLOWED_ROLES.includes(verified.user.role)
    ) {
      throw new Error('Unable to verify account permissions.')
    }

    setToken(result.token)
    setUser(verified.user)
    setSessionExpired(false)

    return verified.user
  }

  async function login(email, password) {
    setLoading(true)

    try {
      const result = await authApi.login(email, password)
      return await establishSession(result)
    } finally {
      setLoading(false)
    }
  }

  async function register(email, password, role) {
    setLoading(true)

    try {
      // Public users must never self-register as Admins.
      if (!['client', 'freelancer'].includes(role)) {
        throw new Error('Invalid registration role.')
      }

      const result = await authApi.register(
        email,
        password,
        role
      )

      return await establishSession(result)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    setToken(null)
    setSessionExpired(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionExpired,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
