import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FreelancerIncome from '../components/FreelancerIncome'
import {
  getFreelancerIncome,
  getFreelancerTransactions,
} from '../services/freelancerApi'

vi.mock('../services/freelancerApi', () => ({
  getFreelancerIncome: vi.fn(),
  getFreelancerTransactions: vi.fn(),
}))

const testTransaction = {
  _id: '507f1f77bcf86cd799439011',
  booking: {
    _id: '507f1f77bcf86cd799439012',
    gig: { title: 'Website Development' },
  },
  amount: 1500.50,
  status: 'completed',
  transactionDate: '2026-10-12T08:00:00.000Z',
}

function mockIncome(totalIncome = 1500.50, completedTransactions = 1) {
  vi.mocked(getFreelancerIncome).mockResolvedValue({
    currency: 'ZAR',
    totalIncome,
    completedTransactions,
  })
}

beforeEach(() => {
  vi.mocked(getFreelancerIncome).mockReset()
  vi.mocked(getFreelancerTransactions).mockReset()
})

describe('Freelancer income and transactions', () => {
  it('shows loading, zero income and an empty history for a new account', async () => {
    mockIncome(0, 0)
    vi.mocked(getFreelancerTransactions).mockResolvedValue({
      transactions: [],
    })

    render(<FreelancerIncome token="test-token" />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading income and transactions...'
    )
    expect(await screen.findByRole('heading', {
      name: 'No transactions yet',
    })).toBeInTheDocument()
    expect(screen.getByText(/R\s*0[,.]00/)).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the server income total and saved transaction details', async () => {
    mockIncome()
    vi.mocked(getFreelancerTransactions).mockResolvedValue({
      transactions: [testTransaction],
    })

    render(<FreelancerIncome token="test-token" />)

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.getAllByText(/1[\s,.]*500[,.]50/)).toHaveLength(2)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(testTransaction._id)).toBeInTheDocument()
    expect(screen.getByText(testTransaction.booking._id)).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('shows a request failure instead of zero income and recovers on refresh', async () => {
    vi.mocked(getFreelancerIncome)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({
        currency: 'ZAR',
        totalIncome: 1500.50,
        completedTransactions: 1,
      })
    vi.mocked(getFreelancerTransactions).mockResolvedValue({
      transactions: [testTransaction],
    })

    const user = userEvent.setup()
    render(<FreelancerIncome token="test-token" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(screen.queryByText('Total income')).not.toBeInTheDocument()
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh income' }))

    expect(await screen.findByRole('heading', {
      name: 'Website Development',
    })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getFreelancerIncome).toHaveBeenCalledTimes(2)
    expect(getFreelancerTransactions).toHaveBeenCalledTimes(2)
  })

  it('rejects an invalid income response rather than displaying a misleading balance', async () => {
    vi.mocked(getFreelancerIncome).mockResolvedValue({
      currency: 'ZAR',
      totalIncome: 'unavailable',
      completedTransactions: 1,
    })
    vi.mocked(getFreelancerTransactions).mockResolvedValue({
      transactions: [testTransaction],
    })

    render(<FreelancerIncome token="test-token" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to read your income records. Please try again.'
    )
    expect(screen.queryByText('Total income')).not.toBeInTheDocument()
  })

  it('retains transaction details when the linked Booking is unavailable', async () => {
    mockIncome()
    vi.mocked(getFreelancerTransactions).mockResolvedValue({
      transactions: [{ ...testTransaction, booking: null }],
    })

    render(<FreelancerIncome token="test-token" />)

    expect(await screen.findByRole('heading', {
      name: 'Gig no longer available',
    })).toBeInTheDocument()
    expect(screen.getByText('Booking unavailable')).toBeInTheDocument()
    expect(screen.getByText(testTransaction._id)).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })
})
