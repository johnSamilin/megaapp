const { contextBridge, ipcRenderer } = require('electron');

// Get the miniapp ID from the window location or a global variable
// This will be set by the main process when launching the miniapp
let currentMiniAppId = null;

// Listen for miniapp ID from main process
window.addEventListener('DOMContentLoaded', () => {
  // The miniapp ID will be injected by the main process
  currentMiniAppId = window.__MINIAPP_ID__ || 'unknown';
});

// Preload script for miniapps
contextBridge.exposeInMainWorld('miniAppAPI', {
  // Access to shared tags
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (tagData) => ipcRenderer.invoke('tags:create', tagData)
  },

  // Data storage API - similar to IndexedDB
  storage: {
    // Store data with a key
    setItem: (key, data) => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:store', currentMiniAppId, key, data);
    },

    // Get data by key
    getItem: (key) => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:get', currentMiniAppId, key);
    },

    // Get all keys
    getAllKeys: () => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:getAllKeys', currentMiniAppId);
    },

    // Get all data
    getAllData: () => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:getAllData', currentMiniAppId);
    },

    // Remove data by key
    removeItem: (key) => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:delete', currentMiniAppId, key);
    },

    // Clear all data
    clear: () => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:clear', currentMiniAppId);
    },

    // Check if key exists
    hasItem: (key) => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:has', currentMiniAppId, key);
    },

    // Get storage information
    getStorageInfo: () => {
      if (!currentMiniAppId) throw new Error('MiniApp ID not available');
      return ipcRenderer.invoke('data:getStorageInfo', currentMiniAppId);
    }
  },

  // MiniApp utilities
  utils: {
    showNotification: (title, body) => {
      new Notification(title, { body });
    },
    
    getAppInfo: () => ({
      platform: process.platform,
      version: process.versions.electron
    }),

    // Get current miniapp ID
    getMiniAppId: () => currentMiniAppId
  }
});