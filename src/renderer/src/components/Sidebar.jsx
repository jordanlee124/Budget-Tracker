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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { id: 'expenses', label: 'Expenses', Icon: ExpensesIcon },
  { id: 'goals', label: 'Savings Goals', Icon: GoalsIcon }
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-icon">💰</span>
        <span className="logo-text">Budget Tracker</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <span className="nav-icon"><Icon /></span>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
