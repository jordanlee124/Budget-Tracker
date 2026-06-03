import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Mirrors the calculation logic in the components so AppContext can snapshot
// current-month totals before any subscription or income mutation.
function _countOccurrences(dateStr, periodDays, year, month) {
  const monthStart = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const ref = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((ref - monthStart) / 86400000)
  const offset = ((diffDays % periodDays) + periodDays) % periodDays
  let count = 0
  for (let day = offset; day < daysInMonth; day += periodDays) count++
  return count
}

function _subCostForMonth(sub, year, month) {
  if (!sub.active) return 0
  if (sub.billingCycle === 'daily') return sub.amount * new Date(year, month + 1, 0).getDate()
  if (sub.billingCycle === 'monthly') return sub.amount
  if (!sub.nextBillingDate) {
    if (sub.billingCycle === 'quarterly') return sub.amount / 3
    if (sub.billingCycle === 'yearly') return sub.amount / 12
    return sub.amount * 52 / 12
  }
  if (sub.billingCycle === 'weekly') return sub.amount * _countOccurrences(sub.nextBillingDate, 7, year, month)
  const ref = new Date(sub.nextBillingDate + 'T00:00:00')
  const periodMonths = sub.billingCycle === 'yearly' ? 12 : 3
  const monthDiff = (year - ref.getFullYear()) * 12 + (month - ref.getMonth())
  return monthDiff % periodMonths === 0 ? sub.amount : 0
}

function _incomeForMonth(source, year, month) {
  if (source.type === 'one-off') {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    return source.date?.startsWith(monthStr) ? source.amount : 0
  }
  if (source.active === false) return 0
  if (source.frequency === 'monthly') return source.amount
  const period = source.frequency === 'weekly' ? 7 : 14
  if (source.nextPaymentDate) return source.amount * _countOccurrences(source.nextPaymentDate, period, year, month)
  return source.amount * (period === 7 ? 52 : 26) / 12
}

const initialState = {
  expenses: [],
  savingsGoals: [],
  subscriptions: [],
  income: [],
  monthlySnapshots: [],
  loading: true
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, expenses: action.expenses, savingsGoals: action.savingsGoals, subscriptions: action.subscriptions, income: action.income, monthlySnapshots: action.monthlySnapshots, loading: false }
    case 'SET_EXPENSES':
      return { ...state, expenses: action.expenses }
    case 'SET_GOALS':
      return { ...state, savingsGoals: action.savingsGoals }
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.subscriptions }
    case 'SET_INCOME':
      return { ...state, income: action.income }
    case 'SET_SNAPSHOTS':
      return { ...state, monthlySnapshots: action.monthlySnapshots }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    window.api.loadData().then(data => {
      dispatch({ type: 'LOAD_DATA', expenses: data.expenses, savingsGoals: data.savingsGoals, subscriptions: data.subscriptions, income: data.income, monthlySnapshots: data.monthlySnapshots })
    })
  }, [])

  async function ensureCurrentMonthSnapshot(subs, inc) {
    const now = new Date()
    const yr = now.getFullYear()
    const mo = now.getMonth()
    const monthStr = `${yr}-${String(mo + 1).padStart(2, '0')}`
    if ((state.monthlySnapshots || []).some(s => s.month === monthStr)) return
    const totalSubscriptions = subs.reduce((sum, s) => sum + _subCostForMonth(s, yr, mo), 0)
    const totalIncome = inc.reduce((sum, i) => sum + _incomeForMonth(i, yr, mo), 0)
    const snapshots = await window.api.snapshots.save({
      month: monthStr, totalIncome, totalSubscriptions,
      snapshotDate: now.toISOString().split('T')[0]
    })
    dispatch({ type: 'SET_SNAPSHOTS', monthlySnapshots: snapshots })
  }

  async function addExpense(expenseData) {
    const expense = { id: generateId(), ...expenseData, createdAt: new Date().toISOString() }
    const expenses = await window.api.expenses.add(expense)
    dispatch({ type: 'SET_EXPENSES', expenses })
  }

  async function updateExpense(expense) {
    const expenses = await window.api.expenses.update(expense)
    dispatch({ type: 'SET_EXPENSES', expenses })
  }

  async function deleteExpense(id) {
    const expenses = await window.api.expenses.delete(id)
    dispatch({ type: 'SET_EXPENSES', expenses })
  }

  async function addGoal(goalData) {
    const goal = {
      id: generateId(),
      ...goalData,
      currentAmount: goalData.currentAmount || 0,
      createdAt: new Date().toISOString()
    }
    const savingsGoals = await window.api.goals.add(goal)
    dispatch({ type: 'SET_GOALS', savingsGoals })
  }

  async function updateGoal(goal) {
    const savingsGoals = await window.api.goals.update(goal)
    dispatch({ type: 'SET_GOALS', savingsGoals })
  }

  async function deleteGoal(id) {
    const savingsGoals = await window.api.goals.delete(id)
    dispatch({ type: 'SET_GOALS', savingsGoals })
  }

  async function addContribution(goalId, amount) {
    const goal = state.savingsGoals.find(g => g.id === goalId)
    if (!goal) return
    await updateGoal({ ...goal, currentAmount: goal.currentAmount + amount })
  }

  async function addIncome(entryData) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const entry = { id: generateId(), ...entryData, createdAt: new Date().toISOString() }
    const income = await window.api.income.add(entry)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function updateIncome(entry) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const income = await window.api.income.update(entry)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function deleteIncome(id) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const income = await window.api.income.delete(id)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function addSubscription(subData) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const sub = { id: generateId(), ...subData, active: subData.active ?? true, createdAt: new Date().toISOString() }
    const subscriptions = await window.api.subscriptions.add(sub)
    dispatch({ type: 'SET_SUBSCRIPTIONS', subscriptions })
  }

  async function updateSubscription(sub) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const subscriptions = await window.api.subscriptions.update(sub)
    dispatch({ type: 'SET_SUBSCRIPTIONS', subscriptions })
  }

  async function deleteSubscription(id) {
    await ensureCurrentMonthSnapshot(state.subscriptions, state.income)
    const subscriptions = await window.api.subscriptions.delete(id)
    dispatch({ type: 'SET_SUBSCRIPTIONS', subscriptions })
  }

  async function resetData() {
    const data = await window.api.resetData()
    dispatch({ type: 'LOAD_DATA', expenses: data.expenses, savingsGoals: data.savingsGoals, subscriptions: data.subscriptions, income: data.income, monthlySnapshots: data.monthlySnapshots })
  }

  async function saveMonthSnapshot(month, totalIncome, totalSubscriptions) {
    const snapshot = { month, totalIncome, totalSubscriptions, snapshotDate: new Date().toISOString().split('T')[0] }
    const monthlySnapshots = await window.api.snapshots.save(snapshot)
    dispatch({ type: 'SET_SNAPSHOTS', monthlySnapshots })
  }

  return (
    <AppContext.Provider value={{
      ...state,
      addExpense,
      updateExpense,
      deleteExpense,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      addIncome,
      updateIncome,
      deleteIncome,
      saveMonthSnapshot,
      resetData
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
