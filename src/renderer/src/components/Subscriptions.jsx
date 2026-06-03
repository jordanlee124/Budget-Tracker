import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import { useTranslation } from '../i18n'

const CATEGORIES = [
  'Entertainment', 'Software', 'Music', 'News & Media', 'Food & Dining',
  'Fitness & Health', 'Education', 'Cloud Storage', 'Shopping', 'Other'
]

const CATEGORY_COLORS = {
  'Entertainment': '#ec4899',
  'Software': '#3b82f6',
  'Music': '#8b5cf6',
  'News & Media': '#06b6d4',
  'Food & Dining': '#f59e0b',
  'Fitness & Health': '#10b981',
  'Education': '#6366f1',
  'Cloud Storage': '#64748b',
  'Shopping': '#f97316',
  'Other': '#94a3b8'
}

const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

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

function subForMonth(sub, year, month) {
  if (sub.billingCycle === 'daily') return sub.amount * new Date(year, month + 1, 0).getDate()
  if (sub.billingCycle === 'monthly') return sub.amount
  if (!sub.nextBillingDate) {
    if (sub.billingCycle === 'quarterly') return sub.amount / 3
    if (sub.billingCycle === 'yearly') return sub.amount / 12
    return sub.amount * 52 / 12
  }
  if (sub.billingCycle === 'weekly') {
    return sub.amount * countOccurrencesInMonth(sub.nextBillingDate, 7, year, month)
  }
  // quarterly / yearly: payment falls in the month only when the month offset
  // from the reference date is a multiple of the billing period in months
  const ref = new Date(sub.nextBillingDate + 'T00:00:00')
  const periodMonths = sub.billingCycle === 'yearly' ? 12 : 3
  const monthDiff = (year - ref.getFullYear()) * 12 + (month - ref.getMonth())
  return monthDiff % periodMonths === 0 ? sub.amount : 0
}

