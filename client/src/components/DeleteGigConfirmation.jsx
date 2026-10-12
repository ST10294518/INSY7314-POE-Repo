import { useState } from 'react'
import { deleteGig } from '../services/freelancerApi'

export default function DeleteGigConfirmation({ gig, token, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (deleting) return

    setDeleting(true)
    setError('')

    try {
      await deleteGig(gig._id, token)
      onDeleted()
    } catch (err) {
      setError(
        err.status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.message || 'Unable to delete your gig.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)}>
        Delete gig
      </button>
    )
  }

  return (
    <section aria-labelledby={`delete-heading-${gig._id}`}>
      <h3 id={`delete-heading-${gig._id}`}>Delete this gig?</h3>
      <p>
        You are about to delete "{gig.title}". This cannot be undone.
      </p>

      {error && <p className="freelancer-error" role="alert">{error}</p>}

      <button type="button" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting...' : 'Confirm deletion'}
      </button>

      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          setConfirming(false)
          setError('')
        }}
      >
        Cancel
      </button>
    </section>
  )
}
