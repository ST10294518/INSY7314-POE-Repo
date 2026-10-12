
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function dashboardFor(role) {
  if (role === 'client') return '/client'
  if (role === 'freelancer') return '/freelancer'
  if (role === 'admin') return '/admin'
  return '/unauthorised'
}

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, sessionExpired } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      const user = await login(
        email.trim().toLowerCase(),
        password
      )

      navigate(dashboardFor(user.role), {
        replace: true,
      })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <Link className="brand" to="/">
          HustleHub<span>+</span>
        </Link>

        <div>
          <span className="eyebrow">
            FREELANCE MARKETPLACE
          </span>

          <h1>
            Great work starts with the right connection.
          </h1>

          <p>
            Discover skilled freelancers, find opportunities
            and manage projects in one secure platform.
          </p>
        </div>

        <span className="intro-footer">
          Create. Connect. Collaborate.
        </span>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>

          <p className="subtext">
            Enter your credentials to continue to HustleHub+.
          </p>

          {sessionExpired && (
            <div className="form-error" role="alert">
              Your session has expired or is no longer valid.
              Please sign in again.
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
            />

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
