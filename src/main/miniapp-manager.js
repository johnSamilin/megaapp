const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class MiniAppManager {
  constructor() {
    this.miniApps = new Map();
    this.miniAppWindows = new Map();
  }

  async initialize() {
    // Load built-in miniapps
    await this.loadBuiltInMiniApps();
  }

  async loadBuiltInMiniApps() {
    const builtInApps = [
      {
        id: 'notes',
        name: 'Notes',
        description: 'Simple note-taking app',
        version: '1.0.0',
        path: 'miniapps/notes',
        icon: '📝',
        enabled: true
      },
      {
        id: 'calculator',
        name: 'Calculator',
        description: 'Basic calculator',
        version: '1.0.0',
        path: 'miniapps/calculator',
        icon: '🧮',
        enabled: true
      },
      {
        id: 'todo',
        name: 'Todo List',
        description: 'Task management app',
        version: '1.0.0',
        path: 'miniapps/todo',
        icon: '✅',
        enabled: true
      }
    ];

    builtInApps.forEach(app => {
      this.miniApps.set(app.id, app);
    });
  }

  async getAllMiniApps() {
    return Array.from(this.miniApps.values());
  }

  async launchMiniApp(miniAppId) {
    const miniApp = this.miniApps.get(miniAppId);
    if (!miniApp) {
      throw new Error(`MiniApp ${miniAppId} not found`);
    }

    // Check if window is already open
    if (this.miniAppWindows.has(miniAppId)) {
      const window = this.miniAppWindows.get(miniAppId);
      if (!window.isDestroyed()) {
        window.focus();
        return;
      }
    }

    // Create new window for miniapp
    const miniAppWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      title: miniApp.name,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'miniapp-preload.js')
      },
      parent: null,
      modal: false
    });

    // Load miniapp content
    const miniAppPath = path.join(__dirname, '..', miniApp.path, 'index.html');
    try {
      await fs.access(miniAppPath);
      miniAppWindow.loadFile(miniAppPath);
      
      // Inject miniapp ID into the window
      miniAppWindow.webContents.once('dom-ready', () => {
        miniAppWindow.webContents.executeJavaScript(`
          window.__MINIAPP_ID__ = '${miniAppId}';
        `);
      });
    } catch (error) {
      // Fallback to a default miniapp template
      miniAppWindow.loadFile(path.join(__dirname, '../miniapps/template/index.html'));
      miniAppWindow.webContents.once('dom-ready', () => {
        miniAppWindow.webContents.executeJavaScript(`
          window.__MINIAPP_ID__ = '${miniAppId}';
        `);
        miniAppWindow.webContents.executeJavaScript(`
          document.title = '${miniApp.name}';
          document.querySelector('h1').textContent = '${miniApp.name}';
          document.querySelector('p').textContent = '${miniApp.description}';
        `);
      });
    }

    this.miniAppWindows.set(miniAppId, miniAppWindow);

    miniAppWindow.on('closed', () => {
      this.miniAppWindows.delete(miniAppId);
    });

    return miniAppWindow;
  }

  async installMiniApp(miniAppPath) {
    // This would handle installing external miniapps
    // For now, we'll just add it to our registry
    try {
      const manifestPath = path.join(miniAppPath, 'manifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      const miniApp = {
        id: manifest.id || Date.now().toString(),
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        path: miniAppPath,
        icon: manifest.icon,
        enabled: true
      };

      this.miniApps.set(miniApp.id, miniApp);
      return miniApp;
    } catch (error) {
      throw new Error(`Failed to install miniapp: ${error.message}`);
    }
  }

  async getMiniAppTags(miniAppId) {
    // This would typically read from the miniapp's local storage or database
    // For now, we'll simulate some sample tags
    const sampleTags = {
      'notes': [
        { id: 1, name: 'Personal', color: '#10b981', description: 'Personal notes' },
        { id: 2, name: 'Work', color: '#3b82f6', description: 'Work-related notes' },
        { id: 3, name: 'Ideas', color: '#f59e0b', description: 'Creative ideas' }
      ],
      'todo': [
        { id: 1, name: 'Urgent', color: '#ef4444', description: 'Urgent tasks' },
        { id: 2, name: 'Personal', color: '#10b981', description: 'Personal tasks' },
        { id: 3, name: 'Shopping', color: '#8b5cf6', description: 'Shopping lists' }
      ],
      'calculator': [
        { id: 1, name: 'Math', color: '#06b6d4', description: 'Mathematical calculations' }
      ]
    };

    return sampleTags[miniAppId] || [];
  }

  async updateMiniAppTagExternalId(miniAppId, tagId, externalId) {
    // This would typically update the miniapp's local storage or database
    // to store the external_id (superapp's tag id) for synchronization
    console.log(`Updated miniapp ${miniAppId} tag ${tagId} with external_id ${externalId}`);
    return true;
  }
}

module.exports = { MiniAppManager };