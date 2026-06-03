import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  expenses: {
    add: (expense) => ipcRenderer.invoke('expenses:add', expense),
    update: (expense) => ipcRenderer.invoke('expenses:update', expense),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id)
  },
  goals: {
    add: (goal) => ipcRenderer.invoke('goals:add', goal),
    update: (goal) => ipcRenderer.invoke('goals:update', goal),
    delete: (id) => ipcRenderer.invoke('goals:delete', id)
  }
})
