const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs').promises;

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'superapp.db');
  }

  async initialize() {
    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      this.db = new sqlite3.Database(this.dbPath);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Tags table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#3B82F6',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // MiniApps table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS miniapps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            version TEXT DEFAULT '1.0.0',
            path TEXT NOT NULL,
            icon TEXT,
            enabled BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // MiniApp tags relationship
        this.db.run(`
          CREATE TABLE IF NOT EXISTS miniapp_tags (
            miniapp_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (miniapp_id, tag_id),
            FOREIGN KEY (miniapp_id) REFERENCES miniapps(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // Tag operations
  async getAllTags() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM tags ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createTag(tagData) {
    const { name, color = '#3B82F6', description = '' } = tagData;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO tags (name, color, description) VALUES (?, ?, ?)',
        [name, color, description],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, color, description });
        }
      );
    });
  }

  async updateTag(id, tagData) {
    const { name, color, description } = tagData;
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE tags SET name = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, color, description, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, name, color, description });
        }
      );
    });
  }

  async deleteTag(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM tags WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  // MiniApp operations
  async getAllMiniApps() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, GROUP_CONCAT(t.name) as tags
        FROM miniapps m
        LEFT JOIN miniapp_tags mt ON m.id = mt.miniapp_id
        LEFT JOIN tags t ON mt.tag_id = t.id
        GROUP BY m.id
        ORDER BY m.name
      `;
      
      this.db.all(query, (err, rows) => {
        if (err) reject(err);
        else {
          const miniapps = rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : []
          }));
          resolve(miniapps);
        }
      });
    });
  }

  async createMiniApp(miniAppData) {
    const { name, description, version, path: appPath, icon, enabled = true } = miniAppData;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO miniapps (name, description, version, path, icon, enabled) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, version, appPath, icon, enabled],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...miniAppData });
        }
      );
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }
}

module.exports = { DatabaseManager };