// Documentation references added during final review (9 November 2026).
// FETCH: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

import { apiRequest } from './api'

export const adminApi = {
  me: (token) =>
    apiRequest('/admin/me', { token }),

  overview: (token) =>
    apiRequest('/admin/overview', { token }),

  users: (token, page = 1) =>
    apiRequest(`/admin/users?page=${page}&limit=20`, {
      token,
    }),

  gigs: (token, page = 1) =>
    apiRequest(`/admin/gigs?page=${page}&limit=20`, {
      token,
    }),

  bookings: (token, page = 1) =>
    apiRequest(`/admin/bookings?page=${page}&limit=20`, {
      token,
    }),

  transactions: (token, page = 1) =>
    apiRequest(`/admin/transactions?page=${page}&limit=20`, {
      token,
    }),
}
