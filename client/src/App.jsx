
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
} from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import ClientDashboard from './pages/ClientDashboard'
import GigDetails from './pages/GigDetails'
import MyBookings from './pages/MyBookings'
import BookingDetails from './pages/BookingDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import FreelancerDashboard from './pages/FreelancerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function Home() {
  const { user } = useAuth()

  if (user?.role === 'client') {
    return <Navigate to="/client" replace />
  }

  if (user?.role === 'freelancer') {
    return <Navigate to="/freelancer" replace />
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/login" replace />
}

function Unauthorised() {
  return (
    <main className="message-page">
      <h1>Access restricted</h1>
      <p>
        Your account does not have permission to view this page.
      </p>
      <Link to="/">Return to Home</Link>
    </main>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={<ProtectedRoute allowedRoles={['client']} />}
          >
            <Route
              path="/client"
              element={<ClientDashboard />}
            />
            <Route
              path="/client/gigs/:id"
              element={<GigDetails />}
            />
            <Route
              path="/client/bookings"
              element={<MyBookings />}
            />
            <Route
              path="/client/bookings/:id/confirmation"
              element={<BookingConfirmation />}
            />
            <Route
              path="/client/bookings/:id"
              element={<BookingDetails />}
            />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={['freelancer']} />}
          >
            <Route
              path="/freelancer"
              element={<FreelancerDashboard />}
            />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={['admin']} />}
          >
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

          <Route
            path="/unauthorised"
            element={<Unauthorised />}
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
