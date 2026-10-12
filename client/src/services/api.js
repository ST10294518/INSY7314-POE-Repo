
const API_BASE = '/api'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

export async function apiRequest(
  endpoint,
  { token, headers = {}, ...options } = {}
) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Only invalidate an existing session when an
    // authenticated request is rejected.
    // Incorrect Login credentials must not trigger this.
    if (response.status === 401 && token) {
      unauthorizedHandler?.(token)
    }

    const error = new Error(
      data.message || `Request failed (${response.status}).`
    )

    error.status = response.status
    throw error
  }

  return data
}

export const authApi = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, role) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  me: (token) =>
    apiRequest('/auth/me', { token }),
}

export const gigApi = {
  getAll: () => apiRequest('/gigs'),

  getById: (gigId) =>
    apiRequest(`/gigs/${encodeURIComponent(gigId)}`),
}

export const bookingApi = {
  create: (gigId, token, idempotencyKey) =>
    apiRequest('/bookings', {
      method: 'POST',
      token,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ gigId }),
    }),

  getMine: (token) =>
    apiRequest('/bookings/mine', { token }),

  getById: (bookingId, token) =>
    apiRequest(
      `/bookings/${encodeURIComponent(bookingId)}`,
      { token }
    ),
}

export const transactionApi = {
  getIncome: (token) =>
    apiRequest('/transactions/income', { token }),

  getMine: (token) =>
    apiRequest('/transactions/mine', { token }),
}
