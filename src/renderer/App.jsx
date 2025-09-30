import React, { useState, useEffect } from 'react';
import { ReactRough, Rectangle, Circle, Line, Path } from 'react-rough';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TagManager from './components/TagManager';
import MiniAppsView from './components/MiniAppsView';
import MiniAppContainer from './components/MiniAppContainer';
import SettingsModal from './components/SettingsModal';
import './style.css';

const SuperApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tags, setTags] = useState([]);
  const [miniApps, setMiniApps] = useState([]);
  const [activeMiniApp, setActiveMiniApp] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadTags(), loadMiniApps()]);
  };

  const loadTags = async () => {
    try {
      const tagsData = await window.electronAPI.tags.getAll();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadMiniApps = async () => {
    try {
      const miniAppsData = await window.electronAPI.miniApps.getAll();
      setMiniApps(miniAppsData);
    } catch (error) {
      console.error('Failed to load miniapps:', error);
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    setActiveMiniApp(null);
  };

  const handleLaunchMiniApp = async (miniAppId) => {
    try {
      const result = await window.electronAPI.miniApps.launch(miniAppId);
      if (result.success) {
        setActiveMiniApp(result);
      }
    } catch (error) {
      console.error('Failed to launch miniapp:', error);
      alert('Failed to launch miniapp: ' + error.message);
    }
  };

  const handleCloseMiniApp = () => {
    setActiveMiniApp(null);
  };

  const handleTagCreated = () => {
    loadTags();
  };

  const renderCurrentView = () => {
    if (activeMiniApp) {
      return (
        <MiniAppContainer
          miniApp={activeMiniApp}
          onClose={handleCloseMiniApp}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            miniApps={miniApps}
            tags={tags}
            onLaunchMiniApp={handleLaunchMiniApp}
          />
        );
      case 'tags':
        return (
          <TagManager
            tags={tags}
            onTagCreated={handleTagCreated}
            onTagUpdated={loadTags}
            onTagDeleted={loadTags}
          />
        );
      case 'miniapps':
        return (
          <MiniAppsView
            miniApps={miniApps}
            onLaunchMiniApp={handleLaunchMiniApp}
          />
        );
      default:
        return (
          <Dashboard
            miniApps={miniApps}
            tags={tags}
            onLaunchMiniApp={handleLaunchMiniApp}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sketch overlay using react-rough */}
      <ReactRough
        width="100vw"
        height="100vh"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1000,
          mixBlendMode: 'multiply'
        }}
      >
        {/* Background sketch elements */}
        <Rectangle
          x={20}
          y={20}
          width={200}
          height={60}
          options={{
            roughness: 1.2,
            stroke: '#e5e7eb',
            strokeWidth: 1,
            fill: 'rgba(255, 255, 255, 0.1)'
          }}
        />
      </ReactRough>

      <Sidebar
        currentView={currentView}
        tags={tags}
        onNavigate={handleNavigate}
      />

      <main className="main-content">
        <header className="app-header">
          <h1 className="app-title">SuperApp</h1>
          <div className="header-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleTagCreated}
            >
              Add Tag
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowSettings(true)}
            >
              ⚙️ Settings
            </button>
          </div>
        </header>

        <div className="content-area">
          {renderCurrentView()}
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onTagsImported={loadTags}
        />
      )}
    </div>
  );
};

export default SuperApp;