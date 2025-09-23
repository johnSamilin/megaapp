import './style.css';
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
      await window.electronAPI.miniApps.launch(miniAppId);
    } catch (error) {
      console.error('Failed to launch miniapp:', error);
      alert('Failed to launch miniapp: ' + error.message);
    }
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
            <h3>Tag Management</h3>
            <p class="text-muted">Import tags from your miniapps to organize content across the superapp.</p>
            <button class="btn btn-primary" id="import-tags-btn">Import Tags from MiniApp</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

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