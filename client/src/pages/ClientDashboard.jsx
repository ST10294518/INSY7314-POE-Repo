
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gigApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number(price) || 0)

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadGigs() {
      setLoading(true)
      setError('')

      try {
        const response = await gigApi.getAll()

        if (!cancelled) {
          setGigs(
            Array.isArray(response.gigs)
              ? response.gigs
              : []
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load available Gigs.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadGigs()

    return () => {
      cancelled = true
    }
  }, [reloadCount])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      gigs
        .map((gig) => gig.category)
        .filter(Boolean)
    )

    return [
      'all',
      ...Array.from(uniqueCategories).sort(),
    ]
  }, [gigs])

  const filteredGigs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return gigs.filter((gig) => {
      const matchesCategory =
        category === 'all' ||
        gig.category === category

      const searchableText = [
        gig.title,
        gig.description,
        gig.category,
        gig.freelancer?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesCategory && matchesSearch
    })
  }, [gigs, search, category])

  const clearFilters = useCallback(() => {
    setSearch('')
    setCategory('all')
  }, [])

  function refreshGigs() {
    setReloadCount((previous) => previous + 1)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link
          className="brand brand-dark"
          to="/client"
        >
          HustleHub<span>+</span>
        </Link>

        <nav
          className="dashboard-actions"
          aria-label="Client navigation"
        >
          <Link to="/client">
            Explore Gigs
          </Link>

          <Link to="/client/bookings">
            My Bookings
          </Link>

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
        <span className="eyebrow">
          CLIENT DASHBOARD
        </span>

        <h1>
          Find the right freelancer for your next project.
        </h1>

        <p>
          Welcome back, {user?.email || 'Client'}.
          Browse available services, discover skilled
          freelancers and book securely using our
          simulated payment system.
        </p>

        <section
          className="gig-section"
          aria-labelledby="gig-heading"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                EXPLORE SERVICES
              </span>

              <h2 id="gig-heading">
                Available Gigs
              </h2>
            </div>

            {!loading && !error && (
              <span>
                {filteredGigs.length}{' '}
                {filteredGigs.length === 1
                  ? 'result'
                  : 'results'}
              </span>
            )}
          </div>

          <div className="gig-filters">
            <label className="filter-field">
              <span>Search services</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search Gigs, categories or freelancers"
                aria-label="Search available Gigs"
              />
            </label>

            <label className="filter-field">
              <span>Category</span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                aria-label="Filter Gigs by category"
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === 'all'
                      ? 'All categories'
                      : item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(search || category !== 'all') && (
            <button
              type="button"
              className="outline-button"
              onClick={clearFilters}
              style={{ marginBottom: '24px' }}
            >
              Clear Filters
            </button>
          )}

          {loading && (
            <div
              className="empty-state"
              role="status"
            >
              <h3>Loading available Gigs...</h3>
              <p>
                Please wait while we retrieve
                available freelancer services.
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              className="form-error"
              role="alert"
            >
              <p>{error}</p>

              <button
                type="button"
                className="outline-button"
                onClick={refreshGigs}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredGigs.length === 0 && (
              <div className="empty-state">
                <h3>
                  {gigs.length === 0
                    ? 'No Gigs available yet'
                    : 'No matching Gigs found'}
                </h3>

                <p>
                  {gigs.length === 0
                    ? 'Freelancers have not published any services yet. Please check back later.'
                    : 'Try another search term or select a different category.'}
                </p>

                {gigs.length > 0 && (
                  <button
                    type="button"
                    className="outline-button"
                    onClick={clearFilters}
                  >
                    Show All Gigs
                  </button>
                )}
              </div>
            )}

          {!loading &&
            !error &&
            filteredGigs.length > 0 && (
              <div className="gig-grid">
                {filteredGigs.map((gig) => (
                  <article
                    className="gig-card"
                    key={gig._id}
                  >
                    <span className="gig-category">
                      {gig.category || 'General'}
                    </span>

                    <h3>{gig.title}</h3>

                    <p className="gig-description">
                      {gig.description}
                    </p>

                    <p className="gig-freelancer">
                      Freelancer:{' '}
                      {gig.freelancer?.email ||
                        'Unavailable'}
                    </p>

                    <div className="gig-card-footer">
                      <strong>
                        {formatPrice(gig.price)}
                      </strong>

                      <Link
                        className="primary-button gig-link"
                        to={`/client/gigs/${gig._id}`}
                        aria-label={`View details for ${gig.title}`}
                      >
                        View Gig
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </div>
    </main>
  )
}
