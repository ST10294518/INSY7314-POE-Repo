import { useState } from 'react'
import { createGig } from '../services/freelancerApi'

const emptyForm = {
  title: '',
  description: '',
  price: '',
  category: '',
}

export default function CreateGigForm({ token, onCreated }) {
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setError('')
    setSuccess('')

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

    if ([title, description, category].some(
      (value) => Array.from(value).some((character) => {
        const code = character.codePointAt(0)
        return character === '<' || character === '>' ||
          code < 32 || code === 127
      })
    )) {
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
      const result = await createGig(
        { title, description, price, category },
        token
      )

      if (!result.gig?._id) {
        throw new Error('The server did not return the created gig.')
      }

      setForm({ ...emptyForm })
      setSuccess('Your gig was created successfully.')
      onCreated()
    } catch (err) {
      setError(
        err.status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.message || 'Unable to create your gig.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="freelancer-create" aria-labelledby="create-gig-heading">
      <h2 id="create-gig-heading">Create a gig</h2>

      {error && <p className="freelancer-error" role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset disabled={submitting}>
          <legend>Service details</legend>

          <label htmlFor="gig-title">Title</label>
          <input
            id="gig-title"
            name="title"
            value={form.title}
            onChange={updateField}
            minLength={3}
            maxLength={120}
            required
          />

          <label htmlFor="gig-description">Description</label>
          <textarea
            id="gig-description"
            name="description"
            value={form.description}
            onChange={updateField}
            minLength={10}
            maxLength={2000}
            rows={4}
            required
          />

          <label htmlFor="gig-price">Price</label>
          <input
            id="gig-price"
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={updateField}
            required
          />

          <label htmlFor="gig-category">Category (optional)</label>
          <input
            id="gig-category"
            name="category"
            value={form.category}
            onChange={updateField}
            maxLength={80}
          />

          <button type="submit">
            {submitting ? 'Creating gig...' : 'Create gig'}
          </button>
        </fieldset>
      </form>
    </section>
  )
}
