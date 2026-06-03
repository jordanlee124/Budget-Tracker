# Budget Tracker

A personal budgeting desktop app built with Electron + React. Track your expenses, subscriptions, income, and savings goals — with direct import support for Australian bank exports.

---

## Download

Grab the latest release from the [Releases page](https://github.com/jordanlee124/Budget-Tracker/releases):

**Windows**
- **Budget Tracker Setup.exe** — standard installer
- **Budget Tracker Portable.exe** — single file, no installation required

**macOS**
- **Budget-Tracker-x.x.x-arm64.dmg** — Apple Silicon (M1/M2/M3)
- **Budget-Tracker-x.x.x-arm64-mac.zip** — zip alternative

> **Windows:** SmartScreen may warn on first run — click **More info → Run anyway** (app is unsigned).

> **macOS — "damaged and can't be opened" error:** This is a Gatekeeper restriction on unsigned apps. After dragging the app to Applications, open Terminal and run:
> ```bash
> xattr -cr "/Applications/Budget Tracker.app"
> ```
> Then open the app normally. This is a one-time step.

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
| Build tooling | [electron-vite](https://electron-vite.org/) 2 + [electron-builder](https://www.electron.build/) 24 |
| Persistence | Local JSON file via Node.js `fs` |
| PDF parsing | [pdf-parse](https://www.npmjs.com/package/pdf-parse) 1.1.1 |
| Icon generation | [sharp](https://sharp.pixelplumbing.com/) + [png-to-ico](https://www.npmjs.com/package/png-to-ico) |

---

## Getting Started (development)

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
git clone https://github.com/jordanlee124/Budget-Tracker.git
cd Budget-Tracker
npm install
npm run dev
```

### Build scripts

```bash
# Development
npm run dev              # start with hot reload

# Production builds
npm run build:win        # installer + portable exe
npm run build:win:portable  # portable exe only

# Icon generation (run once after cloning, CI does this automatically)
node scripts/generate-icons.mjs
```

---

## Releasing a New Version

Releases are published automatically via GitHub Actions when a version tag is pushed:

```bash
git tag v1.0.1
git push origin v1.0.1
```

The workflow builds both the installer and portable exe, then attaches them to a GitHub Release. No manual steps needed.

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

All data is saved locally — no accounts, no cloud sync:

```
Windows: %APPDATA%\budgeting-app\data.json
```

To reset all data go to **Sidebar → Reset data**, or delete the file manually and restart the app.

---

## License

MIT
