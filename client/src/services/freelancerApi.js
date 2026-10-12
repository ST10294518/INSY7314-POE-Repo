import { apiRequest } from './api'

export function getOwnGigs(token, signal) {
  return apiRequest('/gigs/mine', { token, signal })
}

export function createGig(gig, token) {
  return apiRequest('/gigs', {
    method: 'POST',
    token,
    body: JSON.stringify({
      title: gig.title,
      description: gig.description,
      price: gig.price,
      category: gig.category,
    }),
  })
}

export function updateGig(gigId, gig, token) {
  return apiRequest(`/gigs/${encodeURIComponent(gigId)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({
      title: gig.title,
      description: gig.description,
      price: gig.price,
      category: gig.category,
    }),
  })
}

export function deleteGig(gigId, token) {
  return apiRequest(`/gigs/${encodeURIComponent(gigId)}`, {
    method: 'DELETE',
    token,
  })
}

export function getReceivedBookings(token, signal) {
  return apiRequest('/bookings/freelancer', { token, signal })
}

export function getFreelancerIncome(token, signal) {
  return apiRequest('/transactions/income', { token, signal })
}

export function getFreelancerTransactions(token, signal) {
  return apiRequest('/transactions/mine', { token, signal })
}
