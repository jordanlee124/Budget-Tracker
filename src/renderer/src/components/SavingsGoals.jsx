import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'

const GOAL_COLORS = ['#7c5cbf', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#f97316']

function GoalForm({ goal, onSave, onCancel }) {
  const [form, setForm] = useState(() => goal
    ? { ...goal, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount) }
    : { name: '', targetAmount: '', currentAmount: '', deadline: '', color: GOAL_COLORS[0] }
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Goal Name</label>
        <input type="text" className="form-input" placeholder="e.g. Emergency Fund"
          value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Target Amount ($)</label>
          <input type="number" className="form-input" placeholder="5000"
            min="1" step="0.01" value={form.targetAmount}
            onChange={e => set('targetAmount', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Current Savings ($)</label>
          <input type="number" className="form-input" placeholder="0"
            min="0" step="0.01" value={form.currentAmount}
            onChange={e => set('currentAmount', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Target Date (optional)</label>
        <input type="date" className="form-input" value={form.deadline}
          onChange={e => set('deadline', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <div className="color-picker">
          {GOAL_COLORS.map(color => (
            <button key={color} type="button"
              className={`color-swatch ${form.color === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => set('color', color)}
            />
          ))}
        </div>
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          {goal ? 'Update Goal' : 'Add Goal'}
        </button>
      </div>
    </form>
  )
}

function ContributionForm({ goal, onSave, onCancel }) {
  const [amount, setAmount] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (val > 0) onSave(val)
  }

  const remaining = goal.targetAmount - goal.currentAmount

  return (
    <form onSubmit={handleSubmit}>
      <div className="contribution-current">
        <div className="contribution-goal-name">{goal.name}</div>
        <div className="contribution-amount">${goal.currentAmount.toFixed(2)}</div>
        <div className="contribution-target">
          of ${goal.targetAmount.toFixed(2)} goal
          {remaining > 0 && ` · $${remaining.toFixed(2)} remaining`}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Contribution Amount ($)</label>
        <input type="number" className="form-input" placeholder="0.00"
          min="0.01" step="0.01" value={amount}
          onChange={e => setAmount(e.target.value)} required autoFocus />
      </div>
      <div className="form-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Add Contribution</button>
      </div>
    </form>
  )
}

export default function SavingsGoals() {
  const { savingsGoals, addGoal, updateGoal, deleteGoal, addContribution, loading } = useApp()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [contributingGoal, setContributingGoal] = useState(null)

  function handleSaveGoal(formData) {
    if (editingGoal) {
      updateGoal({ ...editingGoal, ...formData })
    } else {
      addGoal(formData)
    }
    closeGoalModal()
  }

  function handleContribute(amount) {
    addContribution(contributingGoal.id, amount)
    setContributingGoal(null)
  }

  function closeGoalModal() {
    setShowGoalModal(false)
    setEditingGoal(null)
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Savings Goals</h1>
        <button className="btn btn-primary" onClick={() => setShowGoalModal(true)}>
          + Add Goal
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            No savings goals yet.<br />Click '+ Add Goal' to set up your first goal.
          </p>
        </div>
      ) : (
        <div className="goals-grid">
          {savingsGoals.map(goal => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const completed = goal.currentAmount >= goal.targetAmount

            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-card-header">
                  <div>
                    <div className="goal-card-title">{goal.name}</div>
                    {goal.deadline && (
                      <div className="goal-card-deadline">
                        By {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('default', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                  <div className="goal-card-actions">
                    {completed && <span className="badge-completed">✓ Done</span>}
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingGoal(goal); setShowGoalModal(true) }}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => deleteGoal(goal.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <div className="goal-current">${goal.currentAmount.toFixed(2)}</div>
                  <div className="goal-target">of ${goal.targetAmount.toFixed(2)} goal</div>
                </div>

                <div>
                  <div className="goal-progress-bar">
                    <div className="goal-progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: completed ? '#22c55e' : (goal.color || '#7c5cbf')
                      }}
                    />
                  </div>
                  <div className="goal-progress-footer">
                    <span>{pct.toFixed(0)}% complete</span>
                    {!completed && <span>${(goal.targetAmount - goal.currentAmount).toFixed(2)} left</span>}
                  </div>
                </div>

                {!completed && (
                  <button className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setContributingGoal(goal)}>
                    + Add Contribution
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showGoalModal} onClose={closeGoalModal}
        title={editingGoal ? 'Edit Goal' : 'New Savings Goal'}>
        <GoalForm goal={editingGoal} onSave={handleSaveGoal} onCancel={closeGoalModal} />
      </Modal>

      <Modal isOpen={!!contributingGoal} onClose={() => setContributingGoal(null)}
        title="Add Contribution">
        {contributingGoal && (
          <ContributionForm goal={contributingGoal} onSave={handleContribute}
            onCancel={() => setContributingGoal(null)} />
        )}
      </Modal>
    </div>
  )
}
