import { useState } from 'react'
import { useTranslation } from '../i18n'
import { useApp } from '../context/AppContext'

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="6" height="6" rx="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5"/>
  </svg>
)

const ExpensesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4.5 8h7M4.5 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const GoalsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="8" r="1.25" fill="currentColor"/>
  </svg>
)

const IncomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2v12M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const SubscriptionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4.5C2 3.67 2.67 3 3.5 3h9C13.33 3 14 3.67 14 4.5v7c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="5" cy="10" r="1" fill="currentColor"/>
    <circle cx="8" cy="10" r="1" fill="currentColor"/>
  </svg>
)

const navItems = [
  { id: 'dashboard', labelKey: 'nav.dashboard', Icon: DashboardIcon },
  { id: 'income', labelKey: 'nav.income', Icon: IncomeIcon },
  { id: 'expenses', labelKey: 'nav.expenses', Icon: ExpensesIcon },
  { id: 'subscriptions', labelKey: 'nav.subscriptions', Icon: SubscriptionsIcon },
  { id: 'goals', labelKey: 'nav.savingsGoals', Icon: GoalsIcon }
]

export default function Sidebar({ page, setPage }) {
  const { lang, setLanguage, t } = useTranslation()
  const { resetData } = useApp()
  const [confirming, setConfirming] = useState(false)

  function handleReset() {
    if (!confirming) { setConfirming(true); return }
    resetData()
    setConfirming(false)
    setPage('dashboard')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-icon">💰</span>
        <span className="logo-text">{t('nav.appName')}</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <span className="nav-icon"><Icon /></span>
            {t(labelKey)}
          </button>
        ))}
      </nav>
      <div className="sidebar-reset">
        {confirming ? (
          <>
            <span className="reset-confirm-text">Sure?</span>
            <button className="reset-btn reset-btn-confirm" onClick={handleReset}>Yes, reset</button>
            <button className="reset-btn" onClick={() => setConfirming(false)}>No</button>
          </>
        ) : (
          <button className="reset-btn reset-btn-full" onClick={handleReset}>Reset data</button>
        )}
      </div>
      <div className="sidebar-lang">
        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
        <button className={`lang-btn ${lang === 'ko' ? 'active' : ''}`} onClick={() => setLanguage('ko')}>한국어</button>
      </div>
    </aside>
  )
}
