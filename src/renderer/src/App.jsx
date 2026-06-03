import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { LanguageProvider } from './i18n'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses from './components/Expenses'
import SavingsGoals from './components/SavingsGoals'
import Subscriptions from './components/Subscriptions'
import Income from './components/Income'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <LanguageProvider>
    <AppProvider>
      <div className="app">
        <Sidebar page={page} setPage={setPage} />
        <main className="main-content">
          {page === 'dashboard' && <Dashboard />}
          {page === 'income' && <Income />}
          {page === 'expenses' && <Expenses />}
          {page === 'subscriptions' && <Subscriptions />}
          {page === 'goals' && <SavingsGoals />}
        </main>
      </div>
    </AppProvider>
    </LanguageProvider>
  )
}
