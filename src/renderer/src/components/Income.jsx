import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import { useTranslation } from '../i18n'

const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Other']

const SOURCE_COLORS = {
  'Salary': '#22c55e',
  'Freelance': '#3b82f6',
  'Business': '#8b5cf6',
  'Investment': '#f59e0b',
  'Rental': '#06b6d4',
  'Other': '#94a3b8'
}

// Returns how many times a periodic payment falls in a given calendar month.
// Uses any known payment date as a phase reference and steps by the period.
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

// Actual income for a specific month — counts real occurrences when a
// reference date is available; falls back to the statistical average otherwise.
function incomeForMonth(source, year, month) {
  if (source.frequency === 'monthly') return source.amount
  const period = source.frequency === 'weekly' ? 7 : 14
  if (source.nextPaymentDate) {
    return source.amount * countOccurrencesInMonth(source.nextPaymentDate, period, year, month)
  }
  return source.amount * (period === 7 ? 52 : 26) / 12
}

// Average used only for the form preview and individual-card hints (shown with ≈).
export function monthlyIncomeAmount(amount, frequency) {
  if (frequency === 'weekly') return amount * 52 / 12
  if (frequency === 'fortnightly') return amount * 26 / 12
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
  if (days < 0) return <span className="sub-days soon">{t('common.overdue')}</span>
  if (days === 0) return <span className="sub-days urgent">{t('common.today')}</span>
  if (days <= 3) return <span className="sub-days soon">{t('common.inDays', { n: days })}</span>
  if (days <= 7) return <span className="sub-days normal">{t('common.inDays', { n: days })}</span>
  return <span className="sub-days normal">{t('common.inDays', { n: days })}</span>
}

function IncomeForm({ source, onSave, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => source
    ? { ...source, amount: String(source.amount) }
    : { name: '', amount: '', frequency: 'monthly', source: 'Salary', nextPaymentDate: '' }
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const monthly = form.amount
    ? monthlyIncomeAmount(parseFloat(form.amount) || 0, form.frequency)
    : null

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">{t('income.nameLabel')}</label>
        <input type="text" className="form-input" placeholder={t('income.namePlaceholder')}
          value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('common.amount').replace('($)', '($)')}</label>
          <input type="number" className="form-input" placeholder="0.00"
            min="0.01" step="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">{t('income.frequency')}</label>
          <select className="form-select" value={form.frequency}
            onChange={e => set('frequency', e.target.value)}>
            <option value="weekly">{t('frequencies.weekly')}</option>
            <option value="fortnightly">{t('frequencies.fortnightly')}</option>
            <option value="monthly">{t('frequencies.monthly')}</option>
          </select>
        </div>
      </div>
      {monthly !== null && form.frequency !== 'monthly' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
          {t('income.approxPerMonth', { n: monthly.toFixed(2) })}
        </p>
      )}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('income.sourceType')}</label>
          <select className="form-select" value={form.source}
            onChange={e => set('source', e.target.value)}>
            {SOURCES.map(s => <option key={s} value={s}>{t(`sources.${s}`)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            {t('income.nextPaymentDate')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({t('common.optional')})</span>
          </label>
          <input type="date" className="form-input" value={form.nextPaymentDate || ''}
            onChange={e => set('nextPaymentDate', e.target.value)} />
        </div>
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn btn-primary">
          {source ? t('income.submitEdit') : t('income.submitAdd')}
        </button>
      </div>
    </form>
  )
}

export default function Income() {
  const { income, addIncome, updateIncome, deleteIncome, loading } = useApp()
  const { t, locale } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [editingSource, setEditingSource] = useState(null)

  const activeSources = income.filter(i => i.active !== false)
  const now = new Date()
  const totalMonthly = activeSources.reduce((sum, i) => sum + incomeForMonth(i, now.getFullYear(), now.getMonth()), 0)

  const freqLabel = { weekly: t('income.perWeek'), fortnightly: t('income.perFortnight'), monthly: t('income.perMonth') }

  function handleSave(formData) {
    if (editingSource) {
      updateIncome({ ...editingSource, ...formData })
    } else {
      addIncome({ ...formData, active: true })
    }
    closeModal()
  }

  function toggleActive(source) {
    updateIncome({ ...source, active: !source.active })
  }

  function closeModal() {
    setShowModal(false)
    setEditingSource(null)
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('income.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          {t('income.addBtn')}
        </button>
      </div>

      {income.length > 0 && (
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: '#dcfce7' }}>📥</div>
            <div>
              <div className="card-label">{t('income.monthlyTotal')}</div>
              <div className="card-value" style={{ color: '#16a34a' }}>${totalMonthly.toFixed(2)}</div>
            </div>
          </div>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: '#f0fdf4' }}>📅</div>
            <div>
              <div className="card-label">{t('income.yearlyTotal')}</div>
              <div className="card-value">${(totalMonthly * 12).toFixed(2)}</div>
            </div>
          </div>
          <div className="card summary-card">
            <div className="card-icon" style={{ background: '#ede9fe' }}>💼</div>
            <div>
              <div className="card-label">{t('income.activeSources')}</div>
              <div className="card-value">{activeSources.length}</div>
            </div>
          </div>
        </div>
      )}

      {income.length === 0 ? (
        <div className="card">
          <p className="empty-state">{t('income.noIncome')}</p>
        </div>
      ) : (
        <div className="sub-grid">
          {income.map(src => {
            const monthly = monthlyIncomeAmount(src.amount, src.frequency)
            const color = SOURCE_COLORS[src.source] || '#94a3b8'
            const isActive = src.active !== false

            return (
              <div
                key={src.id}
                className={`sub-card ${!isActive ? 'paused' : ''}`}
                style={{ '--sub-color': color }}
              >
                <div className="sub-card-header">
                  <div className="sub-card-title-group">
                    <div className="sub-name">{src.name}</div>
                    <div className="sub-category">
                      <span className="category-badge" style={{ marginTop: 3 }}>
                        <span className="category-dot" style={{ background: color }} />
                        {t(`sources.${src.source}`)}
                      </span>
                    </div>
                  </div>
                  <div className="sub-card-actions">
                    {!isActive && <span className="badge-paused">{t('common.paused')}</span>}
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingSource(src); setShowModal(true) }}>
                      {t('common.edit')}
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => deleteIncome(src.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="sub-amount-row">
                    <span className="sub-amount">${src.amount.toFixed(2)}</span>
                    <span className="sub-cycle">{freqLabel[src.frequency]}</span>
                  </div>
                  {src.frequency !== 'monthly' && (
                    <div className="sub-monthly-equiv">{t('income.approxPerMonth', { n: monthly.toFixed(2) })}</div>
                  )}
                </div>

                <div className="income-freq-badge">
                  {t(`frequencies.${src.frequency}`)} · {t('income.recurring')}
                </div>

                {src.nextPaymentDate && (
                  <div className="sub-billing">
                    <span className="sub-billing-label">{t('income.nextPayment')}</span>
                    <div className="sub-billing-right">
                      <span className="sub-billing-date">
                        {new Date(src.nextPaymentDate + 'T12:00:00').toLocaleDateString(locale, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                      {isActive && <DaysChip days={daysUntil(src.nextPaymentDate)} />}
                    </div>
                  </div>
                )}

                <div className="sub-footer">
                  <label className="sub-toggle">
                    <input type="checkbox" checked={isActive} onChange={() => toggleActive(src)} />
                    {t('common.active')}
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal}
        title={editingSource ? t('income.editModal') : t('income.addModal')}>
        <IncomeForm source={editingSource} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
