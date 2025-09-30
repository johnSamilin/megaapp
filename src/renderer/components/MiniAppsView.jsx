import React from 'react';
import MiniAppGrid from './MiniAppGrid';

const MiniAppsView = ({ miniApps, onLaunchMiniApp }) => {
  return (
    <div className="miniapps-view">
      <h2>MiniApps</h2>
      <div className="miniapp-grid-container">
        <MiniAppGrid miniApps={miniApps} onLaunchMiniApp={onLaunchMiniApp} />
      </div>
    </div>
  );
};

export default MiniAppsView;