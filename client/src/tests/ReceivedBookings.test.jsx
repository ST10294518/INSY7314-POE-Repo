import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReceivedBookings from '../components/ReceivedBookings'
import { getReceivedBookings } from '../services/freelancerApi'

vi.mock('../services/freelancerApi', () => ({
  getReceivedBookings: vi.fn(),
}))

const testBooking = {
  _id: '507f1f77bcf86cd799439011',
  gig: { title: 'Website Development' },
  client: { email: 'client@example.com' },
  price: 1500.50,
  status: 'confirmed',
  bookingDate: '2026-10-12T08:00:00.000Z',
}

beforeEach(() => {
  vi.mocked(getReceivedBookings).mockReset()
})

describe('Received bookings', () => {
  it('shows loading followed by an empty state', async () => {
    vi.mocked(getReceivedBookings).mockResolvedValue({ bookings: [] })

    render(<ReceivedBookings token="test-token" />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading received bookings...'
    )
    expect(await screen.findByRole('heading', {
      name: 'No bookings yet',
    })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: 'Refresh bookings',
    })).toBeEnabled()
  })

  it('renders the Gig, Client, saved price, status and booking reference', async () => {
    vi.mocked(getReceivedBookings).mockResolvedValue({
      bookings: [testBooking],
    })

    render(<ReceivedBookings token="test-token" />)

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.getByText('client@example.com')).toBeInTheDocument()
    expect(screen.getByText(testBooking._id)).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
    expect(screen.getByText(/1[\s,.]*500[,.]50/)).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('shows an API error and recovers when refreshed', async () => {
    vi.mocked(getReceivedBookings)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({ bookings: [testBooking] })

    const user = userEvent.setup()
    render(<ReceivedBookings token="test-token" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(screen.queryByText('No bookings yet')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Refresh bookings',
    }))

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getReceivedBookings).toHaveBeenCalledTimes(2)
  })

  it('handles deleted Gig and Client references without crashing', async () => {
    vi.mocked(getReceivedBookings).mockResolvedValue({
      bookings: [{ ...testBooking, gig: null, client: null }],
    })

    render(<ReceivedBookings token="test-token" />)

    expect(await screen.findByRole('heading', {
      name: 'Gig no longer available',
    })).toBeInTheDocument()
    expect(screen.getByText('Client unavailable')).toBeInTheDocument()
    expect(screen.getByText(testBooking._id)).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
  })
})
