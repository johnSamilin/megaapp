export class Sidebar {
  constructor() {
    this.currentView = 'dashboard';
    this.tags = [];
  }

  render(container) {
    container.innerHTML = `
      <div class="sidebar-nav">
        <div class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
          📊 Dashboard
        </div>
        <div class="nav-item ${this.currentView === 'miniapps' ? 'active' : ''}" data-view="miniapps">
          🧩 MiniApps
        </div>
        <div class="nav-item ${this.currentView === 'tags' ? 'active' : ''}" data-view="tags">
          🏷️ Tags
        </div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Tags</div>
        <div class="tags-list" id="sidebar-tags"></div>
      </div>
    `;

    this.setupEventListeners(container);
    this.renderTags();
  }

  setupEventListeners(container) {
    container.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem && navItem.dataset.view) {
        this.navigateTo(navItem.dataset.view);
      }
    });
  }

  navigateTo(view) {
    this.currentView = view;
    
    // Update active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Dispatch navigation event
    document.dispatchEvent(new CustomEvent('sidebar-navigate', {
      detail: { view }
    }));
  }

  updateTags(tags) {
    this.tags = tags;
    this.renderTags();
  }

  renderTags() {
    const container = document.getElementById('sidebar-tags');
    if (!container) return;

    if (this.tags.length === 0) {
      container.innerHTML = '<div class="text-muted" style="padding: 0 1rem; font-size: 0.75rem;">No tags yet</div>';
      return;
    }

    container.innerHTML = this.tags.slice(0, 8).map(tag => `
      <div class="nav-item" style="font-size: 0.75rem; padding: 0.5rem 1rem;">
        <span class="tag-color" style="background: ${tag.color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 0.5rem;"></span>
        ${tag.name}
      </div>
    `).join('');
  }
}