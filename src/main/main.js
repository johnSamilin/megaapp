const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { DatabaseManager } = require('./database');
const { MiniAppManager } = require('./miniapp-manager');
const { DataManager } = require('./data-manager');
const { EncryptionManager } = require('./encryption-manager');

class SuperApp {
  constructor() {
    this.mainWindow = null;
    this.dbManager = new DatabaseManager();
    this.miniAppManager = new MiniAppManager();
    this.dataManager = new DataManager();
    this.encryptionManager = new EncryptionManager();
    this.isDev = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    await this.dbManager.initialize();
    await this.dataManager.initialize();
    await this.miniAppManager.initialize();
    this.setupIPC();
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    // Load the renderer
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupIPC() {
    // Tag management
    ipcMain.handle('tags:getAll', async () => {
      return await this.dbManager.getAllTags();
    });

    ipcMain.handle('tags:create', async (event, tagData) => {
      return await this.dbManager.createTag(tagData);
    });

    ipcMain.handle('tags:update', async (event, id, tagData) => {
      return await this.dbManager.updateTag(id, tagData);
    });

    ipcMain.handle('tags:delete', async (event, id) => {
      return await this.dbManager.deleteTag(id);
    });

    // MiniApp management
    ipcMain.handle('miniapps:getAll', async () => {
      return await this.miniAppManager.getAllMiniApps();
    });

    ipcMain.handle('miniapps:launch', async (event, miniAppId) => {
      return await this.miniAppManager.launchMiniApp(miniAppId);
    });

    ipcMain.handle('miniapps:install', async (event, miniAppPath) => {
      return await this.miniAppManager.installMiniApp(miniAppPath);
    });

    // Tag import from miniapps
    ipcMain.handle('miniapps:getTags', async (event, miniAppId) => {
      return await this.miniAppManager.getMiniAppTags(miniAppId);
    });

    ipcMain.handle('miniapps:importTags', async (event, miniAppId, tags) => {
      return await this.importTagsFromMiniApp(miniAppId, tags);
    });

    // Data storage API
    ipcMain.handle('data:store', async (event, miniAppId, key, data) => {
      return await this.dataManager.storeData(miniAppId, key, data);
    });

    ipcMain.handle('data:get', async (event, miniAppId, key) => {
      return await this.dataManager.getData(miniAppId, key);
    });

    ipcMain.handle('data:getAllKeys', async (event, miniAppId) => {
      return await this.dataManager.getAllKeys(miniAppId);
    });

    ipcMain.handle('data:getAllData', async (event, miniAppId) => {
      return await this.dataManager.getAllData(miniAppId);
    });

    ipcMain.handle('data:delete', async (event, miniAppId, key) => {
      return await this.dataManager.deleteData(miniAppId, key);
    });

    ipcMain.handle('data:clear', async (event, miniAppId) => {
      return await this.dataManager.clearAllData(miniAppId);
    });

    ipcMain.handle('data:has', async (event, miniAppId, key) => {
      return await this.dataManager.hasData(miniAppId, key);
    });

    ipcMain.handle('data:getStorageInfo', async (event, miniAppId) => {
      return await this.dataManager.getStorageInfo(miniAppId);
    });

    // Encryption management
    ipcMain.handle('encryption:getStatus', async () => {
      return this.encryptionManager.getEncryptionStatus();
    });

    ipcMain.handle('encryption:setMasterPassword', async (event, password) => {
      this.encryptionManager.setMasterPassword(password);
      this.encryptionManager.storeMasterPasswordHash();
      return { success: true };
    });

    ipcMain.handle('encryption:verifyMasterPassword', async (event, password) => {
      return this.encryptionManager.verifyMasterPassword(password);
    });

    ipcMain.handle('encryption:setEnabled', async (event, enabled) => {
      this.encryptionManager.setEncryptionEnabled(enabled);
      return { success: true };
    });

    ipcMain.handle('encryption:changeMasterPassword', async (event, oldPassword, newPassword) => {
      return this.encryptionManager.changeMasterPassword(oldPassword, newPassword);
    });

    ipcMain.handle('encryption:removeMasterPassword', async () => {
      this.encryptionManager.removeMasterPassword();
      return { success: true };
    });
  }

  async importTagsFromMiniApp(miniAppId, miniAppTags) {
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const miniAppTag of miniAppTags) {
      try {
        // Check if tag already exists in superapp
        const existingTags = await this.dbManager.getAllTags();
        const existingTag = existingTags.find(tag => 
          tag.name.toLowerCase() === miniAppTag.name.toLowerCase()
        );

        let superAppTagId;
        if (existingTag) {
          superAppTagId = existingTag.id;
          results.skipped++;
        } else {
          // Create new tag in superapp
          const newTag = await this.dbManager.createTag({
            name: miniAppTag.name,
            color: miniAppTag.color || '#3B82F6',
            description: miniAppTag.description || `Imported from ${miniAppId}`
          });
          superAppTagId = newTag.id;
          results.imported++;
        }

        // Update miniapp tag with external_id
        await this.miniAppManager.updateMiniAppTagExternalId(
          miniAppId, 
          miniAppTag.id, 
          superAppTagId
        );
      } catch (error) {
        results.errors.push(`Failed to import tag "${miniAppTag.name}": ${error.message}`);
      }
    }

    return results;
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Install MiniApp',
            accelerator: 'CmdOrCtrl+I',
            click: () => {
              this.mainWindow.webContents.send('menu:install-miniapp');
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

const superApp = new SuperApp();

app.whenReady().then(async () => {
  await superApp.initialize();
  superApp.createMainWindow();
  superApp.createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      superApp.createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await superApp.dbManager.close();
});