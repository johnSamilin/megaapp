const fs = require('fs').promises;
const { EncryptionManager } = require('./encryption-manager');
const path = require('path');
const { app } = require('electron');

class DataManager {
  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'miniapp-data');
    this.initialized = false;
    this.encryptionManager = new EncryptionManager();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
      this.initialized = true;
      console.log('DataManager initialized at:', this.dataPath);
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      throw error;
    }
  }

  getMiniAppDataPath(miniAppId) {
    return path.join(this.dataPath, miniAppId);
  }

  async ensureMiniAppDirectory(miniAppId) {
    const miniAppPath = this.getMiniAppDataPath(miniAppId);
    try {
      await fs.mkdir(miniAppPath, { recursive: true });
      return miniAppPath;
    } catch (error) {
      console.error(`Failed to create directory for miniapp ${miniAppId}:`, error);
      throw error;
    }
  }

  // Store data for a specific miniapp
  async storeData(miniAppId, key, data) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const miniAppPath = await this.ensureMiniAppDirectory(miniAppId);
      const filePath = path.join(miniAppPath, `${key}.json`);
      
      const dataToStore = {
        key,
        data: this.encryptionManager.encrypt(data),
        timestamp: new Date().toISOString(),
        miniAppId
      };

      await fs.writeFile(filePath, JSON.stringify(dataToStore, null, 2), 'utf8');
      return { success: true, key, timestamp: dataToStore.timestamp };
    } catch (error) {
      console.error(`Failed to store data for ${miniAppId}:`, error);
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }

  // Retrieve data for a specific miniapp
  async getData(miniAppId, key) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const miniAppPath = this.getMiniAppDataPath(miniAppId);
      const filePath = path.join(miniAppPath, `${key}.json`);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      const storedData = JSON.parse(fileContent);
      
      // Verify the data belongs to the requesting miniapp
      if (storedData.miniAppId !== miniAppId) {
        throw new Error('Access denied: Data belongs to different miniapp');
      }

      // Decrypt data if encrypted
      const decryptedData = this.encryptionManager.decrypt(storedData.data);
      return {
        key: storedData.key,
        data: decryptedData,
        timestamp: storedData.timestamp
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      console.error(`Failed to get data for ${miniAppId}:`, error);
      throw new Error(`Failed to retrieve data: ${error.message}`);
    }
  }

  // Get all keys for a specific miniapp
  async getAllKeys(miniAppId) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const miniAppPath = this.getMiniAppDataPath(miniAppId);
      
      try {
        const files = await fs.readdir(miniAppPath);
        return files
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
      } catch (error) {
        if (error.code === 'ENOENT') {
          return []; // Directory doesn't exist yet
        }
        throw error;
      }
    } catch (error) {
      console.error(`Failed to get keys for ${miniAppId}:`, error);
      throw new Error(`Failed to retrieve keys: ${error.message}`);
    }
  }

  // Get all data for a specific miniapp
  async getAllData(miniAppId) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const keys = await this.getAllKeys(miniAppId);
      const allData = {};

      for (const key of keys) {
        try {
          const data = await this.getData(miniAppId, key);
          if (data) {
            allData[key] = data;
          }
        } catch (error) {
          console.warn(`Failed to load data for key ${key}:`, error);
        }
      }

      return allData;
    } catch (error) {
      console.error(`Failed to get all data for ${miniAppId}:`, error);
      throw new Error(`Failed to retrieve all data: ${error.message}`);
    }
  }

  // Delete specific data for a miniapp
  async deleteData(miniAppId, key) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const miniAppPath = this.getMiniAppDataPath(miniAppId);
      const filePath = path.join(miniAppPath, `${key}.json`);
      
      // Verify the data exists and belongs to the requesting miniapp
      const existingData = await this.getData(miniAppId, key);
      if (!existingData) {
        return { success: false, message: 'Data not found' };
      }

      await fs.unlink(filePath);
      return { success: true, key };
    } catch (error) {
      console.error(`Failed to delete data for ${miniAppId}:`, error);
      throw new Error(`Failed to delete data: ${error.message}`);
    }
  }

  // Clear all data for a specific miniapp
  async clearAllData(miniAppId) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const miniAppPath = this.getMiniAppDataPath(miniAppId);
      
      try {
        const files = await fs.readdir(miniAppPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          await fs.unlink(path.join(miniAppPath, file));
        }

        return { success: true, deletedCount: jsonFiles.length };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return { success: true, deletedCount: 0 }; // Directory doesn't exist
        }
        throw error;
      }
    } catch (error) {
      console.error(`Failed to clear data for ${miniAppId}:`, error);
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }

  // Check if data exists
  async hasData(miniAppId, key) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const data = await this.getData(miniAppId, key);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  // Get storage info for a miniapp
  async getStorageInfo(miniAppId) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized');
    }

    try {
      const keys = await this.getAllKeys(miniAppId);
      const miniAppPath = this.getMiniAppDataPath(miniAppId);
      
      let totalSize = 0;
      const fileInfo = [];

      for (const key of keys) {
        try {
          const filePath = path.join(miniAppPath, `${key}.json`);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          fileInfo.push({
            key,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          console.warn(`Failed to get stats for ${key}:`, error);
        }
      }

      return {
        miniAppId,
        totalKeys: keys.length,
        totalSize,
        files: fileInfo
      };
    } catch (error) {
      console.error(`Failed to get storage info for ${miniAppId}:`, error);
      throw new Error(`Failed to get storage info: ${error.message}`);
    }
  }
}

module.exports = { DataManager };