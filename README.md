# Budget Tracker

A personal budgeting desktop app built with Electron + React. Track your expenses, subscriptions, income, and savings goals — with direct import support for Australian bank exports.

---

## Features

### Dashboard
- Monthly budget overview with income, expenses, and subscriptions
- Stacked budget bar showing how much of your income is spent
- Category breakdown and recent transactions at a glance
- Navigate forward and backward through months
- Past months are **frozen as snapshots** so changing your income or subscriptions never retroactively alters history

### Expenses
- Add, edit, and delete expense entries
- Filter by category and month
- **Import from CSV** — supports CBA, ANZ, NAB, Westpac, Up Bank, and most Australian banks
- **Import from PDF** — supports CommBank Transaction Summary PDFs
- Automatic duplicate detection on import (already-imported rows are pre-deselected)
- Auto-categorisation based on merchant name keywords

### Subscriptions
- Track recurring expenses (weekly / monthly / quarterly / yearly)
- Days-until-renewal chip with urgency colour coding
- Mark as paid to advance to the next billing cycle
- Monthly and yearly cost summaries

### Income
- Recurring income sources (weekly / fortnightly / monthly)
- Per-source active/inactive toggle to pause without deleting
- Optional next payment date with countdown chip

### Savings Goals
- Set a target amount, colour, and optional deadline
- Progress bar with percentage complete
- Add contributions at any time

### Other
- 🌐 **English / Korean** language toggle (persists across restarts)
- 🔄 **Reset data** button in the sidebar (with confirmation step)
- All data stored locally in a JSON file — no accounts, no cloud

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) 31 |
| Frontend | [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 5 |
| Build tooling | [electron-vite](https://electron-vite.org/) 2 |
| Persistence | Local JSON file via Node.js `fs` |
| PDF parsing | [pdf-parse](https://www.npmjs.com/package/pdf-parse) 1.1.1 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
git clone https://github.com/YOUR_USERNAME/budgeting-app.git
cd budgeting-app
npm install
npm run dev
```

### Build

```bash
# Windows installer
npm run build:win
```

---

## Importing Bank Transactions

### CSV (all banks)
1. Log in to your bank's online portal and export transactions as CSV
2. In the app go to **Expenses → Import CSV**
3. Select the file — columns are auto-detected for most Australian banks
4. Review the preview, adjust categories if needed, then import

Supported date formats: `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, `DD MMM YYYY`, `DD MMM YY`

### PDF (CommBank only)
1. In NetBank or the CommBank app, download a **Transaction Summary** PDF
2. In the app go to **Expenses → Import PDF**
3. Select the PDF — transactions are extracted automatically
4. Review, filter by month/category/description, then import

---

## Data Storage

All data is saved to:

```
Windows: %APPDATA%\budgeting-app\data.json
```

To reset all data go to **Sidebar → Reset data**, or delete the file manually and restart the app.

---

## License

MIT
