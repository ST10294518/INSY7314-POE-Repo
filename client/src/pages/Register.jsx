
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please complete all required fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!['client', 'freelancer'].includes(role)) {
      setError('Please select a valid account type.')
      return
    }

    try {
      const user = await register(email.trim().toLowerCase(), password, role)

      navigate(
        user.role === 'freelancer' ? '/freelancer' : '/client',
        { replace: true }
      )
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <Link className="brand" to="/">HustleHub<span>+</span></Link>
        <div>
          <span className="eyebrow">START YOUR JOURNEY</span>
          <h1>Find talent. Offer skills. Build something better.</h1>
          <p>
            Join our marketplace as a Client looking for services
            or a Freelancer offering professional skills.
          </p>
        </div>
        <span className="intro-footer">Your next opportunity begins here.</span>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">JOIN HUSTLEHUB+</span>
          <h2>Create your account</h2>
          <p className="subtext">Choose your role and enter your details.</p>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="register-role">Account type</label>
            <select
              id="register-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="client">Client — Hire freelancers</option>
              <option value="freelancer">Freelancer — Offer services</option>
            </select>

            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
