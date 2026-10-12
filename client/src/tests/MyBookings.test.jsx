import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyBookings from '../pages/MyBookings'
import { bookingApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

vi.mock('../services/api', () => ({
  bookingApi: { getMine: vi.fn() },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const booking = {
  _id: '222222222222222222222222',
  gig: {
    _id: '111111111111111111111111',
    title: 'Website Development',
    category: 'Development',
  },
  price: 125.50,
  status: 'confirmed',
  bookingDate: '2026-10-12T10:00:00.000Z',
}

function renderBookings() {
  return render(
    <MemoryRouter>
      <MyBookings />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({ token: 'mock-client-token' })
  bookingApi.getMine.mockResolvedValue({ bookings: [booking] })
})

describe('Client Booking history', () => {
  it('renders saved Booking details and the correct details link', async () => {
    renderBookings()

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()

    expect(bookingApi.getMine)
      .toHaveBeenCalledWith('mock-client-token')
    expect(screen.getByText('confirmed')).toBeInTheDocument()

    const price = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(booking.price).replace(/\s+/g, ' ').trim()

    expect(screen.getByText(price)).toBeInTheDocument()

    const date = new Date(booking.bookingDate)
      .toLocaleDateString('en-ZA')

    expect(screen.getByText(`Booked: ${date}`))
      .toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'View Details' }))
      .toHaveAttribute('href', `/client/bookings/${booking._id}`)
  })

  it('shows an empty history with a link to browse Gigs', async () => {
    bookingApi.getMine.mockResolvedValue({ bookings: [] })
    renderBookings()

    expect(await screen.findByRole('heading', {
      name: 'No Bookings yet',
    })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Explore Gigs' }))
      .toHaveAttribute('href', '/client')
    expect(screen.queryByRole('link', { name: 'View Details' }))
      .not.toBeInTheDocument()
  })

  it('shows a request error and recovers when retried', async () => {
    const user = userEvent.setup()

    bookingApi.getMine
      .mockRejectedValueOnce(new Error('Bookings temporarily unavailable.'))
      .mockResolvedValueOnce({ bookings: [booking] })

    renderBookings()

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Bookings temporarily unavailable.')
    expect(screen.queryByRole('heading', { name: 'No Bookings yet' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(bookingApi.getMine).toHaveBeenCalledTimes(2)
  })

  it('retains Booking status, price and link when the Gig is unavailable', async () => {
    bookingApi.getMine.mockResolvedValue({
      bookings: [{ ...booking, gig: null }],
    })

    renderBookings()

    expect(await screen.findByRole('heading', {
      name: 'Gig unavailable',
    })).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()

    const price = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(booking.price).replace(/\s+/g, ' ').trim()

    expect(screen.getByText(price)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Details' }))
      .toHaveAttribute('href', `/client/bookings/${booking._id}`)
  })
})
