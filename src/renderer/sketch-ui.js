// Sketch UI Manager using Rough.js
class SketchUI {
  constructor() {
    this.rough = null;
    this.canvas = null;
    this.ctx = null;
    this.elements = new Map();
    this.animationId = null;
    this.init();
  }

  init() {
    // Create canvas overlay for sketch elements
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'sketch-overlay';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1000;
      mix-blend-mode: multiply;
    `;
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.rough = window.rough.canvas(this.canvas);
    
    this.setupCanvas();
    this.setupObserver();
    this.startAnimation();
  }

  setupCanvas() {
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      
      this.ctx.scale(dpr, dpr);
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      
      this.redrawAll();
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
  }

  setupObserver() {
    // Observe DOM changes to update sketch elements
    const observer = new MutationObserver(() => {
      this.updateSketchElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    // Initial scan
    setTimeout(() => this.updateSketchElements(), 100);
  }

  updateSketchElements() {
    // Clear existing elements
    this.elements.clear();
    
    // Find elements to sketch
    const sketchableElements = document.querySelectorAll(`
      .btn,
      .miniapp-card,
      .tag-item,
      .modal,
      .form-input,
      .nav-item.active,
      .app-header,
      .sidebar
    `);
    
    sketchableElements.forEach((el, index) => {
      if (el.offsetParent !== null) { // Only visible elements
        const rect = el.getBoundingClientRect();
        const type = this.getElementType(el);
        
        this.elements.set(`element-${index}`, {
          element: el,
          rect: rect,
          type: type,
          animation: Math.random() * 100
        });
      }
    });
    
    this.redrawAll();
  }

  getElementType(element) {
    if (element.classList.contains('btn-primary')) return 'button-primary';
    if (element.classList.contains('btn')) return 'button';
    if (element.classList.contains('miniapp-card')) return 'card';
    if (element.classList.contains('modal')) return 'modal';
    if (element.classList.contains('form-input')) return 'input';
    if (element.classList.contains('nav-item')) return 'nav';
    if (element.classList.contains('app-header')) return 'header';
    if (element.classList.contains('sidebar')) return 'sidebar';
    if (element.classList.contains('tag-item')) return 'tag';
    return 'default';
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.elements.forEach((data, id) => {
      this.drawSketchElement(data);
    });
  }

  drawSketchElement(data) {
    const { rect, type, animation } = data;
    const options = this.getSketchOptions(type, animation);
    
    // Add slight animation offset
    const offset = Math.sin(Date.now() * 0.001 + animation) * 0.5;
    
    switch (type) {
      case 'button-primary':
        this.drawSketchButton(rect, { ...options, fill: 'rgba(59, 130, 246, 0.1)', stroke: '#3b82f6' }, offset);
        break;
      case 'button':
        this.drawSketchButton(rect, { ...options, stroke: '#6b7280' }, offset);
        break;
      case 'card':
        this.drawSketchCard(rect, options, offset);
        break;
      case 'modal':
        this.drawSketchModal(rect, options, offset);
        break;
      case 'input':
        this.drawSketchInput(rect, options, offset);
        break;
      case 'nav':
        this.drawSketchNav(rect, options, offset);
        break;
      case 'header':
        this.drawSketchHeader(rect, options, offset);
        break;
      case 'sidebar':
        this.drawSketchSidebar(rect, options, offset);
        break;
      case 'tag':
        this.drawSketchTag(rect, options, offset);
        break;
      default:
        this.drawSketchDefault(rect, options, offset);
    }
  }

  getSketchOptions(type, animation) {
    const baseRoughness = 0.8 + Math.sin(animation) * 0.2;
    const baseBowing = 0.5 + Math.cos(animation) * 0.1;
    
    return {
      roughness: baseRoughness,
      bowing: baseBowing,
      stroke: '#374151',
      strokeWidth: 1.5,
      fillStyle: 'cross-hatch',
      fillWeight: 0.5,
      hachureAngle: 45 + animation,
      hachureGap: 4
    };
  }

  drawSketchButton(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    const width = rect.width;
    const height = rect.height;
    const radius = 8;
    
    // Draw rounded rectangle
    this.rough.path(
      `M ${x + radius} ${y} 
       L ${x + width - radius} ${y} 
       Q ${x + width} ${y} ${x + width} ${y + radius}
       L ${x + width} ${y + height - radius}
       Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
       L ${x + radius} ${y + height}
       Q ${x} ${y + height} ${x} ${y + height - radius}
       L ${x} ${y + radius}
       Q ${x} ${y} ${x + radius} ${y} Z`,
      options
    );
  }

  drawSketchCard(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    // Main card rectangle
    this.rough.rectangle(x, y, rect.width, rect.height, {
      ...options,
      fill: 'rgba(255, 255, 255, 0.1)',
      stroke: '#e5e7eb'
    });
    
    // Add some decorative lines
    if (rect.height > 60) {
      this.rough.line(
        x + 20, y + 40,
        x + rect.width - 20, y + 40,
        { ...options, strokeWidth: 1, stroke: '#d1d5db' }
      );
    }
  }

  drawSketchModal(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    // Modal background
    this.rough.rectangle(x, y, rect.width, rect.height, {
      ...options,
      fill: 'rgba(255, 255, 255, 0.2)',
      stroke: '#374151',
      strokeWidth: 2
    });
    
    // Modal header line
    this.rough.line(
      x + 10, y + 60,
      x + rect.width - 10, y + 60,
      { ...options, stroke: '#6b7280' }
    );
  }

  drawSketchInput(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    this.rough.rectangle(x, y, rect.width, rect.height, {
      ...options,
      fill: 'rgba(248, 250, 252, 0.1)',
      stroke: '#d1d5db'
    });
  }

  drawSketchNav(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    // Active nav item gets special treatment
    this.rough.rectangle(x - 2, y - 2, rect.width + 4, rect.height + 4, {
      ...options,
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeWidth: 2
    });
  }

  drawSketchHeader(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    // Header underline
    this.rough.line(
      x, y + rect.height,
      x + rect.width, y + rect.height,
      { ...options, strokeWidth: 2, stroke: '#e5e7eb' }
    );
  }

  drawSketchSidebar(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    // Sidebar top border
    this.rough.line(
      x, y,
      x + rect.width, y,
      { ...options, strokeWidth: 2, stroke: '#e5e7eb' }
    );
  }

  drawSketchTag(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    this.rough.rectangle(x, y, rect.width, rect.height, {
      ...options,
      fill: 'rgba(243, 244, 246, 0.1)',
      stroke: '#9ca3af'
    });
  }

  drawSketchDefault(rect, options, offset) {
    const x = rect.left + offset;
    const y = rect.top + offset;
    
    this.rough.rectangle(x, y, rect.width, rect.height, {
      ...options,
      stroke: '#e5e7eb'
    });
  }

  startAnimation() {
    const animate = () => {
      this.redrawAll();
      this.animationId = requestAnimationFrame(animate);
    };
    
    // Animate at 30fps for smooth sketch effect
    setInterval(() => {
      if (this.elements.size > 0) {
        this.redrawAll();
      }
    }, 1000 / 30);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Initialize sketch UI when DOM is ready
let sketchUI = null;

function initSketchUI() {
  if (!sketchUI) {
    sketchUI = new SketchUI();
  }
}

function destroySketchUI() {
  if (sketchUI) {
    sketchUI.destroy();
    sketchUI = null;
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSketchUI);
} else {
  initSketchUI();
}

export { initSketchUI, destroySketchUI };