// Average used only for the individual-card hint and form preview.
function monthlyAmount(amount, cycle) {
  if (cycle === 'daily') return amount * 365 / 12
  if (cycle === 'weekly') return amount * 52 / 12
  if (cycle === 'quarterly') return amount / 3
  if (cycle === 'yearly') return amount / 12
  return amount
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function DaysChip({ days }) {
  const { t } = useTranslation()
  if (days < 0) return <span className="sub-days urgent">{t('common.overdue')}</span>
  if (days === 0) return <span className="sub-days urgent">{t('common.today')}</span>
  if (days <= 3) return <span className="sub-days urgent">{t('common.inDays', { n: days })}</span>
  if (days <= 7) return <span className="sub-days soon">{t('common.inDays', { n: days })}</span>
  return <span className="sub-days normal">{t('common.inDays', { n: days })}</span>
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function advanceDate(dateStr, cycle) {
  const d = new Date(dateStr + 'T12:00:00')
  if (cycle === 'weekly') d.setDate(d.getDate() + 7)
  else if (cycle === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

function isDueThisMonthOrEarlier(dateStr) {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return dateStr.substring(0, 7) <= currentMonth
}

function SubForm({ sub, onSave, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => sub
    ? { ...sub, amount: String(sub.amount) }
    : {
        name: '',
        amount: '',
        billingCycle: 'monthly',
        nextBillingDate: getToday(),
        category: 'Entertainment',
        active: true
      }
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const monthly = form.amount ? monthlyAmount(parseFloat(form.amount) || 0, form.billingCycle) : null

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">{t('subscriptions.serviceNameLabel')}</label>
        <input type="text" className="form-input" placeholder={t('subscriptions.serviceNamePlaceholder')}
          value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('common.amount')}</label>
          <input type="number" className="form-input" placeholder="0.00"
            min="0.01" step="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">{t('subscriptions.billingCycle')}</label>
          <select className="form-select" value={form.billingCycle}
            onChange={e => set('billingCycle', e.target.value)}>
            {BILLING_CYCLES.map(c => (
              <option key={c} value={c}>{t(`cycles.${c}`)}</option>
            ))}
          </select>
        </div>
      </div>
      {monthly !== null && form.billingCycle !== 'monthly' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
          ≈ ${monthly.toFixed(2)}{t('subscriptions.perMo')}
        </p>
      )}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('subscriptions.nextBillingDate')}</label>
          <input type="date" className="form-input" value={form.nextBillingDate}
            onChange={e => set('nextBillingDate', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">{t('common.category')}</label>
          <select className="form-select" value={form.category}
            onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{t(`subCategories.${c}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn btn-primary">
          {sub ? t('subscriptions.submitAdd') : t('subscriptions.submitAdd')}
        </button>
      </div>
    </form>
  )
}

export default function Subscriptions() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, loading } = useApp()
  const { t, locale } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [editingSub, setEditingSub] = useState(null)

  const cycleLabel = {
    daily: t('subscriptions.perDay'),
    weekly: t('subscriptions.perWk'),
    monthly: t('subscriptions.perMo'),
    quarterly: t('subscriptions.perQtr'),
    yearly: t('subscriptions.perYr')
  }

  const totalMonthly = useMemo(() => {
    const now = new Date()
    return subscriptions.filter(s => s.active).reduce((sum, s) => sum + subForMonth(s, now.getFullYear(), now.getMonth()), 0)
  }, [subscriptions])

  const upcoming = useMemo(
    () => subscriptions.filter(s => s.active && daysUntil(s.nextBillingDate) <= 7),
    [subscriptions]
  )

  const sorted = useMemo(
    () => [...subscriptions].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)),
    [subscriptions]
  )

  function handleSave(formData) {
    if (editingSub) {
      updateSubscription({ ...editingSub, ...formData })
    } else {
      addSubscription(formData)
    }
    closeModal()
  }

  function toggleActive(sub) {
    updateSubscription({ ...sub, active: !sub.active })
  }

  function markPaid(sub) {
    updateSubscription({ ...sub, nextBillingDate: advanceDate(sub.nextBillingDate, sub.billingCycle) })
  }

  function closeModal() {
    setShowModal(false)
    setEditingSub(null)
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('subscriptions.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          {t('subscriptions.addBtn')}
        </button>
      </div>

      {subscriptions.length > 0 && (
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: '#fee2e2' }}>🔄</div>
            <div>
              <div className="card-label">{t('subscriptions.monthlyCost')}</div>
              <div className="card-value">${totalMonthly.toFixed(2)}</div>
            </div>
          </div>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: '#fef3c7' }}>📅</div>
            <div>
              <div className="card-label">{t('subscriptions.yearlyCost')}</div>
              <div className="card-value">${(totalMonthly * 12).toFixed(2)}</div>
            </div>
          </div>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: upcoming.length > 0 ? '#fef2f2' : '#f0fdf4' }}>
              {upcoming.length > 0 ? '⚠️' : '✅'}
            </div>
            <div>
              <div className="card-label">{t('subscriptions.dueThisWeek')}</div>
              <div className="card-value">{upcoming.length}</div>
            </div>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="card">
          <p className="empty-state">{t('subscriptions.noSubscriptions')}</p>
        </div>
      ) : (
        <div className="sub-grid">
          {sorted.map(sub => {
            const days = daysUntil(sub.nextBillingDate)
            const now = new Date()
            const monthly = subForMonth(sub, now.getFullYear(), now.getMonth())
            const color = CATEGORY_COLORS[sub.category] || '#94a3b8'

            return (
              <div
                key={sub.id}
                className={`sub-card ${!sub.active ? 'paused' : ''}`}
                style={{ '--sub-color': color }}
              >
                <div className="sub-card-header">
                  <div className="sub-card-title-group">
                    <div className="sub-name">{sub.name}</div>
                    <div className="sub-category">{t(`subCategories.${sub.category}`)}</div>
                  </div>
                  <div className="sub-card-actions">
                    {!sub.active && <span className="badge-paused">{t('common.paused')}</span>}
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingSub(sub); setShowModal(true) }}>
                      {t('common.edit')}
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => deleteSubscription(sub.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="sub-amount-row">
                    <span className="sub-amount">${sub.amount.toFixed(2)}</span>
                    <span className="sub-cycle">{cycleLabel[sub.billingCycle]}</span>
                  </div>
                  {sub.billingCycle !== 'monthly' && (
                    <div className="sub-monthly-equiv">${monthly.toFixed(2)}{t('subscriptions.perMo')} this month</div>
                  )}
                </div>

                <div className="sub-billing">
                  <span className="sub-billing-label">{t('subscriptions.nextBilling')}</span>
                  <div className="sub-billing-right">
                    <span className="sub-billing-date">
                      {new Date(sub.nextBillingDate + 'T12:00:00').toLocaleDateString(locale, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    {sub.active && <DaysChip days={days} />}
                  </div>
                </div>

                {sub.history?.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Added {new Date(sub.history[0].changedAt + 'T12:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {sub.history.length > 1 && (
                      <> · Last changed {new Date(sub.history[sub.history.length - 1].changedAt + 'T12:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </div>
                )}

                <div className="sub-footer">
                  <label className="sub-toggle">
                    <input type="checkbox" checked={sub.active}
                      onChange={() => toggleActive(sub)} />
                    {t('common.active')}
                  </label>
                  {sub.active && isDueThisMonthOrEarlier(sub.nextBillingDate) && (
                    <button
                      className={`btn btn-sm ${days <= 0 ? 'btn-success' : 'btn-ghost'}`}
                      onClick={() => markPaid(sub)}
                    >
                      {t('subscriptions.markPaid')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal}
        title={editingSub ? t('subscriptions.editModal') : t('subscriptions.addModal')}>
        <SubForm sub={editingSub} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
