import React, { useEffect, useRef } from 'react';
import { ReactRough, Rectangle, Line } from 'react-rough';

const MiniAppContainer = ({ miniApp, onClose }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (miniApp && iframeRef.current) {
      loadMiniAppContent();
    }
  }, [miniApp]);

  const loadMiniAppContent = async () => {
    const { miniAppId, title, path, icon, isTemplate, description } = miniApp;
    
    if (isTemplate) {
      const templateContent = createTemplateContent(title, description, miniAppId);
      iframeRef.current.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(templateContent);
    } else {
      try {
        const result = await window.electronAPI.miniApps.readFile(path);
        if (result.success) {
          const content = injectMiniAppAPI(result.content, miniAppId);
          iframeRef.current.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(content);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to load miniapp content:', error);
        const errorContent = createErrorContent(title, error.message);
        iframeRef.current.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(errorContent);
      }
    }
  };

  const createTemplateContent = (title, description, miniAppId) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 2rem;
                  background: #f8fafc;
                  color: #1e293b;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: white;
                  padding: 2rem;
                  border-radius: 0.75rem;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              }
              h1 {
                  color: #3b82f6;
                  margin-bottom: 1rem;
              }
              p {
                  line-height: 1.6;
                  color: #64748b;
              }
              .status {
                  background: #f0f9ff;
                  border: 1px solid #bae6fd;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  margin-top: 1rem;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>${title}</h1>
              <p>${description || 'This miniapp is loading...'}</p>
              <div class="status">
                  <strong>Status:</strong> MiniApp loaded successfully
              </div>
          </div>
          <script>
              window.__MINIAPP_ID__ = '${miniAppId}';
              console.log('MiniApp ${miniAppId} loaded in embedded mode');
          </script>
      </body>
      </html>
    `;
  };

  const createErrorContent = (title, errorMessage) => {
    return `
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h2>Error Loading MiniApp</h2>
          <p>Failed to load ${title}</p>
          <p style="color: #ef4444; font-size: 0.875rem;">${errorMessage}</p>
        </body>
      </html>
    `;
  };

  const injectMiniAppAPI = (content, miniAppId) => {
    const scriptInjection = `
      <script>
        window.__MINIAPP_ID__ = '${miniAppId}';
        
        // Monkey-patch localStorage and expose miniAppAPI
        (function() {
          const storageAPI = {
            setItem: (key, data) => {
              return window.parent.electronAPI?.miniApps?.storage?.setItem?.('${miniAppId}', key, data) || 
                     Promise.resolve({ success: false, error: 'API not available' });
            },
            getItem: (key) => {
              return window.parent.electronAPI?.miniApps?.storage?.getItem?.('${miniAppId}', key) || 
                     Promise.resolve(null);
            },
            getAllKeys: () => {
              return window.parent.electronAPI?.miniApps?.storage?.getAllKeys?.('${miniAppId}') || 
                     Promise.resolve([]);
            },
            getAllData: () => {
              return window.parent.electronAPI?.miniApps?.storage?.getAllData?.('${miniAppId}') || 
                     Promise.resolve({});
            },
            removeItem: (key) => {
              return window.parent.electronAPI?.miniApps?.storage?.removeItem?.('${miniAppId}', key) || 
                     Promise.resolve({ success: false });
            },
            clear: () => {
              return window.parent.electronAPI?.miniApps?.storage?.clear?.('${miniAppId}') || 
                     Promise.resolve({ success: false });
            },
            hasItem: (key) => {
              return window.parent.electronAPI?.miniApps?.storage?.hasItem?.('${miniAppId}', key) || 
                     Promise.resolve(false);
            },
            getStorageInfo: () => {
              return window.parent.electronAPI?.miniApps?.storage?.getStorageInfo?.('${miniAppId}') || 
                     Promise.resolve({ totalKeys: 0, totalSize: 0 });
            }
          };

          let storageCache = {};
          let cacheLoaded = false;
          
          const loadCache = async () => {
            try {
              const allData = await storageAPI.getAllData();
              storageCache = {};
              Object.keys(allData).forEach(key => {
                if (allData[key] && allData[key].data !== undefined) {
                  storageCache[key] = JSON.stringify(allData[key].data);
                }
              });
              cacheLoaded = true;
            } catch (error) {
              console.warn('Failed to load storage cache:', error);
              cacheLoaded = true;
            }
          };
          
          loadCache();

          const localStorageReplacement = {
            getItem: function(key) {
              if (!cacheLoaded) {
                console.warn('Storage cache not loaded yet, returning null for key:', key);
                return null;
              }
              return storageCache[key] || null;
            },
            
            setItem: function(key, value) {
              storageCache[key] = String(value);
              
              try {
                const parsedValue = JSON.parse(value);
                storageAPI.setItem(key, parsedValue).catch(error => {
                  console.error('Failed to persist localStorage item:', error);
                  delete storageCache[key];
                });
              } catch (parseError) {
                storageAPI.setItem(key, value).catch(error => {
                  console.error('Failed to persist localStorage item:', error);
                  delete storageCache[key];
                });
              }
            },
            
            removeItem: function(key) {
              delete storageCache[key];
              storageAPI.removeItem(key).catch(error => {
                console.error('Failed to remove localStorage item:', error);
              });
            },
            
            clear: function() {
              storageCache = {};
              storageAPI.clear().catch(error => {
                console.error('Failed to clear localStorage:', error);
              });
            },
            
            key: function(index) {
              const keys = Object.keys(storageCache);
              return keys[index] || null;
            },
            
            get length() {
              return Object.keys(storageCache).length;
            }
          };

          const handler = {
            get: function(target, prop) {
              if (prop in target) {
                return target[prop];
              }
              if (typeof prop === 'string' && /^\\d+$/.test(prop)) {
                return target.key(parseInt(prop));
              }
              return target.getItem(prop);
            },
            
            set: function(target, prop, value) {
              if (prop in target || typeof prop === 'symbol') {
                target[prop] = value;
                return true;
              }
              target.setItem(prop, value);
              return true;
            },
            
            deleteProperty: function(target, prop) {
              if (prop in target) {
                delete target[prop];
                return true;
              }
              target.removeItem(prop);
              return true;
            },
            
            ownKeys: function(target) {
              return Object.keys(storageCache);
            },
            
            has: function(target, prop) {
              return prop in target || prop in storageCache;
            },
            
            getOwnPropertyDescriptor: function(target, prop) {
              if (prop in target) {
                return Object.getOwnPropertyDescriptor(target, prop);
              }
              if (prop in storageCache) {
                return {
                  enumerable: true,
                  configurable: true,
                  value: storageCache[prop]
                };
              }
              return undefined;
            }
          };

          window.localStorage = new Proxy(localStorageReplacement, handler);
          
          window.miniAppAPI = {
            storage: storageAPI,
            tags: {
              getAll: () => {
                return window.parent.electronAPI?.tags?.getAll?.() || 
                       Promise.resolve([]);
              },
              create: (tagData) => {
                return window.parent.electronAPI?.tags?.create?.(tagData) || 
                       Promise.resolve(null);
              }
            },
            utils: {
              showNotification: (title, body) => {
                if (window.parent.Notification) {
                  new window.parent.Notification(title, { body });
                }
              },
              getAppInfo: () => ({
                platform: 'embedded',
                version: '1.0.0'
              }),
              getMiniAppId: () => '${miniAppId}'
            }
          };
        })();
      </script>
    `;
    
    return content.replace('</body>', scriptInjection + '</body>');
  };

  return (
    <div className="miniapp-container" style={{ position: 'relative' }}>
      {/* Sketch overlay for miniapp container */}
      <ReactRough
        width="100%"
        height="100px"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 2
        }}
      >
        <Line
          x1={0}
          y1={99}
          x2="100%"
          y2={99}
          options={{
            roughness: 0.8,
            stroke: '#e5e7eb',
            strokeWidth: 2
          }}
        />
      </ReactRough>

      <div className="miniapp-header">
        <div className="miniapp-info">
          <span className="miniapp-icon">{miniApp.icon || '📱'}</span>
          <span className="miniapp-title">{miniApp.title}</span>
        </div>
        <div className="miniapp-controls">
          <button className="btn btn-secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
      
      <div className="miniapp-content">
        <iframe
          ref={iframeRef}
          src="about:blank"
          frameBorder="0"
          style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
        />
      </div>
    </div>
  );
};

export default MiniAppContainer;