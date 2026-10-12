import { useEffect, useState } from 'react'
import { getReceivedBookings } from '../services/freelancerApi'

function formatPrice(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Amount unavailable'
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value)
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-ZA')
}

export default function ReceivedBookings({ token }) {
  const [reload, setReload] = useState(0)
  const [state, setState] = useState({
    loading: true,
    bookings: [],
    error: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadBookings() {
      try {
        const result = await getReceivedBookings(token, controller.signal)

        if (!Array.isArray(result.bookings)) {
          throw new Error('Unable to read your bookings. Please try again.')
        }

        if (active) {
          setState({
            loading: false,
            bookings: result.bookings,
            error: '',
          })
        }
      } catch (err) {
        if (active && err.name !== 'AbortError') {
          setState({
            loading: false,
            bookings: [],
            error: err.status === 401
              ? 'Your session has expired. Please sign in again.'
              : err.message || 'Unable to load your bookings.',
          })
        }
      }
    }

    loadBookings()

    return () => {
      active = false
      controller.abort()
    }
  }, [token, reload])

  function refreshBookings() {
    setState({ loading: true, bookings: [], error: '' })
    setReload((value) => value + 1)
  }

  return (
    <section
      className="freelancer-bookings"
      aria-labelledby="received-bookings-heading"
      aria-busy={state.loading}
    >
      <div className="freelancer-section-heading">
        <h2 id="received-bookings-heading">Received bookings</h2>
        <button
          type="button"
          onClick={refreshBookings}
          disabled={state.loading}
        >
          Refresh bookings
        </button>
      </div>

      {state.loading && <p role="status">Loading received bookings...</p>}

      {state.error && (
        <p className="freelancer-error" role="alert">{state.error}</p>
      )}

      {!state.loading && !state.error && state.bookings.length === 0 && (
        <div className="freelancer-empty">
          <h3>No bookings yet</h3>
          <p>Bookings for your services will appear here.</p>
        </div>
      )}

      {!state.loading && !state.error && state.bookings.length > 0 && (
        <ul className="freelancer-gig-list">
          {state.bookings.map((booking) => (
            <li key={booking._id} className="freelancer-gig-card">
              <h3>{booking.gig?.title || 'Gig no longer available'}</h3>
              <dl>
                <div>
                  <dt>Booking reference</dt>
                  <dd>{booking._id}</dd>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>{booking.client?.email || 'Client unavailable'}</dd>
                </div>
                <div>
                  <dt>Booked price</dt>
                  <dd>{formatPrice(booking.price)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{booking.status || 'Status unavailable'}</dd>
                </div>
                <div>
                  <dt>Booked on</dt>
                  <dd>{formatDate(booking.bookingDate || booking.createdAt)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
