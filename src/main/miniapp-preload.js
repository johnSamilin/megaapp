const { contextBridge, ipcRenderer } = require('electron');

// Preload script for miniapps
contextBridge.exposeInMainWorld('miniAppAPI', {
  // Access to shared tags
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (tagData) => ipcRenderer.invoke('tags:create', tagData)
  },

  // MiniApp utilities
  utils: {
    showNotification: (title, body) => {
      new Notification(title, { body });
    },
    
    getAppInfo: () => ({
      platform: process.platform,
      version: process.versions.electron
    })
  }
});