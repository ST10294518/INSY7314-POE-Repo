// Documentation references added during final review (9 November 2026).
// REACT: https://react.dev/reference/react
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
import { useContext } from 'react'
import { AuthContext } from '../context/AuthStateContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}