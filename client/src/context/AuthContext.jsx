// Documentation references added during final review (9 November 2026).
// REACT: https://react.dev/reference/react
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

import { useEffect, useRef, useState } from 'react'
import { authApi, setUnauthorizedHandler } from '../services/api'
import { AuthContext } from './AuthStateContext'

const ALLOWED_ROLES = ['client', 'freelancer', 'admin']

export function AuthProvider({ children }) {
  const sessionToken = useRef(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    return setUnauthorizedHandler((rejectedToken) => {
      if (token && rejectedToken === token) {
        sessionToken.current = null
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

    sessionToken.current = result.token
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

  async function logout() {
    const departingToken = sessionToken.current
    if (departingToken) {
      try {
        await authApi.logout(departingToken)
      } catch (error) {
        // A rejected token is already unusable; other failures keep the session
        // visible so the user can retry instead of assuming server revocation.
        if (error.status !== 401) throw error
      }
    }
    if (sessionToken.current === departingToken) {
      sessionToken.current = null
      setUser(null)
      setToken(null)
      setSessionExpired(false)
    }
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
