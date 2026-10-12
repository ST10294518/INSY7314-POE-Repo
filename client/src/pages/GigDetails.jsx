
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingApi, gigApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number(price) || 0)

export default function GigDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user, logout } = useAuth()

  const [gig, setGig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [booking, setBooking] = useState(false)

  // Keep the same key if an operation needs to be retried.
  const bookingKey = useRef(null)
  const bookingInProgress = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadGig() {
      setLoading(true)
      setError('')
      setGig(null)

      try {
        const response = await gigApi.getById(id)

        if (!cancelled) {
          setGig(response.gig)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this Gig.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadGig()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleBooking() {
    if (!gig || !token || bookingInProgress.current) {
      return
    }

    bookingInProgress.current = true
    setBooking(true)
    setBookingError('')

    if (!bookingKey.current) {
      bookingKey.current = crypto.randomUUID()
    }

    try {
      const response = await bookingApi.create(
        gig._id,
        token,
        bookingKey.current
      )

      if (!response.booking?._id) {
        throw new Error('The Booking response was incomplete.')
      }

      // A new booking action must use a different key.
      bookingKey.current = null

      navigate(
        `/client/bookings/${response.booking._id}/confirmation`,
        {
          replace: true,
          state: {
            booking: response.booking,
            transaction: response.transaction,
          },
        }
      )
    } catch (err) {
      if (err.status === 401) {
        setBookingError(
          'Your session has expired. Please log in again.'
        )
      } else if (err.status === 403) {
        setBookingError(
          'Only Client accounts can book a Gig.'
        )
      } else {
        setBookingError(
          err.message ||
            'The booking could not be confirmed. Retry using the same request.'
        )
      }

      // Keep the key on all failures. The server might have
      // committed the booking before the response was lost.
    } finally {
      bookingInProgress.current = false
      setBooking(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link className="brand brand-dark" to="/client">
          HustleHub<span>+</span>
        </Link>

        <nav className="dashboard-actions">
          <Link to="/client">Explore Gigs</Link>
          <Link to="/client/bookings">My Bookings</Link>
          <button
            type="button"
            className="outline-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </nav>
      </header>

      <div className="dashboard-content">
        <Link to="/client" className="back-link">
          ← Back to Gigs
        </Link>

        {loading && <p role="status">Loading Gig details...</p>}

        {!loading && error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && !gig && (
          <div className="empty-state">
            <h2>Gig unavailable</h2>
            <p>This Gig could not be found.</p>
          </div>
        )}

        {!loading && !error && gig && (
          <div className="gig-details-layout">
            <section className="gig-details-main">
              <span className="gig-category">
                {gig.category || 'General'}
              </span>

              <h1>{gig.title}</h1>

              <p className="gig-freelancer">
                Offered by:{' '}
                {gig.freelancer?.email || 'Freelancer unavailable'}
              </p>

              <h2>About this service</h2>
              <p className="gig-full-description">
                {gig.description}
              </p>
            </section>

            <aside className="booking-panel">
              <span className="eyebrow">SERVICE PRICE</span>
              <div className="booking-price">
                {formatPrice(gig.price)}
              </div>

              <p>
                Complete your booking using our simulated
                payment system.
              </p>

              <div className="payment-info">
                <strong>Payment method</strong>
                <span>Simulated payment — no real charge</span>
              </div>

              {bookingError && (
                <div className="form-error" role="alert">
                  {bookingError}
                </div>
              )}

              <button
                type="button"
                className="primary-button booking-button"
                disabled={booking || user?.role !== 'client'}
                onClick={handleBooking}
              >
                {booking ? 'Processing booking...' : 'Book Gig'}
              </button>

              <p className="booking-note">
                A successful simulated payment creates a
                confirmed Booking and Transaction.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
