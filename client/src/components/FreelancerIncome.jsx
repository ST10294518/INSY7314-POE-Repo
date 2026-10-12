import { useEffect, useState } from 'react'
import {
  getFreelancerIncome,
  getFreelancerTransactions,
} from '../services/freelancerApi'

function formatAmount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Amount unavailable'
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value)
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-ZA')
}

export default function FreelancerIncome({ token }) {
  const [reload, setReload] = useState(0)
  const [state, setState] = useState({
    loading: true,
    income: null,
    transactions: [],
    error: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadIncome() {
      try {
        const [income, history] = await Promise.all([
          getFreelancerIncome(token, controller.signal),
          getFreelancerTransactions(token, controller.signal),
        ])

        if (
          income.currency !== 'ZAR' ||
          typeof income.totalIncome !== 'number' ||
          !Number.isFinite(income.totalIncome) ||
          income.totalIncome < 0 ||
          !Number.isInteger(income.completedTransactions) ||
          income.completedTransactions < 0 ||
          !Array.isArray(history.transactions)
        ) {
          throw new Error('Unable to read your income records. Please try again.')
        }

        if (active) {
          setState({
            loading: false,
            income,
            transactions: history.transactions,
            error: '',
          })
        }
      } catch (err) {
        if (active && err.name !== 'AbortError') {
          setState({
            loading: false,
            income: null,
            transactions: [],
            error: err.status === 401
              ? 'Your session has expired. Please sign in again.'
              : err.message || 'Unable to load income and transactions.',
          })
        }
      }
    }

    loadIncome()

    return () => {
      active = false
      controller.abort()
    }
  }, [token, reload])

  function refreshIncome() {
    setState({
      loading: true,
      income: null,
      transactions: [],
      error: '',
    })
    setReload((value) => value + 1)
  }

  return (
    <section
      className="freelancer-income"
      aria-labelledby="income-heading"
      aria-busy={state.loading}
    >
      <div className="freelancer-section-heading">
        <h2 id="income-heading">Income and transactions</h2>
        <button
          type="button"
          onClick={refreshIncome}
          disabled={state.loading}
        >
          Refresh income
        </button>
      </div>

      <p>Income recorded from completed simulated payments.</p>

      {state.loading && <p role="status">Loading income and transactions...</p>}

      {state.error && (
        <p className="freelancer-error" role="alert">{state.error}</p>
      )}

      {!state.loading && !state.error && state.income && (
        <>
          <dl className="freelancer-income-summary">
            <div>
              <dt>Total income</dt>
              <dd>{formatAmount(state.income.totalIncome)}</dd>
            </div>
            <div>
              <dt>Completed transactions</dt>
              <dd>{state.income.completedTransactions}</dd>
            </div>
          </dl>

          <h3>Transaction history</h3>

          {state.transactions.length === 0 ? (
            <div className="freelancer-empty">
              <h3>No transactions yet</h3>
              <p>Payments recorded for your bookings will appear here.</p>
            </div>
          ) : (
            <ul className="freelancer-gig-list">
              {state.transactions.map((transaction) => (
                <li key={transaction._id} className="freelancer-gig-card">
                  <h3>
                    {transaction.booking?.gig?.title || 'Gig no longer available'}
                  </h3>
                  <dl>
                    <div>
                      <dt>Transaction reference</dt>
                      <dd>{transaction._id}</dd>
                    </div>
                    <div>
                      <dt>Booking reference</dt>
                      <dd>
                        {transaction.booking?._id ||
                          (typeof transaction.booking === 'string'
                            ? transaction.booking
                            : 'Booking unavailable')}
                      </dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{formatAmount(transaction.amount)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{transaction.status || 'Status unavailable'}</dd>
                    </div>
                    <div>
                      <dt>Recorded on</dt>
                      <dd>
                        {formatDate(
                          transaction.transactionDate || transaction.createdAt
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
