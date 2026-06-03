import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses from './components/Expenses'
import SavingsGoals from './components/SavingsGoals'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <AppProvider>
      <div className="app">
        <Sidebar page={page} setPage={setPage} />
        <main className="main-content">
          {page === 'dashboard' && <Dashboard />}
          {page === 'expenses' && <Expenses />}
          {page === 'goals' && <SavingsGoals />}
        </main>
      </div>
    </AppProvider>
  )
}
