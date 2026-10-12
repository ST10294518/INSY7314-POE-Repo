import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteGigConfirmation from '../components/DeleteGigConfirmation'
import { deleteGig } from '../services/freelancerApi'

vi.mock('../services/freelancerApi', () => ({
  deleteGig: vi.fn(),
}))

const testGig = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Website Development',
}

function setup() {
  const onDeleted = vi.fn()
  const user = userEvent.setup()

  render(
    <DeleteGigConfirmation
      gig={testGig}
      token="test-token"
      onDeleted={onDeleted}
    />
  )

  return { user, onDeleted }
}

beforeEach(() => {
  vi.mocked(deleteGig).mockReset()
})

describe('Delete Gig confirmation', () => {
  it('requires confirmation and allows cancellation without deleting', async () => {
    const { user, onDeleted } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete gig' }))

    expect(
      screen.getByRole('heading', { name: 'Delete this gig?' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Website Development/)).toBeInTheDocument()
    expect(deleteGig).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Delete gig' })).toBeInTheDocument()
    expect(deleteGig).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('deletes the selected Gig and notifies the dashboard after success', async () => {
    vi.mocked(deleteGig).mockResolvedValue({
      message: 'Gig deleted successfully.',
    })

    const { user, onDeleted } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete gig' }))
    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }))

    expect(deleteGig).toHaveBeenCalledExactlyOnceWith(
      testGig._id,
      'test-token'
    )
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
  })

  it('shows a failed deletion and allows a successful retry', async () => {
    vi.mocked(deleteGig)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({ message: 'Gig deleted successfully.' })

    const { user, onDeleted } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete gig' }))
    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(onDeleted).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }))

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(deleteGig).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables confirmation and cancellation while deletion is pending', async () => {
    let completeDeletion

    vi.mocked(deleteGig).mockImplementation(
      () => new Promise((resolve) => {
        completeDeletion = resolve
      })
    )

    const { user, onDeleted } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete gig' }))
    await user.click(screen.getByRole('button', { name: 'Confirm deletion' }))

    const pendingButton = screen.getByRole('button', { name: 'Deleting...' })
    expect(pendingButton).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    await user.click(pendingButton)
    expect(deleteGig).toHaveBeenCalledTimes(1)
    expect(onDeleted).not.toHaveBeenCalled()

    await act(async () => {
      completeDeletion({ message: 'Gig deleted successfully.' })
    })

    expect(onDeleted).toHaveBeenCalledTimes(1)
  })
})
