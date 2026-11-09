// Documentation references added during final review (9 November 2026).
// REACT: https://react.dev/reference/react
// ROUTER: https://reactrouter.com/start/declarative/routing
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorised" replace />
  }

  return <Outlet />
}
