import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import CsvImport from './CsvImport'
import PdfImport from './PdfImport'
import { useTranslation } from '../i18n'

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Housing', 'Entertainment',
  'Healthcare', 'Shopping', 'Education', 'Other'
]

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

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function ExpenseForm({ expense, onSave, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => expense
    ? { ...expense, amount: String(expense.amount) }
    : { date: getToday(), amount: '', category: 'Food & Dining', description: '', note: '' }
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('common.date')}</label>
          <input type="date" className="form-input" value={form.date}
            onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">{t('common.amount')}</label>
          <input type="number" className="form-input" placeholder="0.00"
            step="0.01" min="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('common.description')}</label>
        <input type="text" className="form-input" placeholder={t('expenses.descriptionPlaceholder')}
          value={form.description} onChange={e => set('description', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">{t('common.category')}</label>
        <select className="form-select" value={form.category}
          onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">{t('expenses.noteLabel')}</label>
        <input type="text" className="form-input" placeholder={t('expenses.notePlaceholder')}
          value={form.note} onChange={e => set('note', e.target.value)} />
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn btn-primary">
          {expense ? t('expenses.submitEdit') : t('expenses.submitAdd')}
        </button>
      </div>
    </form>
  )
}

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, loading } = useApp()
  const { t, lang } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [showPdfImport, setShowPdfImport] = useState(false)
  const [importedCount, setImportedCount] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const months = useMemo(() => {
    const set = new Set(expenses.map(e => e.date.substring(0, 7)))
    return ['All', ...Array.from(set).sort().reverse()]
  }, [expenses])

  const filtered = useMemo(() => expenses
    .filter(e => categoryFilter === 'All' || e.category === categoryFilter)
    .filter(e => monthFilter === 'All' || e.date.startsWith(monthFilter))
    .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt)),
    [expenses, categoryFilter, monthFilter]
  )

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleSave(formData) {
    if (editingExpense) {
      updateExpense({ ...editingExpense, ...formData })
    } else {
      addExpense(formData)
    }
    closeModal()
  }

  function handleEdit(expense) {
    setEditingExpense(expense)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingExpense(null)
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  const importSuccessMsg = lang === 'ko'
    ? t('expenses.importSuccess', { n: importedCount })
    : t('expenses.importSuccess', { n: importedCount, s: importedCount !== 1 ? 's' : '' })

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('expenses.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => { setImportedCount(null); setShowPdfImport(true) }}>
            Import PDF
          </button>
          <button className="btn btn-ghost" onClick={() => { setImportedCount(null); setShowCsvImport(true) }}>
            {t('expenses.importCsv')}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            {t('expenses.addBtn')}
          </button>
        </div>
      </div>

      {importedCount !== null && (
        <div className="import-success-banner">
          {importSuccessMsg}
          <button onClick={() => setImportedCount(null)}>×</button>
        </div>
      )}

      <div className="card">
        <div className="expenses-toolbar">
          <div className="filters">
            <select className="select-filter" value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">{t('expenses.allCategories')}</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
            </select>
            <select className="select-filter" value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}>
              {months.map(m => (
                <option key={m} value={m}>
                  {m === 'All' ? t('expenses.allTime') : new Date(m + '-15').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          {filtered.length > 0 && (
            <div className="total-label">
              {filtered.length} · Total: <strong>${totalFiltered.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">
            {expenses.length === 0 ? t('expenses.noExpenses') : t('expenses.noExpensesFilter')}
          </p>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.description')}</th>
                <th>{t('common.category')}</th>
                <th>{t('common.note')}</th>
                <th>{t('common.amount')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(expense => (
                <tr key={expense.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{expense.date}</td>
                  <td style={{ fontWeight: 500 }}>{expense.description}</td>
                  <td>
                    <span className="category-badge">
                      <span className="category-dot"
                        style={{ background: CATEGORY_COLORS[expense.category] || '#94a3b8' }} />
                      {t(`categories.${expense.category}`)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{expense.note || '—'}</td>
                  <td className="amount-cell">-${expense.amount.toFixed(2)}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(expense)}>{t('common.edit')}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteExpense(expense.id)}>{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={closeModal}
        title={editingExpense ? t('expenses.editModal') : t('expenses.addModal')}>
        <ExpenseForm expense={editingExpense} onSave={handleSave} onCancel={closeModal} />
      </Modal>

      <Modal isOpen={showPdfImport} onClose={() => setShowPdfImport(false)}
        title="Import from PDF" size="large">
        <PdfImport onClose={(count) => {
          setShowPdfImport(false)
          if (count > 0) setImportedCount(count)
        }} />
      </Modal>

      <Modal isOpen={showCsvImport} onClose={() => setShowCsvImport(false)}
        title={t('csv.title')} size="large">
        <CsvImport onClose={(count) => {
          setShowCsvImport(false)
          if (count > 0) setImportedCount(count)
        }} />
      </Modal>
    </div>
  )
}
