const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Tag operations
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (tagData) => ipcRenderer.invoke('tags:create', tagData),
    update: (id, tagData) => ipcRenderer.invoke('tags:update', id, tagData),
    delete: (id) => ipcRenderer.invoke('tags:delete', id)
  },

  // MiniApp operations
  miniApps: {
    getAll: () => ipcRenderer.invoke('miniapps:getAll'),
    launch: (miniAppId) => ipcRenderer.invoke('miniapps:launch', miniAppId),
    install: (miniAppPath) => ipcRenderer.invoke('miniapps:install', miniAppPath),
    getTags: (miniAppId) => ipcRenderer.invoke('miniapps:getTags', miniAppId),
    importTags: (miniAppId, tags) => ipcRenderer.invoke('miniapps:importTags', miniAppId, tags),
    readFile: (filePath) => ipcRenderer.invoke('miniapps:readFile', filePath),
    storage: {
      setItem: (miniAppId, key, data) => ipcRenderer.invoke('data:store', miniAppId, key, data),
      getItem: (miniAppId, key) => ipcRenderer.invoke('data:get', miniAppId, key),
      getAllKeys: (miniAppId) => ipcRenderer.invoke('data:getAllKeys', miniAppId),
      getAllData: (miniAppId) => ipcRenderer.invoke('data:getAllData', miniAppId),
      removeItem: (miniAppId, key) => ipcRenderer.invoke('data:delete', miniAppId, key),
      clear: (miniAppId) => ipcRenderer.invoke('data:clear', miniAppId),
      hasItem: (miniAppId, key) => ipcRenderer.invoke('data:has', miniAppId, key),
      getStorageInfo: (miniAppId) => ipcRenderer.invoke('data:getStorageInfo', miniAppId)
    }
  },

  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:install-miniapp', callback);
  },

  // Encryption management
  encryption: {
    getStatus: () => ipcRenderer.invoke('encryption:getStatus'),
    setMasterPassword: (password) => ipcRenderer.invoke('encryption:setMasterPassword', password),
    verifyMasterPassword: (password) => ipcRenderer.invoke('encryption:verifyMasterPassword', password),
    setEnabled: (enabled) => ipcRenderer.invoke('encryption:setEnabled', enabled),
    changeMasterPassword: (oldPassword, newPassword) => ipcRenderer.invoke('encryption:changeMasterPassword', oldPassword, newPassword),
    removeMasterPassword: () => ipcRenderer.invoke('encryption:removeMasterPassword')
  }
});