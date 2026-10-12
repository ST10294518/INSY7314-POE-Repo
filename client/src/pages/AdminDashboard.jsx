
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { adminApi } from '../services/adminApi'
import '../styles/admin.css'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'transactions', label: 'Transactions' },
]

const formatMoney = (value) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-ZA')
}

const showId = (value) =>
  value?._id || value?.id || value || 'Unavailable'

const showEmail = (value) =>
  value?.email || 'Unavailable'

const columns = {
  users: [
    { label: 'Email', render: (x) => x.email },
    { label: 'Role', render: (x) => x.role },
    { label: 'Joined', render: (x) => formatDate(x.createdAt) },
  ],
  gigs: [
    { label: 'Gig', render: (x) => x.title },
    { label: 'Category', render: (x) => x.category || 'General' },
    { label: 'Freelancer', render: (x) => showEmail(x.freelancer) },
    { label: 'Price', render: (x) => formatMoney(x.price) },
  ],
  bookings: [
    { label: 'Booking ID', render: (x) => String(x._id) },
    { label: 'Gig', render: (x) => x.gig?.title || 'Unavailable' },
    { label: 'Client', render: (x) => showEmail(x.client) },
    { label: 'Freelancer', render: (x) => showEmail(x.freelancer) },
    { label: 'Amount', render: (x) => formatMoney(x.price) },
    { label: 'Status', render: (x) => x.status },
  ],
  transactions: [
    { label: 'Transaction ID', render: (x) => String(x._id) },
    { label: 'Booking ID', render: (x) => showId(x.booking) },
    { label: 'Freelancer', render: (x) => showEmail(x.freelancer) },
    { label: 'Amount', render: (x) => formatMoney(x.amount) },
    { label: 'Status', render: (x) => x.status },
  ],
}

function Overview({ data }) {
  if (!data) {
    return <p>No overview data is available.</p>
  }

  const stats = [
    ['Total users', data.totalUsers],
    ['Clients', data.totalClients],
    ['Freelancers', data.totalFreelancers],
    ['Total Gigs', data.totalGigs],
    ['Total Bookings', data.totalBookings],
    ['Confirmed Bookings', data.confirmedBookings],
    ['Completed Transactions', data.completedTransactions],
    [
      'Simulated revenue',
      formatMoney(data.totalSimulatedRevenue),
    ],
  ]

  return (
    <div className="admin-stat-grid">
      {stats.map(([label, value]) => (
        <article className="admin-stat-card" key={label}>
          <span>{label}</span>
          <strong>{value ?? 0}</strong>
        </article>
      ))}
    </div>
  )
}

function RecordsTable({ section, records }) {
  const fields = columns[section] || []

  if (!records.length) {
    return (
      <div className="admin-empty">
        <h3>No records found</h3>
        <p>There are currently no records in this section.</p>
      </div>
    )
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.label} scope="col">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record._id}>
              {fields.map((field) => (
                <td key={field.label}>
                  {field.render(record)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { token, user, logout } = useAuth()

  const [section, setSection] = useState('overview')
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSection() {
      setLoading(true)
      setError('')
      setData(null)

      try {
        const response = section === 'overview'
          ? await adminApi.overview(token)
          : await adminApi[section](token, page)

        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load Admin information.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSection()

    return () => {
      cancelled = true
    }
  }, [token, section, page, refresh])

  function selectSection(nextSection) {
    setSection(nextSection)
    setPage(1)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const records =
    section === 'overview' ? [] : data?.[section] || []

  const pagination = data?.pagination
  const lastPage = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          HustleHub<span>+</span>
        </div>

        <p className="admin-sidebar-caption">
          ADMINISTRATION
        </p>

        <nav className="admin-navigation" aria-label="Admin sections">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                section === item.id
                  ? 'admin-nav-item active'
                  : 'admin-nav-item'
              }
              aria-current={
                section === item.id ? 'page' : undefined
              }
              onClick={() => selectSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="admin-logout"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">
              HUSTLEHUB+ MANAGEMENT
            </span>
            <h1>Admin Dashboard</h1>
            <p>Monitor marketplace activity and records.</p>
          </div>

          <div className="admin-account">
            <span className="admin-avatar">A</span>
            <div>
              <strong>Administrator</strong>
              <small>{user?.email}</small>
            </div>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2>
                {SECTIONS.find((x) => x.id === section)?.label}
              </h2>
              <p>
                {section === 'overview'
                  ? 'System activity at a glance.'
                  : 'Read-only records from MongoDB.'}
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              disabled={loading}
              onClick={() => setRefresh((value) => value + 1)}
            >
              {loading ? 'Loading...' : 'Refresh data'}
            </button>
          </div>

          {loading && (
            <p role="status" className="admin-state">
              Loading Admin information...
            </p>
          )}

          {!loading && error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && section === 'overview' && (
            <Overview data={data?.overview} />
          )}

          {!loading && !error && section !== 'overview' && (
            <>
              <RecordsTable
                section={section}
                records={records}
              />

              {pagination && (
                <div className="admin-pagination">
                  <span>
                    Page {page} of {lastPage} · {pagination.total} records
                  </span>

                  <div>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={page >= lastPage}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="admin-footer">
          HustleHub+ Admin · Records are read-only ·
          Revenue represents simulated payments
        </footer>
      </div>
    </main>
  )
}
