import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b',
  'Transportation': '#3b82f6',
  'Housing': '#8b5cf6',
  'Entertainment': '#ec4899',
  'Healthcare': '#10b981',
  'Shopping': '#f97316',
  'Education': '#06b6d4',
  'Other': '#94a3b8'
}

export default function Dashboard() {
  const { expenses, savingsGoals, loading } = useApp()

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  const monthlyExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(thisMonth)),
    [expenses, thisMonth]
  )

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [expenses]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown = {}
    monthlyExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount
    })
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [monthlyExpenses])

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="date-badge">{monthName}</span>
      </div>

      <div className="summary-cards">
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#fef3c7' }}>💸</div>
          <div>
            <div className="card-label">Spent This Month</div>
            <div className="card-value">${totalSpent.toFixed(2)}</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#dcfce7' }}>💰</div>
          <div>
            <div className="card-label">Total Saved</div>
            <div className="card-value">${totalSaved.toFixed(2)}</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#ede9fe' }}>🎯</div>
          <div>
            <div className="card-label">Active Goals</div>
            <div className="card-value">{savingsGoals.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Recent Expenses</h2>
          {recentExpenses.length === 0 ? (
            <p className="empty-state">No expenses yet.<br />Head to Expenses to add your first one.</p>
          ) : (
            <div className="expense-list">
              {recentExpenses.map(expense => (
                <div key={expense.id} className="expense-row">
                  <div className="expense-info">
                    <div
                      className="category-dot"
                      style={{ background: CATEGORY_COLORS[expense.category] || '#94a3b8' }}
                    />
                    <div>
                      <div className="expense-desc">{expense.description}</div>
                      <div className="expense-meta">{expense.category} · {expense.date}</div>
                    </div>
                  </div>
                  <div className="expense-amount">-${expense.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">This Month by Category</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">No spending data for this month yet.</p>
          ) : (
            <div className="category-breakdown">
              {categoryBreakdown.map(([category, amount]) => (
                <div key={category} className="category-row">
                  <div className="category-info">
                    <div
                      className="category-dot"
                      style={{ background: CATEGORY_COLORS[category] || '#94a3b8' }}
                    />
                    <span className="category-name">{category}</span>
                  </div>
                  <div className="category-bar-container">
                    <div
                      className="category-bar"
                      style={{
                        width: `${totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : 0}%`,
                        background: CATEGORY_COLORS[category] || '#94a3b8'
                      }}
                    />
                  </div>
                  <span className="category-amount">${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {savingsGoals.length > 0 && (
        <div className="card">
          <h2 className="card-title">Savings Progress</h2>
          <div className="goals-summary">
            {savingsGoals.map(goal => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              return (
                <div key={goal.id} className="goal-summary-item">
                  <div className="goal-summary-header">
                    <span className="goal-name">{goal.name}</span>
                    <span className="goal-amounts">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#22c55e' : goal.color || '#7c5cbf'
                      }}
                    />
                  </div>
                  <span className="goal-percent">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
