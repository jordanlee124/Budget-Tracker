import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'

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
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date}
            onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Amount ($)</label>
          <input type="number" className="form-input" placeholder="0.00"
            step="0.01" min="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <input type="text" className="form-input" placeholder="e.g. Grocery shopping"
          value={form.description} onChange={e => set('description', e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Category</label>
        <select className="form-select" value={form.category}
          onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Note (optional)</label>
        <input type="text" className="form-input" placeholder="Any additional notes…"
          value={form.note} onChange={e => set('note', e.target.value)} />
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          {expense ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, loading } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState('All')

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

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Expense
        </button>
      </div>

      <div className="card">
        <div className="expenses-toolbar">
          <div className="filters">
            <select className="select-filter" value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select-filter" value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}>
              {months.map(m => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Time' : new Date(m + '-15').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          {filtered.length > 0 && (
            <div className="total-label">
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · Total: <strong>${totalFiltered.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">
            {expenses.length === 0
              ? "No expenses yet.\nClick '+ Add Expense' to get started."
              : 'No expenses match your filters.'}
          </p>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
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
                      {expense.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{expense.note || '—'}</td>
                  <td className="amount-cell">-${expense.amount.toFixed(2)}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(expense)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteExpense(expense.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={closeModal}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm expense={editingExpense} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
