import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  resetData: () => ipcRenderer.invoke('data:reset'),
  expenses: {
    add: (expense) => ipcRenderer.invoke('expenses:add', expense),
    update: (expense) => ipcRenderer.invoke('expenses:update', expense),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id)
  },
  goals: {
    add: (goal) => ipcRenderer.invoke('goals:add', goal),
    update: (goal) => ipcRenderer.invoke('goals:update', goal),
    delete: (id) => ipcRenderer.invoke('goals:delete', id)
  },
  subscriptions: {
    add: (sub) => ipcRenderer.invoke('subscriptions:add', sub),
    update: (sub) => ipcRenderer.invoke('subscriptions:update', sub),
    delete: (id) => ipcRenderer.invoke('subscriptions:delete', id)
  },
  income: {
    add: (entry) => ipcRenderer.invoke('income:add', entry),
    update: (entry) => ipcRenderer.invoke('income:update', entry),
    delete: (id) => ipcRenderer.invoke('income:delete', id)
  },
  snapshots: {
    save: (snapshot) => ipcRenderer.invoke('snapshots:save', snapshot)
  },
  parsePdf: (arrayBuffer) => ipcRenderer.invoke('pdf:parse', arrayBuffer)
})
