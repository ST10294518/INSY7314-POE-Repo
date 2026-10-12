
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bookingApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number(amount) || 0)

export default function BookingDetails() {
  const { id } = useParams()
  const { token } = useAuth()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadBooking() {
      setLoading(true)
      setError('')

      try {
        const response = await bookingApi.getById(id, token)
        if (!cancelled) setBooking(response.booking)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load Booking.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBooking()

    return () => {
      cancelled = true
    }
  }, [id, token])

  return (
    <main className="dashboard-content">
      <Link to="/client/bookings" className="back-link">
        ← Back to My Bookings
      </Link>

      {loading && <p role="status">Loading Booking details...</p>}

      {!loading && (error || !booking) && (
        <div className="form-error" role="alert">
          {error || 'Booking not found.'}
        </div>
      )}

      {!loading && !error && booking && (
        <section className="booking-details-card">
          <span className="eyebrow">BOOKING DETAILS</span>
          <h1>{booking.gig?.title || 'Booked service'}</h1>

          <div className="confirmation-summary">
            <div>
              <span>Booking reference</span>
              <strong>{booking._id}</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{booking.gig?.category || 'General'}</strong>
            </div>
            <div>
              <span>Booking date</span>
              <strong>
                {new Date(
                  booking.bookingDate || booking.createdAt
                ).toLocaleString('en-ZA')}
              </strong>
            </div>
            <div>
              <span>Booking status</span>
              <strong>{booking.status}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>{formatPrice(booking.price)}</strong>
            </div>
            <div>
              <span>Payment method</span>
              <strong>Simulated payment</strong>
            </div>
          </div>

          <p className="booking-note">
            This is a simulated payment. No real charge was made.
          </p>

          <Link to="/client" className="primary-button">
            Browse More Gigs
          </Link>
        </section>
      )}
    </main>
  )
}
