import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

let dataFile

const MONTH_MAP = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }

const PDF_SKIP = [
  /^Account Number/, /^Page \d+/, /^Created /, /^While this/,
  /^we're not/, /^Transaction Summary/, /^Date\s+Transaction/, /^Amount\s+Balance/,
  /^Any pending/, /^If you have/, /^Kind regards/, /^The CommBank/,
  /^Dear /, /^Here's your/, /^Account name/, /^BSB\s/, /^Account number/,
  /^Account type/, /^Date opened/, /^\d{1,2} [A-Z][a-z]+ \d{4}$/, /^Balance$/
]

function parseCBATransactions(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(Boolean)
  const dateRe = /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})(.*)/i
  const amountRe = /(-?\$[\d,]+\.\d{2})\s+(-?\$[\d,]+\.\d{2})\s*$/

  // Group lines into transaction blocks
  const blocks = []
  let cur = null
  for (const line of lines) {
    if (PDF_SKIP.some(r => r.test(line))) continue
    const dm = line.match(dateRe)
    if (dm) {
      if (cur) blocks.push(cur)
      const date = `${dm[3]}-${MONTH_MAP[dm[2].toLowerCase()]}-${dm[1].padStart(2, '0')}`
      const rest = dm[4].trim()
      cur = { date, lines: rest ? [rest] : [] }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  if (cur) blocks.push(cur)

  const transactions = []
  for (const block of blocks) {
    let amountStr = null
    let descLines = []
    for (let i = block.lines.length - 1; i >= 0; i--) {
      const m = block.lines[i].match(amountRe)
      if (m) {
        amountStr = m[1]
        const beforeAmt = block.lines[i].replace(amountRe, '').trim()
        descLines = block.lines.slice(0, i)
        if (beforeAmt) descLines.push(beforeAmt)
        break
      }
    }
    if (!amountStr) continue
    const amount = parseFloat(amountStr.replace(/[$,]/g, ''))
    if (amount >= 0) continue // skip credits/income
    const desc = descLines
      .filter(l => !/^Card xx/i.test(l))
      .filter(l => !/^Value Date:/i.test(l))
      .join(' ').replace(/\s+/g, ' ').trim()
    if (!desc) continue
    transactions.push({ date: block.date, description: desc, amount: Math.abs(amount) })
  }
  return transactions
}

function loadData() {
  if (!existsSync(dataFile)) return { expenses: [], savingsGoals: [], subscriptions: [], income: [], monthlySnapshots: [] }
  try {
    const data = JSON.parse(readFileSync(dataFile, 'utf-8'))
    if (!data.subscriptions) data.subscriptions = []
    if (!data.income) data.income = []
    if (!data.monthlySnapshots) data.monthlySnapshots = []
    return data
  } catch {
    return { expenses: [], savingsGoals: [], subscriptions: [], income: [], monthlySnapshots: [] }
  }
}

function saveData(data) {
  writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8')
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  dataFile = join(app.getPath('userData'), 'data.json')

  ipcMain.handle('data:load', () => loadData())

  ipcMain.handle('expenses:add', (_, expense) => {
    const data = loadData()
    data.expenses.push(expense)
    saveData(data)
    return data.expenses
  })

  ipcMain.handle('expenses:update', (_, expense) => {
    const data = loadData()
    const idx = data.expenses.findIndex(e => e.id === expense.id)
    if (idx !== -1) data.expenses[idx] = expense
    saveData(data)
    return data.expenses
  })

  ipcMain.handle('expenses:delete', (_, id) => {
    const data = loadData()
    data.expenses = data.expenses.filter(e => e.id !== id)
    saveData(data)
    return data.expenses
  })

  ipcMain.handle('goals:add', (_, goal) => {
    const data = loadData()
    data.savingsGoals.push(goal)
    saveData(data)
    return data.savingsGoals
  })

  ipcMain.handle('goals:update', (_, goal) => {
    const data = loadData()
    const idx = data.savingsGoals.findIndex(g => g.id === goal.id)
    if (idx !== -1) data.savingsGoals[idx] = goal
    saveData(data)
    return data.savingsGoals
  })

  ipcMain.handle('goals:delete', (_, id) => {
    const data = loadData()
    data.savingsGoals = data.savingsGoals.filter(g => g.id !== id)
    saveData(data)
    return data.savingsGoals
  })

  ipcMain.handle('subscriptions:add', (_, sub) => {
    const data = loadData()
    data.subscriptions.push(sub)
    saveData(data)
    return data.subscriptions
  })

  ipcMain.handle('subscriptions:update', (_, sub) => {
    const data = loadData()
    const idx = data.subscriptions.findIndex(s => s.id === sub.id)
    if (idx !== -1) data.subscriptions[idx] = sub
    saveData(data)
    return data.subscriptions
  })

  ipcMain.handle('subscriptions:delete', (_, id) => {
    const data = loadData()
    data.subscriptions = data.subscriptions.filter(s => s.id !== id)
    saveData(data)
    return data.subscriptions
  })

  ipcMain.handle('income:add', (_, entry) => {
    const data = loadData()
    data.income.push(entry)
    saveData(data)
    return data.income
  })

  ipcMain.handle('income:update', (_, entry) => {
    const data = loadData()
    const idx = data.income.findIndex(i => i.id === entry.id)
    if (idx !== -1) data.income[idx] = entry
    saveData(data)
    return data.income
  })

  ipcMain.handle('income:delete', (_, id) => {
    const data = loadData()
    data.income = data.income.filter(i => i.id !== id)
    saveData(data)
    return data.income
  })

  ipcMain.handle('pdf:parse', async (_, arrayBuffer) => {
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdfParse(buffer)
    return parseCBATransactions(data.text)
  })
  // Note: errors from the above are propagated automatically by ipcMain.handle to the renderer's invoke promise

  ipcMain.handle('data:reset', () => {
    const empty = { expenses: [], savingsGoals: [], subscriptions: [], income: [], monthlySnapshots: [] }
    saveData(empty)
    return empty
  })

  ipcMain.handle('snapshots:save', (_, snapshot) => {
    const data = loadData()
    const exists = data.monthlySnapshots.some(s => s.month === snapshot.month)
    if (!exists) {
      data.monthlySnapshots.push(snapshot)
      saveData(data)
    }
    return data.monthlySnapshots
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
