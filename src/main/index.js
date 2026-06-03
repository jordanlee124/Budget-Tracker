import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

let dataFile

function loadData() {
  if (!existsSync(dataFile)) return { expenses: [], savingsGoals: [] }
  try {
    return JSON.parse(readFileSync(dataFile, 'utf-8'))
  } catch {
    return { expenses: [], savingsGoals: [] }
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

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
