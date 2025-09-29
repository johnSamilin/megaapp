const crypto = require('crypto');
const { app } = require('electron');
const Store = require('electron-store');

class EncryptionManager {
  constructor() {
    this.store = new Store({
      name: 'encryption-config',
      encryptionKey: 'superapp-encryption-config'
    });
    this.masterKey = null;
    this.encryptionEnabled = this.store.get('encryptionEnabled', false);
  }

  // Set master password and derive encryption key
  setMasterPassword(password) {
    if (!password || password.length < 8) {
      throw new Error('Master password must be at least 8 characters long');
    }

    // Derive a key from the password using PBKDF2
    const salt = this.store.get('salt') || crypto.randomBytes(32);
    if (!this.store.get('salt')) {
      this.store.set('salt', salt);
    }

    this.masterKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    return true;
  }

  // Verify master password
  verifyMasterPassword(password) {
    if (!this.hasMasterPassword()) {
      return false;
    }

    try {
      const salt = this.store.get('salt');
      const testKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      
      // Compare with stored hash
      const storedHash = this.store.get('passwordHash');
      const testHash = crypto.createHash('sha256').update(testKey).digest('hex');
      
      if (testHash === storedHash) {
        this.masterKey = testKey;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  // Check if master password is set
  hasMasterPassword() {
    return this.store.has('passwordHash') && this.store.has('salt');
  }

  // Store password hash for verification
  storeMasterPasswordHash() {
    if (!this.masterKey) {
      throw new Error('Master key not set');
    }

    const hash = crypto.createHash('sha256').update(this.masterKey).digest('hex');
    this.store.set('passwordHash', hash);
  }

  // Enable/disable encryption
  setEncryptionEnabled(enabled) {
    this.encryptionEnabled = enabled;
    this.store.set('encryptionEnabled', enabled);
    
    if (enabled && !this.hasMasterPassword()) {
      throw new Error('Cannot enable encryption without master password');
    }
  }

  // Check if encryption is enabled
  isEncryptionEnabled() {
    return this.encryptionEnabled;
  }

  // Encrypt data
  encrypt(data) {
    if (!this.encryptionEnabled || !this.masterKey) {
      return data; // Return unencrypted if encryption is disabled
    }

    try {
      const dataString = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM('aes-256-gcm', this.masterKey);
      cipher.setAAD(Buffer.from('miniapp-data'));
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'aes-256-gcm'
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {
      return encryptedData; // Return as-is if not encrypted
    }

    if (!this.masterKey) {
      throw new Error('Master key not available for decryption');
    }

    try {
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.masterKey);
      decipher.setAAD(Buffer.from('miniapp-data'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - invalid password or corrupted data');
    }
  }

  // Change master password
  changeMasterPassword(oldPassword, newPassword) {
    if (!this.verifyMasterPassword(oldPassword)) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Generate new salt and key
    const newSalt = crypto.randomBytes(32);
    const newKey = crypto.pbkdf2Sync(newPassword, newSalt, 100000, 32, 'sha256');
    const newHash = crypto.createHash('sha256').update(newKey).digest('hex');

    // Store new credentials
    this.store.set('salt', newSalt);
    this.store.set('passwordHash', newHash);
    this.masterKey = newKey;

    return true;
  }

  // Remove master password and disable encryption
  removeMasterPassword() {
    this.store.delete('salt');
    this.store.delete('passwordHash');
    this.masterKey = null;
    this.setEncryptionEnabled(false);
  }

  // Get encryption status
  getEncryptionStatus() {
    return {
      enabled: this.encryptionEnabled,
      hasPassword: this.hasMasterPassword(),
      keyLoaded: this.masterKey !== null
    };
  }
}

module.exports = { EncryptionManager };