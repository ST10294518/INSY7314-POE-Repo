import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FreelancerDashboard from '../pages/FreelancerDashboard'
import { useAuth } from '../hooks/useAuth'
import { getOwnGigs } from '../services/freelancerApi'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/freelancerApi', () => ({
  getOwnGigs: vi.fn(),
}))

vi.mock('../components/CreateGigForm', () => ({ default: () => null }))
vi.mock('../components/EditGigForm', () => ({ default: () => null }))
vi.mock('../components/DeleteGigConfirmation', () => ({ default: () => null }))
vi.mock('../components/ReceivedBookings', () => ({ default: () => null }))
vi.mock('../components/FreelancerIncome', () => ({ default: () => null }))

const testGig = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Website Development',
  description: 'I will build a responsive website.',
  price: 1500.50,
  category: 'Web Development',
}

let logout

function setup() {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/freelancer']}>
      <Routes>
        <Route path="/freelancer" element={<FreelancerDashboard />} />
        <Route path="/login" element={<h1>Login page</h1>} />
      </Routes>
    </MemoryRouter>
  )

  return user
}

beforeEach(() => {
  logout = vi.fn()
  vi.mocked(getOwnGigs).mockReset()
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: '507f1f77bcf86cd799439010',
      email: 'freelancer@example.com',
      role: 'freelancer',
    },
    token: 'test-token',
    logout,
  })
})

describe('Freelancer dashboard', () => {
  it('renders account information and the own-Gig response', async () => {
    vi.mocked(getOwnGigs).mockResolvedValue({ gigs: [testGig] })
    setup()

    expect(screen.getByText('freelancer@example.com')).toBeInTheDocument()
    expect(screen.getByText('Freelancer')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your gigs...')

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.getByText(testGig.description)).toBeInTheDocument()
    expect(screen.getByText('1500.50')).toBeInTheDocument()
    expect(screen.getByText('Web Development')).toBeInTheDocument()
    expect(getOwnGigs).toHaveBeenCalledWith(
      'test-token',
      expect.any(AbortSignal)
    )
  })

  it('shows the empty state when the account has no gigs', async () => {
    vi.mocked(getOwnGigs).mockResolvedValue({ gigs: [] })
    setup()

    expect(await screen.findByRole('heading', {
      name: 'No gigs yet',
    })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows an API error and reloads gigs after refresh', async () => {
    vi.mocked(getOwnGigs)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({ gigs: [testGig] })

    const user = setup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(screen.queryByText('No gigs yet')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh gigs' }))

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getOwnGigs).toHaveBeenCalledTimes(2)
  })

  it('logs out and navigates to the Login route', async () => {
    vi.mocked(getOwnGigs).mockResolvedValue({ gigs: [] })
    const user = setup()

    await screen.findByRole('heading', { name: 'No gigs yet' })
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('heading', {
      name: 'Login page',
    })).toBeInTheDocument()
    expect(screen.queryByRole('heading', {
      name: 'Your workspace',
    })).not.toBeInTheDocument()
  })
})
