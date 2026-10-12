import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getOwnGigs } from '../services/freelancerApi'
import CreateGigForm from '../components/CreateGigForm'
import EditGigForm from '../components/EditGigForm'
import DeleteGigConfirmation from '../components/DeleteGigConfirmation'
import ReceivedBookings from '../components/ReceivedBookings'
import FreelancerIncome from '../components/FreelancerIncome'
import '../styles/freelancer.css'

export default function FreelancerDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const [editingGigId, setEditingGigId] = useState(null)
  const [gigSuccess, setGigSuccess] = useState('')
  const [state, setState] = useState({
    loading: true,
    gigs: [],
    error: '',
    status: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadGigs() {
      try {
        const result = await getOwnGigs(token, controller.signal)

        if (!Array.isArray(result.gigs)) {
          throw new Error('Unable to read your gigs. Please try again.')
        }

        if (active) {
          setState({
            loading: false,
            gigs: result.gigs,
            error: '',
            status: null,
          })
        }
      } catch (err) {
        if (active && err.name !== 'AbortError') {
          setState({
            loading: false,
            gigs: [],
            error: err.status === 401
              ? 'Your session has expired. Please sign in again.'
              : err.message || 'Unable to load your gigs.',
            status: err.status,
          })
        }
      }
    }

    loadGigs()

    return () => {
      active = false
      controller.abort()
    }
  }, [token, reload])

  function refreshGigs() {
    setState({
      loading: true,
      gigs: [],
      error: '',
      status: null,
    })
    setReload((value) => value + 1)
  }

  function handleGigSaved() {
    setEditingGigId(null)
    setGigSuccess('Your gig was updated successfully.')
    refreshGigs()
  }

  function handleGigDeleted() {
    setEditingGigId(null)
    setGigSuccess('Your gig was deleted successfully.')
    refreshGigs()
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="freelancer-page">
      <header className="freelancer-header">
        <Link className="freelancer-brand" to="/freelancer">
          HustleHub<span>+</span>
        </Link>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <section className="freelancer-account" aria-labelledby="account-heading">
        <p className="freelancer-eyebrow">FREELANCER DASHBOARD</p>
        <h1 id="account-heading">Your workspace</h1>
        <p>Manage the services you offer through HustleHub+.</p>
        <dl>
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Account role</dt>
            <dd>Freelancer</dd>
          </div>
        </dl>
      </section>

      {gigSuccess && <p role="status">{gigSuccess}</p>}

      <CreateGigForm token={token} onCreated={refreshGigs} />

      <section aria-labelledby="own-gigs-heading" aria-busy={state.loading}>
        <div className="freelancer-section-heading">
          <h2 id="own-gigs-heading">My gigs</h2>
          <button
            type="button"
            onClick={refreshGigs}
            disabled={state.loading}
          >
            Refresh gigs
          </button>
        </div>

        {state.loading && <p role="status">Loading your gigs...</p>}

        {state.error && (
          <div className="freelancer-error" role="alert">
            <p>{state.error}</p>
            {state.status === 401 && <Link to="/login">Sign in again</Link>}
          </div>
        )}

        {!state.loading && !state.error && state.gigs.length === 0 && (
          <div className="freelancer-empty">
            <h3>No gigs yet</h3>
            <p>Your published services will appear here.</p>
          </div>
        )}

        {!state.loading && !state.error && state.gigs.length > 0 && (
          <ul className="freelancer-gig-list">
            {state.gigs.map((gig) => (
              <li key={gig._id} className="freelancer-gig-card">
                <h3>{gig.title}</h3>
                <p className="freelancer-description">{gig.description}</p>
                <dl>
                  <div>
                    <dt>Price</dt>
                    <dd>{Number(gig.price).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{gig.category || 'Uncategorised'}</dd>
                  </div>
                </dl>
                {editingGigId === gig._id ? (
                  <EditGigForm
                    key={gig._id}
                    gig={gig}
                    token={token}
                    onSaved={handleGigSaved}
                    onCancel={() => setEditingGigId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGigSuccess('')
                      setEditingGigId(gig._id)
                    }}
                  >
                    Edit gig
                  </button>
                )}
                {editingGigId !== gig._id && (
                  <div className="freelancer-delete-controls">
                    <DeleteGigConfirmation
                      gig={gig}
                      token={token}
                      onDeleted={handleGigDeleted}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <ReceivedBookings token={token} />
      <FreelancerIncome token={token} />
    </main>
  )
}
