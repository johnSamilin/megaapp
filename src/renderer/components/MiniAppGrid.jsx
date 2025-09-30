import React from 'react';
import { ReactRough, Rectangle, Line } from 'react-rough';

const MiniAppGrid = ({ miniApps, onLaunchMiniApp }) => {
  if (miniApps.length === 0) {
    return (
      <div className="text-center text-muted" style={{ padding: '2rem' }}>
        <p>No MiniApps available</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Install some MiniApps to get started
        </p>
      </div>
    );
  }

  return (
    <div className="miniapp-grid">
      {miniApps.map((miniApp, index) => (
        <div
          key={miniApp.id || miniApp.name.toLowerCase()}
          className="miniapp-card"
          onClick={() => onLaunchMiniApp(miniApp.id || miniApp.name.toLowerCase())}
          style={{ position: 'relative' }}
        >
          {/* Sketch overlay for each card */}
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
              x={2}
              y={2}
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              options={{
                roughness: 0.8 + Math.sin(index) * 0.2,
                bowing: 0.5 + Math.cos(index) * 0.1,
                stroke: '#e5e7eb',
                strokeWidth: 1.5,
                fill: 'rgba(255, 255, 255, 0.1)',
                fillStyle: 'cross-hatch',
                fillWeight: 0.5,
                hachureAngle: 45 + index * 10,
                hachureGap: 4
              }}
            />
            {/* Decorative line */}
            <Line
              x1={20}
              y1="60%"
              x2="80%"
              y2="60%"
              options={{
                roughness: 1.0,
                stroke: '#d1d5db',
                strokeWidth: 1
              }}
            />
          </ReactRough>

          <div className="miniapp-icon">{miniApp.icon || '📱'}</div>
          <div className="miniapp-name">{miniApp.name}</div>
          <div className="miniapp-description">
            {miniApp.description || 'No description available'}
          </div>
          {miniApp.tags && miniApp.tags.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              {miniApp.tags.map(tag => (
                <span 
                  key={tag}
                  className="tag" 
                  style={{ 
                    background: '#f1f5f9', 
                    color: '#475569', 
                    fontSize: '0.625rem' 
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MiniAppGrid;