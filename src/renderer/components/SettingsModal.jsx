import React, { useState, useEffect } from 'react';
import { ReactRough, Rectangle, Line } from 'react-rough';

const SettingsModal = ({ onClose, onTagsImported }) => {
  const [encryptionStatus, setEncryptionStatus] = useState(null);
  const [showTagImport, setShowTagImport] = useState(false);

  useEffect(() => {
    loadEncryptionStatus();
  }, []);

  const loadEncryptionStatus = async () => {
    try {
      const status = await window.electronAPI.encryption.getStatus();
      setEncryptionStatus(status);
    } catch (error) {
      console.error('Failed to load encryption status:', error);
    }
  };

  const handleEncryptionToggle = async (enabled) => {
    try {
      if (enabled && !encryptionStatus.hasPassword) {
        alert('Please set a master password first before enabling encryption.');
        return;
      }

      if (enabled && !encryptionStatus.keyLoaded) {
        const password = prompt('Enter master password to enable encryption:');
        if (!password) return;

        const verified = await window.electronAPI.encryption.verifyMasterPassword(password);
        if (!verified) {
          alert('Incorrect password. Encryption not enabled.');
          return;
        }
      }

      await window.electronAPI.encryption.setEnabled(enabled);
      alert(`Encryption ${enabled ? 'enabled' : 'disabled'} successfully.`);
      loadEncryptionStatus();
    } catch (error) {
      alert('Failed to toggle encryption: ' + error.message);
    }
  };

  const handleSetMasterPassword = async (password) => {
    if (!password || password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      await window.electronAPI.encryption.setMasterPassword(password);
      alert('Master password set successfully!');
      loadEncryptionStatus();
    } catch (error) {
      alert('Failed to set password: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px', position: 'relative' }}>
        {/* Sketch overlay for settings modal */}
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
              roughness: 1.0,
              stroke: '#374151',
              strokeWidth: 2,
              fill: 'rgba(255, 255, 255, 0.2)'
            }}
          />
          <Line
            x1={10}
            y1={60}
            x2="calc(100% - 10px)"
            y2={60}
            options={{
              roughness: 0.8,
              stroke: '#6b7280',
              strokeWidth: 1
            }}
          />
        </ReactRough>

        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="settings-section">
            <h3>Data Encryption</h3>
            <p className="text-muted">
              Encrypt miniapp data with a master password for enhanced security.
            </p>
            {encryptionStatus ? (
              <div className="encryption-controls">
                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={encryptionStatus.enabled}
                      onChange={(e) => handleEncryptionToggle(e.target.checked)}
                    />
                    Enable Data Encryption
                  </label>
                </div>
                {encryptionStatus.hasPassword ? (
                  <div className="password-status">
                    <span className={`status-indicator ${encryptionStatus.keyLoaded ? 'success' : 'warning'}`}>
                      {encryptionStatus.keyLoaded ? '🔓 Password loaded' : '🔒 Password required'}
                    </span>
                  </div>
                ) : (
                  <div className="encryption-setup-section">
                    <div className="form-group">
                      <label className="form-label">Set Master Password</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Enter master password (min 8 characters)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSetMasterPassword(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="loading">Loading encryption status...</div>
            )}
          </div>
          
          <div className="settings-section">
            <h3>Tag Management</h3>
            <p className="text-muted">
              Import tags from your miniapps to organize content across the superapp.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowTagImport(true)}
            >
              Import Tags from MiniApp
            </button>
          </div>
        </div>
      </div>

      {showTagImport && (
        <TagImportModal
          onClose={() => setShowTagImport(false)}
          onTagsImported={onTagsImported}
        />
      )}
    </div>
  );
};

const TagImportModal = ({ onClose, onTagsImported }) => {
  const [miniApps, setMiniApps] = useState([]);
  const [selectedMiniApp, setSelectedMiniApp] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadMiniApps();
  }, []);

  const loadMiniApps = async () => {
    try {
      const apps = await window.electronAPI.miniApps.getAll();
      setMiniApps(apps);
    } catch (error) {
      console.error('Failed to load miniapps:', error);
    }
  };

  const handleMiniAppSelect = async (miniAppId) => {
    setSelectedMiniApp(miniAppId);
    if (miniAppId) {
      try {
        const tags = await window.electronAPI.miniApps.getTags(miniAppId);
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
        setAvailableTags([]);
      }
    } else {
      setAvailableTags([]);
    }
  };

  const handleImport = async () => {
    if (!selectedMiniApp || availableTags.length === 0) return;

    setImporting(true);
    try {
      const importResults = await window.electronAPI.miniApps.importTags(selectedMiniApp, availableTags);
      setResults(importResults);
      onTagsImported();
    } catch (error) {
      setResults({ imported: 0, skipped: 0, errors: [error.message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Import Tags from MiniApp</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select MiniApp</label>
            <select
              className="form-input"
              value={selectedMiniApp}
              onChange={(e) => handleMiniAppSelect(e.target.value)}
            >
              <option value="">Choose a miniapp...</option>
              {miniApps.map(app => (
                <option key={app.id || app.name.toLowerCase()} value={app.id || app.name.toLowerCase()}>
                  {app.icon} {app.name}
                </option>
              ))}
            </select>
          </div>

          {availableTags.length > 0 && (
            <div>
              <h4>Available Tags:</h4>
              <div>
                {availableTags.map(tag => (
                  <div key={tag.id} className="tag-preview-item">
                    <span className="tag-color" style={{ backgroundColor: tag.color }} />
                    <div className="tag-info">
                      <strong>{tag.name}</strong>
                      {tag.description && <><br /><small className="text-muted">{tag.description}</small></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="import-results">
              <h4>Import Results</h4>
              <div className="result-stats">
                <div className="stat-item success">
                  <strong>{results.imported}</strong> tags imported
                </div>
                <div className="stat-item info">
                  <strong>{results.skipped}</strong> tags skipped (already exist)
                </div>
                {results.errors.length > 0 && (
                  <div className="stat-item error">
                    <strong>{results.errors.length}</strong> errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!selectedMiniApp || availableTags.length === 0 || importing}
          >
            {importing ? 'Importing...' : 'Import Tags'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;