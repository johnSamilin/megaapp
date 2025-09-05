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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SuperAppRenderer();
});