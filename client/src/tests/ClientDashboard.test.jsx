import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClientDashboard from '../pages/ClientDashboard'
import { gigApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

vi.mock('../services/api', () => ({
  gigApi: { getAll: vi.fn() },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const logout = vi.fn()

const gigs = [
  {
    _id: '111111111111111111111111',
    title: 'Website Development',
    description: 'Build a responsive business website.',
    price: 125.50,
    category: 'Development',
    freelancer: { email: 'developer@example.com' },
  },
  {
    _id: '222222222222222222222222',
    title: 'Logo Design',
    description: 'Create a logo for your business.',
    price: 250,
    category: 'Design',
    freelancer: { email: 'designer@example.com' },
  },
]

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/client']}>
      <Routes>
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/login" element={<h1>Login destination</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({
    user: { email: 'client@example.com', role: 'client' },
    logout,
  })
  gigApi.getAll.mockResolvedValue({ gigs })
})

describe('Client dashboard', () => {
  it('renders account details, available Gigs and correct detail links', async () => {
    renderDashboard()

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()

    expect(screen.getByText(/Welcome back, client@example.com/))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Logo Design' }))
      .toBeInTheDocument()
    expect(screen.getByText(/Freelancer: developer@example.com/))
      .toBeInTheDocument()

    const price = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(125.50)

    expect(screen.getByText(price.replace(/\s+/g, ' ').trim())).toBeInTheDocument()
    expect(screen.getByRole('link', {
      name: 'View details for Website Development',
    })).toHaveAttribute('href', '/client/gigs/111111111111111111111111')
  })

  it('filters by search and category and restores results when cleared', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByRole('heading', { name: 'Website Development' })

    await user.type(
      screen.getByRole('searchbox', { name: 'Search available Gigs' }),
      'website'
    )

    expect(screen.queryByRole('heading', { name: 'Logo Design' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter Gigs by category' }),
      'Design'
    )

    expect(screen.getByRole('heading', { name: 'Logo Design' }))
      .toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Website Development' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(screen.getByRole('heading', { name: 'Website Development' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Logo Design' }))
      .toBeInTheDocument()
  })

  it('shows the empty state when no Gigs are available', async () => {
    gigApi.getAll.mockResolvedValue({ gigs: [] })
    renderDashboard()

    expect(await screen.findByRole('heading', {
      name: 'No Gigs available yet',
    })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /View details for/ }))
      .not.toBeInTheDocument()
  })

  it('shows an API error and recovers when Try Again is clicked', async () => {
    const user = userEvent.setup()
    gigApi.getAll
      .mockRejectedValueOnce(new Error('Service temporarily unavailable.'))
      .mockResolvedValueOnce({ gigs })

    renderDashboard()

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Service temporarily unavailable.')

    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(gigApi.getAll).toHaveBeenCalledTimes(2)
  })

  it('logs out and navigates to Login', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByRole('heading', { name: 'Website Development' })

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(logout).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login destination' }))
        .toBeInTheDocument()
    })
  })
})
