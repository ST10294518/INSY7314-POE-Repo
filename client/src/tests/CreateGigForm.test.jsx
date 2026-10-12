import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateGigForm from '../components/CreateGigForm'
import { createGig } from '../services/freelancerApi'

vi.mock('../services/freelancerApi', () => ({
  createGig: vi.fn(),
}))

function setup() {
  const user = userEvent.setup()
  const onCreated = vi.fn()

  render(<CreateGigForm token="test-token" onCreated={onCreated} />)

  return { user, onCreated }
}

async function fillForm(user, description = 'I will build a responsive website.') {
  await user.type(screen.getByLabelText('Title'), ' Website Development ')
  await user.type(screen.getByLabelText('Description'), description)
  await user.type(screen.getByLabelText('Price'), '1500.50')
  await user.type(screen.getByLabelText('Category (optional)'), ' Web Development ')
}

beforeEach(() => {
  vi.mocked(createGig).mockReset()
})

describe('Create Gig form', () => {
  it('submits trimmed permitted fields with a numeric price and clears the form', async () => {
    vi.mocked(createGig).mockResolvedValue({
      gig: { _id: '507f1f77bcf86cd799439011' },
    })

    const { user, onCreated } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(createGig).toHaveBeenCalledExactlyOnceWith(
      {
        title: 'Website Development',
        description: 'I will build a responsive website.',
        price: 1500.50,
        category: 'Web Development',
      },
      'test-token'
    )

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your gig was created successfully.'
    )
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Price')).toHaveValue(null)
    expect(screen.getByLabelText('Category (optional)')).toHaveValue('')
  })

  it('rejects script text without calling the API', async () => {
    const { user, onCreated } = setup()
    await fillForm(user, '<script>alert(1)</script>')
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use plain text without HTML or control characters.'
    )
    expect(createGig).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('preserves entered values after an API failure and supports retry', async () => {
    vi.mocked(createGig)
      .mockRejectedValueOnce(new Error('Server unavailable.'))
      .mockResolvedValueOnce({
        gig: { _id: '507f1f77bcf86cd799439011' },
      })

    const { user, onCreated } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server unavailable.'
    )
    expect(screen.getByLabelText('Title')).toHaveValue(' Website Development ')
    expect(screen.getByLabelText('Price')).toHaveValue(1500.50)
    expect(onCreated).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(createGig).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables the form while a creation request is pending', async () => {
    let completeCreation

    vi.mocked(createGig).mockImplementation(
      () => new Promise((resolve) => {
        completeCreation = resolve
      })
    )

    const { user, onCreated } = setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create gig' }))

    const pendingButton = screen.getByRole('button', { name: 'Creating gig...' })
    expect(pendingButton).toBeDisabled()
    expect(screen.getByLabelText('Title')).toBeDisabled()

    await user.click(pendingButton)
    expect(createGig).toHaveBeenCalledTimes(1)
    expect(onCreated).not.toHaveBeenCalled()

    await act(async () => {
      completeCreation({ gig: { _id: '507f1f77bcf86cd799439011' } })
    })

    expect(onCreated).toHaveBeenCalledTimes(1)
  })
})
