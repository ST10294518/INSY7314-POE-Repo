import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditGigForm from '../components/EditGigForm'
import { updateGig } from '../services/freelancerApi'

vi.mock('../services/freelancerApi', () => ({
  updateGig: vi.fn(),
}))

const testGig = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Website Development',
  description: 'I will build a responsive website.',
  price: 1500.50,
  category: 'Web Development',
}

function setup() {
  const user = userEvent.setup()
  const onSaved = vi.fn()
  const onCancel = vi.fn()

  render(
    <EditGigForm
      gig={testGig}
      token="test-token"
      onSaved={onSaved}
      onCancel={onCancel}
    />
  )

  return { user, onSaved, onCancel }
}

beforeEach(() => {
  vi.mocked(updateGig).mockReset()
})

describe('Edit Gig form', () => {
  it('loads existing details and cancels without submitting edits', async () => {
    const { user, onSaved, onCancel } = setup()

    expect(screen.getByLabelText('Title')).toHaveValue(testGig.title)
    expect(screen.getByLabelText('Description')).toHaveValue(testGig.description)
    expect(screen.getByLabelText('Price')).toHaveValue(testGig.price)
    expect(screen.getByLabelText('Category (optional)')).toHaveValue(testGig.category)

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Unsaved change')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(updateGig).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('updates the selected Gig with trimmed fields and a numeric price', async () => {
    vi.mocked(updateGig).mockResolvedValue({ gig: { ...testGig } })

    const { user, onSaved } = setup()

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), ' Website Development Updated ')
    await user.clear(screen.getByLabelText('Price'))
    await user.type(screen.getByLabelText('Price'), '1750.75')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(updateGig).toHaveBeenCalledExactlyOnceWith(
      testGig._id,
      {
        title: 'Website Development Updated',
        description: testGig.description,
        price: 1750.75,
        category: testGig.category,
      },
      'test-token'
    )
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  })

  it('rejects script text without sending an update', async () => {
    const { user, onSaved } = setup()

    await user.clear(screen.getByLabelText('Description'))
    await user.type(
      screen.getByLabelText('Description'),
      '<script>alert(1)</script>'
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use plain text without HTML or control characters.'
    )
    expect(updateGig).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('preserves edits after an API failure and allows retry', async () => {
    vi.mocked(updateGig)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({ gig: { ...testGig } })

    const { user, onSaved } = setup()

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Updated service')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(screen.getByLabelText('Title')).toHaveValue('Updated service')
    expect(onSaved).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(updateGig).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
