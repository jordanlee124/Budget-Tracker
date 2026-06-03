import { useMemo, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n'

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

function countOccurrencesInMonth(dateStr, periodDays, year, month) {
  const monthStart = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const ref = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((ref - monthStart) / 86400000)
  const offset = ((diffDays % periodDays) + periodDays) % periodDays
  let count = 0
  for (let day = offset; day < daysInMonth; day += periodDays) count++
  return count
}

function monthlyAmount(sub, year, month) {
  if (sub.billingCycle === 'monthly') return sub.amount
  if (sub.billingCycle === 'quarterly') return sub.amount / 3
  if (sub.billingCycle === 'yearly') return sub.amount / 12
  if (sub.nextBillingDate) {
    return sub.amount * countOccurrencesInMonth(sub.nextBillingDate, 7, year, month)
  }
  return sub.amount * 52 / 12
}

function monthlyIncomeAmount(source, year, month) {
  if (source.frequency === 'monthly') return source.amount
  const period = source.frequency === 'weekly' ? 7 : 14
  if (source.nextPaymentDate) {
    return source.amount * countOccurrencesInMonth(source.nextPaymentDate, period, year, month)
  }
  return source.amount * (period === 7 ? 52 : 26) / 12
}

export default function Dashboard() {
  const { expenses, savingsGoals, subscriptions, income, monthlySnapshots, saveMonthSnapshot, loading } = useApp()
  const { t, locale } = useTranslation()
  const [monthOffset, setMonthOffset] = useState(0)

  const selectedDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const selectedMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
  const monthName = selectedDate.toLocaleString(locale, { month: 'long', year: 'numeric' })
  const isFuture = monthOffset > 0
  const isCurrentMonth = monthOffset === 0

  const monthlyExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  )

  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

  const yr = selectedDate.getFullYear()
  const mo = selectedDate.getMonth()

  const liveSubCost = subscriptions
    .filter(s => s.active)
    .reduce((sum, s) => sum + monthlyAmount(s, yr, mo), 0)
  const liveIncome = income
    .filter(i => i.active !== false)
    .reduce((sum, i) => sum + monthlyIncomeAmount(i, yr, mo), 0)

  const snapshot = monthOffset < 0 ? (monthlySnapshots || []).find(s => s.month === selectedMonth) : null
  const totalIncome = snapshot ? snapshot.totalIncome : liveIncome
  const monthlySubCost = snapshot ? snapshot.totalSubscriptions : liveSubCost

  useEffect(() => {
    if (loading) return
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    const exists = (monthlySnapshots || []).some(s => s.month === prevMonth)
    if (!exists) saveMonthSnapshot(prevMonth, liveIncome, liveSubCost)
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading || monthOffset >= 0) return
    const exists = (monthlySnapshots || []).some(s => s.month === selectedMonth)
    if (!exists) saveMonthSnapshot(selectedMonth, liveIncome, liveSubCost)
  }, [selectedMonth, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalOut = totalSpent + monthlySubCost
  const remaining = totalIncome - totalOut
  const hasIncome = totalIncome > 0

  const displayedExpenses = useMemo(
    () => [...monthlyExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [monthlyExpenses]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown = {}
    monthlyExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount
    })
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [monthlyExpenses])

  if (loading) return <div className="loading">{t('common.loading')}</div>

  const remainingPct = hasIncome ? Math.max(0, (remaining / totalIncome) * 100) : 0
  const spentPct = hasIncome ? Math.min((totalSpent / totalIncome) * 100, 100) : 0
  const subPct = hasIncome ? Math.min((monthlySubCost / totalIncome) * 100, 100 - spentPct) : 0

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('nav.dashboard')}</h1>
        <div className="month-nav">
          <button className="month-nav-btn" onClick={() => setMonthOffset(o => o - 1)} title="Previous month">‹</button>
          <span className="month-nav-label">{monthName}</span>
          <button className="month-nav-btn" onClick={() => setMonthOffset(o => o + 1)} title="Next month">›</button>
          {!isCurrentMonth && (
            <button className="btn btn-ghost btn-sm" onClick={() => setMonthOffset(0)}>{t('common.today')}</button>
          )}
          {isFuture && <span className="projected-badge">{t('dashboard.projected')}</span>}
        </div>
      </div>

      <div className="summary-cards">
        <div className="card summary-card">
          <div className="card-icon" style={{ background: remaining >= 0 || !hasIncome ? '#dcfce7' : '#fee2e2' }}>
            {remaining >= 0 || !hasIncome ? '✅' : '⚠️'}
          </div>
          <div>
            <div className="card-label">{t('dashboard.remaining')}</div>
            <div className="card-value" style={{ color: !hasIncome ? 'var(--text-primary)' : remaining >= 0 ? '#16a34a' : '#dc2626' }}>
              {hasIncome ? `$${Math.abs(remaining).toFixed(2)}` : '—'}
            </div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#dcfce7' }}>📥</div>
          <div>
            <div className="card-label">{t('dashboard.monthlyIncome')}</div>
            <div className="card-value">${totalIncome.toFixed(2)}</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#fef3c7' }}>💸</div>
          <div>
            <div className="card-label">{t('dashboard.expenses')}</div>
            <div className="card-value">${totalSpent.toFixed(2)}</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon" style={{ background: '#fee2e2' }}>🔄</div>
          <div>
            <div className="card-label">{t('dashboard.subscriptionsMo')}</div>
            <div className="card-value">${monthlySubCost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {hasIncome && (
        <div className="card budget-overview" style={{ marginBottom: 20 }}>
          <div className="budget-overview-header">
            <h2 className="card-title" style={{ margin: 0 }}>
              {isFuture ? t('dashboard.projectedBudget') : t('dashboard.monthlyBudget')}
            </h2>
            <span className={`budget-status ${remaining < 0 ? 'over' : ''}`}>
              {remaining >= 0
                ? t('dashboard.remainingAmt', { amount: remaining.toFixed(2), pct: remainingPct.toFixed(0) })
                : t('dashboard.overBudget', { amount: Math.abs(remaining).toFixed(2) })}
            </span>
          </div>
          <div className="budget-bar-track">
            <div className="budget-bar-segment expenses" style={{ width: `${spentPct}%` }} title={`${t('dashboard.expenses')} $${totalSpent.toFixed(2)}`} />
            <div className="budget-bar-segment subscriptions" style={{ width: `${subPct}%` }} title={`${t('dashboard.subscriptionsMo')} $${monthlySubCost.toFixed(2)}`} />
          </div>
          <div className="budget-legend">
            <span className="legend-item"><span className="legend-dot expenses" />{t('dashboard.expenses')} ${totalSpent.toFixed(2)}</span>
            <span className="legend-item"><span className="legend-dot subscriptions" />{t('dashboard.subscriptionsMo')} ${monthlySubCost.toFixed(2)}</span>
            <span className="legend-item"><span className="legend-dot remaining" />{t('dashboard.remaining')} ${Math.max(0, remaining).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">{t('dashboard.recentExpenses', { month: monthName })}</h2>
          {displayedExpenses.length === 0 ? (
            <p className="empty-state">
              {isFuture ? t('dashboard.noExpensesFuture') : t('dashboard.noExpensesMonth')}
            </p>
          ) : (
            <div className="expense-list">
              {displayedExpenses.map(expense => (
                <div key={expense.id} className="expense-row">
                  <div className="expense-info">
                    <div className="category-dot" style={{ background: CATEGORY_COLORS[expense.category] || '#94a3b8' }} />
                    <div>
                      <div className="expense-desc">{expense.description}</div>
                      <div className="expense-meta">{t(`categories.${expense.category}`)} · {expense.date}</div>
                    </div>
                  </div>
                  <div className="expense-amount">-${expense.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">{t('dashboard.byCategory', { month: monthName })}</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">{t('dashboard.noSpendingData')}</p>
          ) : (
            <div className="category-breakdown">
              {categoryBreakdown.map(([category, amount]) => (
                <div key={category} className="category-row">
                  <div className="category-info">
                    <div className="category-dot" style={{ background: CATEGORY_COLORS[category] || '#94a3b8' }} />
                    <span className="category-name">{t(`categories.${category}`)}</span>
                  </div>
                  <div className="category-bar-container">
                    <div className="category-bar"
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
          <h2 className="card-title">{t('dashboard.savingsProgress')}</h2>
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
                    <div className="progress-bar"
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
