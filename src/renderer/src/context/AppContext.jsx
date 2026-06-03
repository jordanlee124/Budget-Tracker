import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
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
    const entry = { id: generateId(), ...entryData, createdAt: new Date().toISOString() }
    const income = await window.api.income.add(entry)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function updateIncome(entry) {
    const income = await window.api.income.update(entry)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function deleteIncome(id) {
    const income = await window.api.income.delete(id)
    dispatch({ type: 'SET_INCOME', income })
  }

  async function addSubscription(subData) {
    const sub = { id: generateId(), ...subData, active: subData.active ?? true, createdAt: new Date().toISOString() }
    const subscriptions = await window.api.subscriptions.add(sub)
    dispatch({ type: 'SET_SUBSCRIPTIONS', subscriptions })
  }

  async function updateSubscription(sub) {
    const subscriptions = await window.api.subscriptions.update(sub)
    dispatch({ type: 'SET_SUBSCRIPTIONS', subscriptions })
  }

  async function deleteSubscription(id) {
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
