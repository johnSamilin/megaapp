import './style.css';

// Ensure theme variables are loaded
document.documentElement.setAttribute('data-theme', __THEME__ || 'default');

import { TagManager } from './components/TagManager.js';
import { MiniAppGrid } from './components/MiniAppGrid.js';
import { Sidebar } from './components/Sidebar.js';

class SuperAppRenderer {
  constructor() {
    this.currentView = 'dashboard';
    this.tagManager = new TagManager();
    this.miniAppGrid = new MiniAppGrid();
    this.sidebar = new Sidebar();
    
    this.init();
  }

  async init() {
    this.setupLayout();
    this.setupEventListeners();
    await this.loadInitialData();
  }

  setupLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-content"></div>
        </aside>
        <main class="main-content">
          <header class="app-header">
            <h1 class="app-title">SuperApp</h1>
            <div class="header-actions">
              <button class="btn btn-primary" id="add-tag-btn">Add Tag</button>
            </div>
          </header>
          <div class="content-area">
            <div class="view-container" id="view-container"></div>
            <div class="miniapp-container" id="miniapp-container" style="display: none;">
              <div class="miniapp-header">
                <div class="miniapp-info">
                  <span class="miniapp-icon" id="miniapp-icon">📱</span>
                  <span class="miniapp-title" id="miniapp-title">MiniApp</span>
                </div>
                <div class="miniapp-controls">
                  <button class="btn btn-secondary" id="close-miniapp-btn">✕ Close</button>
                </div>
              </div>
              <div class="miniapp-content">
                <iframe id="miniapp-frame" src="" frameborder="0"></iframe>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    // Initialize components
    this.sidebar.render(document.querySelector('.sidebar-content'));
    this.showDashboard();
  }

  setupEventListeners() {
    // Sidebar navigation
    document.addEventListener('sidebar-navigate', (e) => {
      this.navigateTo(e.detail.view);
    });

    // Add tag button
    document.getElementById('add-tag-btn').addEventListener('click', () => {
      this.tagManager.showCreateDialog();
    });

    // Settings button
    document.querySelector('.header-actions').insertAdjacentHTML('beforeend', `
      <button class="btn btn-secondary" id="settings-btn">⚙️ Settings</button>
    `);

    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showSettingsModal();
    });

    // Tag events
    document.addEventListener('tag-created', () => {
      this.loadTags();
    });

    document.addEventListener('tag-updated', () => {
      this.loadTags();
    });

    document.addEventListener('tag-deleted', () => {
      this.loadTags();
    });

    // MiniApp events
    document.addEventListener('miniapp-launch', (e) => {
      this.launchMiniApp(e.detail.miniAppId);
    });

    // Close miniapp button
    document.getElementById('close-miniapp-btn').addEventListener('click', () => {
      this.closeMiniApp();
    });
  }

  async loadInitialData() {
    await this.loadTags();
    await this.loadMiniApps();
  }

  async loadTags() {
    try {
      const tags = await window.electronAPI.tags.getAll();
      this.sidebar.updateTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async loadMiniApps() {
    try {
      const miniApps = await window.electronAPI.miniApps.getAll();
      this.miniAppGrid.updateMiniApps(miniApps);
    } catch (error) {
      console.error('Failed to load miniapps:', error);
    }
  }

  navigateTo(view) {
    this.currentView = view;
    
    switch (view) {
      case 'dashboard':
        this.showDashboard();
        break;
      case 'tags':
        this.showTagsView();
        break;
      case 'miniapps':
        this.showMiniAppsView();
        break;
      default:
        this.showDashboard();
    }
  }

  showDashboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-section">
          <h2>Quick Launch</h2>
          <div class="miniapp-grid-container"></div>
        </div>
        <div class="dashboard-section">
          <h2>Recent Tags</h2>
          <div class="recent-tags"></div>
        </div>
      </div>
    `;

    this.miniAppGrid.render(container.querySelector('.miniapp-grid-container'));
    this.renderRecentTags(container.querySelector('.recent-tags'));
  }

  showTagsView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="tags-view">
        <h2>Tag Management</h2>
        <div class="tag-manager-container"></div>
      </div>
    `;

    this.tagManager.render(container.querySelector('.tag-manager-container'));
  }

  showMiniAppsView() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="miniapps-view">
        <h2>MiniApps</h2>
        <div class="miniapp-grid-container"></div>
      </div>
    `;

    this.miniAppGrid.render(container.querySelector('.miniapp-grid-container'));
  }

  async renderRecentTags(container) {
    try {
      const tags = await window.electronAPI.tags.getAll();
      const recentTags = tags.slice(0, 5);
      
      container.innerHTML = recentTags.map(tag => `
        <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
          ${tag.name}
        </span>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="text-muted">No tags available</p>';
    }
  }

  async launchMiniApp(miniAppId) {
    try {
      const result = await window.electronAPI.miniApps.launch(miniAppId);
      if (result.success) {
        this.showMiniApp(result);
      }
    } catch (error) {
      console.error('Failed to launch miniapp:', error);
      alert('Failed to launch miniapp: ' + error.message);
    }
  }

  showMiniApp(miniAppData) {
    const { miniAppId, title, path, icon, isTemplate, description } = miniAppData;
    
    // Hide main content and show miniapp container
    document.getElementById('view-container').style.display = 'none';
    document.getElementById('miniapp-container').style.display = 'flex';
    
    // Update miniapp header
    document.getElementById('miniapp-icon').textContent = icon || '📱';
    document.getElementById('miniapp-title').textContent = title;
    
    // Load miniapp in iframe
    const iframe = document.getElementById('miniapp-frame');
    
    if (isTemplate) {
      // For template, create a data URL with custom content
      const templateContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 2rem;
                    background: #f8fafc;
                    color: #1e293b;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    padding: 2rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                h1 {
                    color: #3b82f6;
                    margin-bottom: 1rem;
                }
                p {
                    line-height: 1.6;
                    color: #64748b;
                }
                .status {
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    margin-top: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <p>${description || 'This miniapp is loading...'}</p>
                <div class="status">
                    <strong>Status:</strong> MiniApp loaded successfully
                </div>
            </div>
            <script>
                window.__MINIAPP_ID__ = '${miniAppId}';
                console.log('MiniApp ${miniAppId} loaded in embedded mode');
            </script>
        </body>
        </html>
      `;
      iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(templateContent);
    } else {
      // For regular miniapps, we need to load the file content and inject the miniapp ID
      this.loadMiniAppContent(path, miniAppId).then(content => {
        iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(content);
      }).catch(error => {
        console.error('Failed to load miniapp content:', error);
        iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <html><body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h2>Error Loading MiniApp</h2>
            <p>Failed to load ${title}</p>
            <p style="color: #ef4444; font-size: 0.875rem;">${error.message}</p>
          </body></html>
        `);
      });
    }
  }

  async loadMiniAppContent(filePath, miniAppId) {
    try {
      // Read file content from main process
      const result = await window.electronAPI.miniApps.readFile(filePath);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      let content = result.content;
      
      // Inject miniapp ID into the content
      const scriptInjection = `
        <script>
          window.__MINIAPP_ID__ = '${miniAppId}';
          
          // Expose miniAppAPI to the iframe
          window.miniAppAPI = {
            storage: {
              setItem: (key, data) => {
                return window.parent.electronAPI?.miniApps?.storage?.setItem?.('${miniAppId}', key, data) || 
                       Promise.resolve({ success: false, error: 'API not available' });
              },
              getItem: (key) => {
                return window.parent.electronAPI?.miniApps?.storage?.getItem?.('${miniAppId}', key) || 
                       Promise.resolve(null);
              },
              getAllKeys: () => {
                return window.parent.electronAPI?.miniApps?.storage?.getAllKeys?.('${miniAppId}') || 
                       Promise.resolve([]);
              },
              getAllData: () => {
                return window.parent.electronAPI?.miniApps?.storage?.getAllData?.('${miniAppId}') || 
                       Promise.resolve({});
              },
              removeItem: (key) => {
                return window.parent.electronAPI?.miniApps?.storage?.removeItem?.('${miniAppId}', key) || 
                       Promise.resolve({ success: false });
              },
              clear: () => {
                return window.parent.electronAPI?.miniApps?.storage?.clear?.('${miniAppId}') || 
                       Promise.resolve({ success: false });
              },
              hasItem: (key) => {
                return window.parent.electronAPI?.miniApps?.storage?.hasItem?.('${miniAppId}', key) || 
                       Promise.resolve(false);
              },
              getStorageInfo: () => {
                return window.parent.electronAPI?.miniApps?.storage?.getStorageInfo?.('${miniAppId}') || 
                       Promise.resolve({ totalKeys: 0, totalSize: 0 });
              }
            },
            tags: {
              getAll: () => {
                return window.parent.electronAPI?.tags?.getAll?.() || 
                       Promise.resolve([]);
              },
              create: (tagData) => {
                return window.parent.electronAPI?.tags?.create?.(tagData) || 
                       Promise.resolve(null);
              }
            },
            utils: {
              showNotification: (title, body) => {
                if (window.parent.Notification) {
                  new window.parent.Notification(title, { body });
                }
              },
              getAppInfo: () => ({
                platform: 'embedded',
                version: '1.0.0'
              }),
              getMiniAppId: () => '${miniAppId}'
            }
          };
        </script>
      `;
      
      // Insert the script before the closing body tag
      content = content.replace('</body>', scriptInjection + '</body>');
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load miniapp content: ${error.message}`);
    }
  }

  closeMiniApp() {
    // Hide miniapp container and show main content
    document.getElementById('miniapp-container').style.display = 'none';
    document.getElementById('view-container').style.display = 'block';
    
    // Clear iframe content
    document.getElementById('miniapp-frame').src = 'about:blank';
  }

  showSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">Settings</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h3>Data Encryption</h3>
            <p class="text-muted">Encrypt miniapp data with a master password for enhanced security.</p>
            <div class="encryption-controls" id="encryption-controls">
              <div class="loading">Loading encryption status...</div>
            </div>
          </div>
          <div class="settings-section">
            <h3>Tag Management</h3>
            <p class="text-muted">Import tags from your miniapps to organize content across the superapp.</p>
            <button class="btn btn-primary" id="import-tags-btn">Import Tags from MiniApp</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.loadEncryptionStatus(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    modal.querySelector('#import-tags-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      this.showTagImportModal();
    });
  }

  async loadEncryptionStatus(modal) {
    try {
      const status = await window.electronAPI.encryption.getStatus();
      const container = modal.querySelector('#encryption-controls');
      
      container.innerHTML = `
        <div class="encryption-status">
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="encryption-toggle" ${status.enabled ? 'checked' : ''}>
              Enable Data Encryption
            </label>
          </div>
          <div class="encryption-password-section" style="display: ${status.hasPassword ? 'block' : 'none'};">
            <div class="form-group">
              <label class="form-label">Master Password Status</label>
              <div class="password-status">
                <span class="status-indicator ${status.keyLoaded ? 'success' : 'warning'}">
                  ${status.keyLoaded ? '🔓 Password loaded' : '🔒 Password required'}
                </span>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" id="change-password-btn">Change Password</button>
              <button class="btn btn-danger" id="remove-password-btn">Remove Password</button>
            </div>
          </div>
          <div class="encryption-setup-section" style="display: ${status.hasPassword ? 'none' : 'block'};">
            <div class="form-group">
              <label class="form-label" for="master-password">Set Master Password</label>
              <input type="password" id="master-password" class="form-input" placeholder="Enter master password (min 8 characters)">
            </div>
            <button class="btn btn-primary" id="set-password-btn">Set Password</button>
          </div>
        </div>
      `;

      this.setupEncryptionEventListeners(modal, status);
    } catch (error) {
      console.error('Failed to load encryption status:', error);
      modal.querySelector('#encryption-controls').innerHTML = `
        <div class="text-danger">Failed to load encryption settings</div>
      `;
    }
  }

  setupEncryptionEventListeners(modal, initialStatus) {
    const toggle = modal.querySelector('#encryption-toggle');
    const setPasswordBtn = modal.querySelector('#set-password-btn');
    const changePasswordBtn = modal.querySelector('#change-password-btn');
    const removePasswordBtn = modal.querySelector('#remove-password-btn');
    const masterPasswordInput = modal.querySelector('#master-password');

    // Encryption toggle
    toggle.addEventListener('change', async (e) => {
      try {
        if (e.target.checked && !initialStatus.hasPassword) {
          e.target.checked = false;
          alert('Please set a master password first before enabling encryption.');
          return;
        }

        if (e.target.checked && !initialStatus.keyLoaded) {
          const password = prompt('Enter master password to enable encryption:');
          if (!password) {
            e.target.checked = false;
            return;
          }

          const verified = await window.electronAPI.encryption.verifyMasterPassword(password);
          if (!verified) {
            e.target.checked = false;
            alert('Incorrect password. Encryption not enabled.');
            return;
          }
        }

        await window.electronAPI.encryption.setEnabled(e.target.checked);
        alert(`Encryption ${e.target.checked ? 'enabled' : 'disabled'} successfully.`);
      } catch (error) {
        e.target.checked = !e.target.checked;
        alert('Failed to toggle encryption: ' + error.message);
      }
    });

    // Set master password
    setPasswordBtn?.addEventListener('click', async () => {
      const password = masterPasswordInput.value;
      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }

      try {
        await window.electronAPI.encryption.setMasterPassword(password);
        alert('Master password set successfully!');
        document.body.removeChild(modal);
        this.showSettingsModal(); // Refresh the modal
      } catch (error) {
        alert('Failed to set password: ' + error.message);
      }
    });

    // Change master password
    changePasswordBtn?.addEventListener('click', async () => {
      const oldPassword = prompt('Enter current master password:');
      if (!oldPassword) return;

      const newPassword = prompt('Enter new master password (min 8 characters):');
      if (!newPassword || newPassword.length < 8) {
        alert('New password must be at least 8 characters long.');
        return;
      }

      try {
        await window.electronAPI.encryption.changeMasterPassword(oldPassword, newPassword);
        alert('Master password changed successfully!');
      } catch (error) {
        alert('Failed to change password: ' + error.message);
      }
    });

    // Remove master password
    removePasswordBtn?.addEventListener('click', async () => {
      if (!confirm('This will remove the master password and disable encryption. Are you sure?')) {
        return;
      }

      try {
        await window.electronAPI.encryption.removeMasterPassword();
        alert('Master password removed and encryption disabled.');
        document.body.removeChild(modal);
        this.showSettingsModal(); // Refresh the modal
      } catch (error) {
        alert('Failed to remove password: ' + error.message);
      }
    });

    // Enter key for password input
    masterPasswordInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        setPasswordBtn.click();
      }
    });
  }

  async showTagImportModal() {
    const miniApps = await this.loadMiniApps();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">Import Tags from MiniApp</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select MiniApp</label>
            <select class="form-input" id="miniapp-selector">
              <option value="">Choose a miniapp...</option>
              ${miniApps.map(app => `
                <option value="${app.id || app.name.toLowerCase()}">${app.icon} ${app.name}</option>
              `).join('')}
            </select>
          </div>
          <div id="tag-preview" style="display: none;">
            <h4>Available Tags:</h4>
            <div id="tag-list"></div>
          </div>
          <div id="progress-section" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div id="progress-text">Preparing import...</div>
          </div>
          <div id="import-results" style="display: none;"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="import-btn" disabled>Import Tags</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupTagImportEventListeners(modal);
  }

  setupTagImportEventListeners(modal) {
    const selector = modal.querySelector('#miniapp-selector');
    const tagPreview = modal.querySelector('#tag-preview');
    const tagList = modal.querySelector('#tag-list');
    const importBtn = modal.querySelector('#import-btn');
    const progressSection = modal.querySelector('#progress-section');
    const progressFill = modal.querySelector('#progress-fill');
    const progressText = modal.querySelector('#progress-text');
    const resultsDiv = modal.querySelector('#import-results');

    // Close modal handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // MiniApp selection handler
    selector.addEventListener('change', async (e) => {
      const miniAppId = e.target.value;
      if (!miniAppId) {
        tagPreview.style.display = 'none';
        importBtn.disabled = true;
        return;
      }

      try {
        const tags = await window.electronAPI.miniApps.getTags(miniAppId);
        if (tags.length === 0) {
          tagList.innerHTML = '<p class="text-muted">No tags found in this miniapp.</p>';
          importBtn.disabled = true;
        } else {
          tagList.innerHTML = tags.map(tag => `
            <div class="tag-preview-item">
              <span class="tag-color" style="background-color: ${tag.color}"></span>
              <div class="tag-info">
                <strong>${tag.name}</strong>
                ${tag.description ? `<br><small class="text-muted">${tag.description}</small>` : ''}
              </div>
            </div>
          `).join('');
          importBtn.disabled = false;
        }
        tagPreview.style.display = 'block';
      } catch (error) {
        tagList.innerHTML = `<p class="text-danger">Error loading tags: ${error.message}</p>`;
        importBtn.disabled = true;
        tagPreview.style.display = 'block';
      }
    });

    // Import handler
    importBtn.addEventListener('click', async () => {
      const miniAppId = selector.value;
      if (!miniAppId) return;

      try {
        // Show progress
        progressSection.style.display = 'block';
        importBtn.disabled = true;
        selector.disabled = true;

        // Get tags to import
        progressText.textContent = 'Loading tags...';
        progressFill.style.width = '20%';
        
        const tags = await window.electronAPI.miniApps.getTags(miniAppId);
        
        progressText.textContent = 'Importing tags...';
        progressFill.style.width = '50%';

        // Import tags
        const results = await window.electronAPI.miniApps.importTags(miniAppId, tags);
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Import completed!';

        // Show results
        setTimeout(() => {
          progressSection.style.display = 'none';
          resultsDiv.style.display = 'block';
          resultsDiv.innerHTML = `
            <div class="import-results">
              <h4>Import Results</h4>
              <div class="result-stats">
                <div class="stat-item success">
                  <strong>${results.imported}</strong> tags imported
                </div>
                <div class="stat-item info">
                  <strong>${results.skipped}</strong> tags skipped (already exist)
                </div>
                ${results.errors.length > 0 ? `
                  <div class="stat-item error">
                    <strong>${results.errors.length}</strong> errors
                  </div>
                ` : ''}
              </div>
              ${results.errors.length > 0 ? `
                <div class="error-list">
                  <h5>Errors:</h5>
                  ${results.errors.map(error => `<div class="error-item">${error}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `;
          
          // Refresh tags in the main app
          this.loadTags();
        }, 1000);

      } catch (error) {
        progressSection.style.display = 'none';
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
          <div class="import-results">
            <div class="stat-item error">
              <strong>Import Failed:</strong> ${error.message}
            </div>
          </div>
        `;
      }
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SuperAppRenderer();
});