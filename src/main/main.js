const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { DatabaseManager } = require('./database');
const { MiniAppManager } = require('./miniapp-manager');

class SuperApp {
  constructor() {
    this.mainWindow = null;
    this.dbManager = new DatabaseManager();
    this.miniAppManager = new MiniAppManager();
    this.isDev = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    await this.dbManager.initialize();
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
      this.mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
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