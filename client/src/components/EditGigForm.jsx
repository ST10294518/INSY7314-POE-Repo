import { useState } from 'react'
import { updateGig } from '../services/freelancerApi'

export default function EditGigForm({ gig, token, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: gig.title,
    description: gig.description,
    price: String(gig.price),
    category: gig.category || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setError('')

    const title = form.title.trim()
    const description = form.description.trim()
    const category = form.category.trim()
    const priceText = form.price.trim()
    const price = Number(priceText)

    if (title.length < 3 || title.length > 120) {
      setError('Title must contain between 3 and 120 characters.')
      return
    }

    if (description.length < 10 || description.length > 2000) {
      setError('Description must contain between 10 and 2000 characters.')
      return
    }

    if (category.length > 80) {
      setError('Category must not exceed 80 characters.')
      return
    }

    const invalidText = [title, description, category].some(
      (value) => Array.from(value).some((character) => {
        const code = character.codePointAt(0)
        return character === '<' || character === '>' ||
          code < 32 || code === 127
      })
    )

    if (invalidText) {
      setError('Use plain text without HTML or control characters.')
      return
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price < 0.01 ||
      !Number.isSafeInteger(Math.round(price * 100))
    ) {
      setError('Price must be positive with at most two decimal places.')
      return
    }

    setSubmitting(true)

    try {
      const result = await updateGig(
        gig._id,
        { title, description, price, category },
        token
      )

      if (result.gig?._id !== gig._id) {
        throw new Error('The server did not return the updated gig.')
      }

      onSaved()
    } catch (err) {
      setError(
        err.status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.message || 'Unable to update your gig.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="freelancer-create" aria-labelledby={`edit-heading-${gig._id}`}>
      <h3 id={`edit-heading-${gig._id}`}>Edit gig</h3>
      {error && <p className="freelancer-error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset disabled={submitting}>
          <legend>Service details</legend>

          <label htmlFor={`edit-title-${gig._id}`}>Title</label>
          <input
            id={`edit-title-${gig._id}`}
            name="title"
            value={form.title}
            onChange={updateField}
            minLength={3}
            maxLength={120}
            required
          />

          <label htmlFor={`edit-description-${gig._id}`}>Description</label>
          <textarea
            id={`edit-description-${gig._id}`}
            name="description"
            value={form.description}
            onChange={updateField}
            minLength={10}
            maxLength={2000}
            rows={4}
            required
          />

          <label htmlFor={`edit-price-${gig._id}`}>Price</label>
          <input
            id={`edit-price-${gig._id}`}
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={updateField}
            required
          />

          <label htmlFor={`edit-category-${gig._id}`}>Category (optional)</label>
          <input
            id={`edit-category-${gig._id}`}
            name="category"
            value={form.category}
            onChange={updateField}
            maxLength={80}
          />

          <button type="submit">
            {submitting ? 'Saving changes...' : 'Save changes'}
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </fieldset>
      </form>
    </section>
  )
}
