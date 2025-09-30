import React, { useState } from 'react';
import { ReactRough, Rectangle } from 'react-rough';

const Sidebar = ({ currentView, tags, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleExpanded}>
        <span>{isExpanded ? '▼' : '▲'}</span>
      </button>
      
      <div className="sidebar-content">
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            📊 Dashboard
          </div>
          <div 
            className={`nav-item ${currentView === 'miniapps' ? 'active' : ''}`}
            onClick={() => onNavigate('miniapps')}
          >
            🧩 MiniApps
          </div>
          <div 
            className={`nav-item ${currentView === 'tags' ? 'active' : ''}`}
            onClick={() => onNavigate('tags')}
          >
            🏷️ Tags
          </div>
        </div>
        
        {isExpanded && (
          <div className="nav-section">
            <div className="nav-section-title">Tags</div>
            <div className="tags-list">
              {tags.length === 0 ? (
                <div className="text-muted" style={{ padding: '0 1rem', fontSize: '0.75rem' }}>
                  No tags yet
                </div>
              ) : (
                tags.slice(0, 8).map(tag => (
                  <div key={tag.id} className="nav-item" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <span 
                      className="tag-color" 
                      style={{ 
                        background: tag.color, 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        display: 'inline-block', 
                        marginRight: '0.5rem' 
                      }}
                    />
                    {tag.name}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sketch overlay for sidebar */}
      <ReactRough
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <Rectangle
          x={0}
          y={0}
          width="100%"
          height={2}
          options={{
            roughness: 0.8,
            stroke: '#e5e7eb',
            strokeWidth: 2
          }}
        />
      </ReactRough>
    </aside>
  );
};

export default Sidebar;