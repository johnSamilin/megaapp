import React from 'react';
import { ReactRough, Rectangle, Line } from 'react-rough';
import MiniAppGrid from './MiniAppGrid';

const Dashboard = ({ miniApps, tags, onLaunchMiniApp }) => {
  const recentTags = tags.slice(0, 5);

  return (
    <div className="dashboard">
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
        {/* Decorative sketch elements */}
        <Line
          x1={20}
          y1={80}
          x2={300}
          y2={80}
          options={{
            roughness: 1.0,
            stroke: '#d1d5db',
            strokeWidth: 1
          }}
        />
      </ReactRough>

      <div className="dashboard-section">
        <h2>Quick Launch</h2>
        <div className="miniapp-grid-container">
          <MiniAppGrid miniApps={miniApps} onLaunchMiniApp={onLaunchMiniApp} />
        </div>
      </div>
      
      <div className="dashboard-section">
        <h2>Recent Tags</h2>
        <div className="recent-tags">
          {recentTags.length === 0 ? (
            <p className="text-muted">No tags available</p>
          ) : (
            recentTags.map(tag => (
              <span 
                key={tag.id}
                className="tag" 
                style={{ 
                  backgroundColor: `${tag.color}20`, 
                  color: tag.color, 
                  border: `1px solid ${tag.color}40` 
                }}
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;