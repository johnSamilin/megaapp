export class TagManager {
  constructor() {
    this.tags = [];
    this.editingTag = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="tag-manager">
        <div class="mb-4">
          <button class="btn btn-primary" id="create-tag-btn">Create New Tag</button>
        </div>
        <div class="tag-list" id="tag-list"></div>
      </div>
    `;

    await this.loadTags();
    this.setupEventListeners();
  }

  async loadTags() {
    try {
      this.tags = await window.electronAPI.tags.getAll();
      this.renderTagList();
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  renderTagList() {
    const container = document.getElementById('tag-list');
    if (!container) return;

    if (this.tags.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted" style="padding: 2rem;">
          <p>No tags created yet</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Create your first tag to organize your MiniApps</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.tags.map(tag => `
      <div class="tag-item">
        <div class="tag-info">
          <div class="tag-color" style="background-color: ${tag.color}"></div>
          <div class="tag-details">
            <h3>${tag.name}</h3>
            ${tag.description ? `<p>${tag.description}</p>` : ''}
          </div>
        </div>
        <div class="tag-actions">
          <button class="btn btn-secondary" data-action="edit" data-tag-id="${tag.id}">Edit</button>
          <button class="btn btn-danger" data-action="delete" data-tag-id="${tag.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    document.getElementById('create-tag-btn')?.addEventListener('click', () => {
      this.showCreateDialog();
    });

    document.getElementById('tag-list')?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const tagId = parseInt(button.dataset.tagId);

      if (action === 'edit') {
        this.showEditDialog(tagId);
      } else if (action === 'delete') {
        this.deleteTag(tagId);
      }
    });
  }

  showCreateDialog() {
    this.showTagDialog();
  }

  showEditDialog(tagId) {
    const tag = this.tags.find(t => t.id === tagId);
    if (tag) {
      this.editingTag = tag;
      this.showTagDialog(tag);
    }
  }

  showTagDialog(tag = null) {
    const isEditing = tag !== null;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${isEditing ? 'Edit Tag' : 'Create New Tag'}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <form id="tag-form">
          <div class="form-group">
            <label class="form-label" for="tag-name">Name</label>
            <input type="text" id="tag-name" class="form-input" value="${tag?.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="tag-color">Color</label>
            <input type="color" id="tag-color" class="form-input" value="${tag?.color || '#3B82F6'}">
          </div>
          <div class="form-group">
            <label class="form-label" for="tag-description">Description</label>
            <textarea id="tag-description" class="form-input form-textarea" placeholder="Optional description">${tag?.description || ''}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
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

    modal.querySelector('#tag-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: modal.querySelector('#tag-name').value.trim(),
        color: modal.querySelector('#tag-color').value,
        description: modal.querySelector('#tag-description').value.trim()
      };

      try {
        if (isEditing) {
          await window.electronAPI.tags.update(tag.id, formData);
          document.dispatchEvent(new CustomEvent('tag-updated'));
        } else {
          await window.electronAPI.tags.create(formData);
          document.dispatchEvent(new CustomEvent('tag-created'));
        }

        document.body.removeChild(modal);
        await this.loadTags();
      } catch (error) {
        alert('Failed to save tag: ' + error.message);
      }
    });

    // Focus the name input
    modal.querySelector('#tag-name').focus();
  }

  async deleteTag(tagId) {
    const tag = this.tags.find(t => t.id === tagId);
    if (!tag) return;

    if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      try {
        await window.electronAPI.tags.delete(tagId);
        document.dispatchEvent(new CustomEvent('tag-deleted'));
        await this.loadTags();
      } catch (error) {
        alert('Failed to delete tag: ' + error.message);
      }
    }
  }
}