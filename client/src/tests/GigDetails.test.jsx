import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import GigDetails from '../pages/GigDetails'
import { bookingApi, gigApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

vi.mock('../services/api', () => ({
  gigApi: { getById: vi.fn() },
  bookingApi: { create: vi.fn() },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const gig = {
  _id: '111111111111111111111111',
  title: 'Website Development',
  description: 'Build a responsive business website.',
  price: 125.50,
  category: 'Development',
  freelancer: { email: 'developer@example.com' },
}

const bookingResult = {
  booking: { _id: '222222222222222222222222' },
  transaction: { _id: '333333333333333333333333' },
}

function ConfirmationDestination() {
  const location = useLocation()

  return (
    <div>
      <h1>Booking confirmation destination</h1>
      <p>{location.pathname}</p>
      <p>Booking: {location.state?.booking?._id}</p>
      <p>Transaction: {location.state?.transaction?._id}</p>
    </div>
  )
}

function renderDetails() {
  return render(
    <MemoryRouter initialEntries={[`/client/gigs/${gig._id}`]}>
      <Routes>
        <Route path="/client/gigs/:id" element={<GigDetails />} />
        <Route
          path="/client/bookings/:id/confirmation"
          element={<ConfirmationDestination />}
        />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.resetAllMocks()

  useAuth.mockReturnValue({
    token: 'mock-client-token',
    user: { role: 'client' },
    logout: vi.fn(),
  })

  gigApi.getById.mockResolvedValue({ gig })
  bookingApi.create.mockResolvedValue(bookingResult)
})

describe('Client Gig details and booking', () => {
  it('renders the selected Gig and its saved price', async () => {
    renderDetails()

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()

    expect(gigApi.getById).toHaveBeenCalledWith(gig._id)
    expect(screen.getByText(gig.description)).toBeInTheDocument()
    expect(screen.getByText(/Offered by: developer@example.com/))
      .toBeInTheDocument()

    const price = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(gig.price).replace(/\s+/g, ' ').trim()

    expect(screen.getByText(price)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Book Gig' }))
      .toBeEnabled()
  })

  it('submits the Gig ID, token and request key then opens confirmation', async () => {
    const user = userEvent.setup()
    renderDetails()

    await user.click(await screen.findByRole('button', {
      name: 'Book Gig',
    }))

    expect(bookingApi.create).toHaveBeenCalledTimes(1)
    expect(bookingApi.create).toHaveBeenCalledWith(
      gig._id,
      'mock-client-token',
      expect.stringMatching(/^[A-Za-z0-9_-]{16,128}$/)
    )

    expect(await screen.findByRole('heading', {
      name: 'Booking confirmation destination',
    })).toBeInTheDocument()

    expect(screen.getByText(
      `/client/bookings/${bookingResult.booking._id}/confirmation`
    )).toBeInTheDocument()

    expect(screen.getByText(
      `Booking: ${bookingResult.booking._id}`
    )).toBeInTheDocument()

    expect(screen.getByText(
      `Transaction: ${bookingResult.transaction._id}`
    )).toBeInTheDocument()
  })

  it('preserves the same request key after a failed booking and retry', async () => {
    const user = userEvent.setup()

    bookingApi.create
      .mockRejectedValueOnce(new Error('Response lost. Please retry.'))
      .mockResolvedValueOnce(bookingResult)

    renderDetails()

    await user.click(await screen.findByRole('button', {
      name: 'Book Gig',
    }))

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Response lost. Please retry.')

    const firstCall = bookingApi.create.mock.calls[0]

    expect(firstCall[2]).toMatch(/^[A-Za-z0-9_-]{16,128}$/)

    await user.click(screen.getByRole('button', { name: 'Book Gig' }))

    await screen.findByRole('heading', {
      name: 'Booking confirmation destination',
    })

    expect(bookingApi.create).toHaveBeenCalledTimes(2)
    expect(bookingApi.create.mock.calls[1]).toEqual(firstCall)
  })

  it('disables booking while pending and prevents another submission', async () => {
    const user = userEvent.setup()
    let resolveBooking

    bookingApi.create.mockReturnValue(new Promise((resolve) => {
      resolveBooking = resolve
    }))

    renderDetails()

    await user.click(await screen.findByRole('button', {
      name: 'Book Gig',
    }))

    const pendingButton = screen.getByRole('button', {
      name: 'Processing booking...',
    })

    expect(pendingButton).toBeDisabled()
    await user.click(pendingButton)
    expect(bookingApi.create).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveBooking(bookingResult)
    })

    expect(await screen.findByRole('heading', {
      name: 'Booking confirmation destination',
    })).toBeInTheDocument()
  })

  it('shows a Gig loading error without allowing a booking', async () => {
    gigApi.getById.mockRejectedValue(new Error('Gig not found.'))
    renderDetails()

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Gig not found.')

    expect(screen.queryByRole('button', { name: 'Book Gig' }))
      .not.toBeInTheDocument()
    expect(bookingApi.create).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'Your session has expired. Please log in again.'],
    [403, 'Only Client accounts can book a Gig.'],
  ])('shows the appropriate message for HTTP %s', async (status, message) => {
    const user = userEvent.setup()
    bookingApi.create.mockRejectedValue(
      Object.assign(new Error('Request rejected.'), { status })
    )

    renderDetails()

    await user.click(await screen.findByRole('button', {
      name: 'Book Gig',
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('heading', {
      name: 'Booking confirmation destination',
    })).not.toBeInTheDocument()
  })
})
