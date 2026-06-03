import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const initialState = {
  expenses: [],
  savingsGoals: [],
  loading: true
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, expenses: action.expenses, savingsGoals: action.savingsGoals, loading: false }
    case 'SET_EXPENSES':
      return { ...state, expenses: action.expenses }
    case 'SET_GOALS':
      return { ...state, savingsGoals: action.savingsGoals }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    window.api.loadData().then(data => {
      dispatch({ type: 'LOAD_DATA', expenses: data.expenses, savingsGoals: data.savingsGoals })
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

  return (
    <AppContext.Provider value={{
      ...state,
      addExpense,
      updateExpense,
      deleteExpense,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
