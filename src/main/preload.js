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
    importTags: (miniAppId, tags) => ipcRenderer.invoke('miniapps:importTags', miniAppId, tags)
  },

  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:install-miniapp', callback);
  }
});