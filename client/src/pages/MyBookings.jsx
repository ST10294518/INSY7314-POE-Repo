
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number(amount) || 0)

export default function MyBookings() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadBookings() {
      setLoading(true)
      setError('')

      try {
        const response = await bookingApi.getMine(token)

        if (!cancelled) {
          setBookings(
            Array.isArray(response.bookings)
              ? response.bookings
              : []
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load Bookings.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBookings()

    return () => {
      cancelled = true
    }
  }, [token, reloadCount])

  return (
    <main className="dashboard-content">
      <Link to="/client" className="back-link">
        ← Back to Dashboard
      </Link>

      <span className="eyebrow">CLIENT BOOKINGS</span>
      <h1>My Bookings</h1>
      <p>View services you've booked and their current status.</p>

      {loading && <p role="status">Loading Bookings...</p>}

      {!loading && error && (
        <div className="form-error" role="alert">
          <p>{error}</p>
          <button
            className="outline-button"
            type="button"
            onClick={() => setReloadCount((n) => n + 1)}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <h2>No Bookings yet</h2>
          <p>Your booked services will appear here.</p>
          <Link to="/client" className="primary-button">
            Explore Gigs
          </Link>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="booking-list">
          {bookings.map((booking) => (
            <article className="booking-item" key={booking._id}>
              <div>
                <span className="gig-category">
                  {booking.gig?.category || 'General'}
                </span>
                <h2>{booking.gig?.title || 'Gig unavailable'}</h2>
                <p>
                  Booked:{' '}
                  {new Date(
                    booking.bookingDate || booking.createdAt
                  ).toLocaleDateString('en-ZA')}
                </p>
                <p>
                  Status: <strong>{booking.status}</strong>
                </p>
              </div>

              <div className="booking-item-actions">
                <strong>{formatPrice(booking.price)}</strong>
                <Link
                  className="primary-button"
                  to={`/client/bookings/${booking._id}`}
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
