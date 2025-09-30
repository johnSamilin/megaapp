export class MiniAppGrid {
  constructor() {
    this.miniApps = [];
  }

  render(container) {
    container.innerHTML = `
      <div class="miniapp-grid" id="miniapp-grid"></div>
    `;

    this.renderMiniApps();
  }

  updateMiniApps(miniApps) {
    this.miniApps = miniApps;
    this.renderMiniApps();
  }

  renderMiniApps() {
    const grid = document.getElementById('miniapp-grid');
    if (!grid) return;

    if (this.miniApps.length === 0) {
      grid.innerHTML = `
        <div class="text-center text-muted" style="grid-column: 1 / -1; padding: 2rem;">
          <p>No MiniApps available</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Install some MiniApps to get started</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.miniApps.map(miniApp => `
      <div class="miniapp-card" data-miniapp-id="${miniApp.id || miniApp.name.toLowerCase()}">
        <div class="miniapp-icon">${miniApp.icon || '📱'}</div>
        <div class="miniapp-name">${miniApp.name}</div>
        <div class="miniapp-description">${miniApp.description || 'No description available'}</div>
        ${miniApp.tags && miniApp.tags.length > 0 ? `
          <div style="margin-top: 0.75rem;">
            ${miniApp.tags.map(tag => `<span class="tag" style="background: #f1f5f9; color: #475569; font-size: 0.625rem;">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    this.setupEventListeners();
  }

  setupEventListeners() {
    const cards = document.querySelectorAll('.miniapp-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const miniAppId = card.dataset.miniappId;
        document.dispatchEvent(new CustomEvent('miniapp-launch', {
          detail: { miniAppId }
        }));
      });

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }
}