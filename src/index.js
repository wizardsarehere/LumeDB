const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');

class LumeDB {
    constructor(options = {}) {
        // Get the module's root directory
        this.moduleRoot = path.dirname(require.resolve('../package.json'));
        this.folder = path.join(this.moduleRoot, 'database');
        this.filename = options.file || 'data';
        this.readable = options.readable || false;
        this.noBlankData = options.noBlankData || false;
        this.checkUpdates = options.checkUpdates || false;
        this.backupInterval = options.backupInterval || 5; // Default 5 minutes
        
        // Create database folder if it doesn't exist
        if (!fs.existsSync(this.folder)) {
            fs.mkdirSync(this.folder, { recursive: true });
        }
        
        this.filePath = path.join(this.folder, this.filename + '.json');
        this.backupPath = path.join(this.folder, this.filename + '.backup.json');
        this.data = {};
        
        this.initializeDatabase();
        this.startBackupInterval();
    }

    startBackupInterval() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        this.backupTimer = setInterval(() => this.createBackup(), this.backupInterval * 60 * 1000);
    }

    setBackupInterval(minutes) {
        if (typeof minutes !== 'number' || minutes <= 0) {
            throw new Error('Backup interval must be a positive number');
        }
        this.backupInterval = minutes;
        this.startBackupInterval();
    }

    initializeDatabase() {
        if (!fs.existsSync(this.folder)) {
            fs.mkdirSync(this.folder, { recursive: true });
        }
        this.loadDatabase();
    }

    loadDatabase() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf-8');
                this.validateData(data);
                this.data = this.parseData(data);
                this.createBackup();
            } else if (fs.existsSync(this.backupPath)) {
                const backupData = fs.readFileSync(this.backupPath, 'utf-8');
                this.validateData(backupData);
                this.data = this.parseData(backupData);
                this.save();
            } else {
                this.save();
            }
        } catch (error) {
            if (fs.existsSync(this.backupPath)) {
                const backupData = fs.readFileSync(this.backupPath, 'utf-8');
                this.validateData(backupData);
                this.data = this.parseData(backupData);
                this.save();
            } else {
                this.data = {};
                this.save();
            }
        }
    }

    parseData(data) {
        return JSON.parse(data || '{}');
    }

    stringifyData(data) {
        return JSON.stringify(data, null, this.readable ? 2 : 0);
    }

    validateData(data) {
        try {
            JSON.parse(data);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }

    createBackup() {
        const data = this.stringifyData(this.data);
        fs.writeFileSync(this.backupPath, data);
    }

    save() {
        const tempPath = path.join(this.folder, this.filename + '.temp.json');
        const data = this.stringifyData(this.data);
        
        fs.writeFileSync(tempPath, data);
        this.validateData(fs.readFileSync(tempPath, 'utf-8'));
        fs.moveSync(tempPath, this.filePath, { overwrite: true });
        this.createBackup();
    }

    // Helper function to get nested object
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // Helper function to set nested object
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!(key in current)) {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
        return obj;
    }

    // Helper function to delete nested object
    deleteNestedValue(obj, path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
        
        if (target && target[lastKey] !== undefined) {
            delete target[lastKey];
            if (this.noBlankData) {
                // Clean up empty objects
                keys.reverse().forEach((key, index) => {
                    const parent = keys.slice(0, -(index + 1)).reduce((current, k) => current[k], obj);
                    if (parent && Object.keys(parent[key]).length === 0) {
                        delete parent[key];
                    }
                });
            }
            return true;
        }
        return false;
    }

    // Synchronous methods
    set(key, value) {
        this.data = this.setNestedValue(this.data, key, value);
        this.save();
        return value;
    }

    get(key) {
        return this.fetch(key);
    }

    fetch(key) {
        return this.getNestedValue(this.data, key);
    }

    delete(key) {
        const result = this.deleteNestedValue(this.data, key);
        this.save();
        return result;
    }

    // Async methods
    async setAsync(key, value) {
        return this.set(key, value);
    }

    async getAsync(key) {
        return this.get(key);
    }

    async fetchAsync(key) {
        return this.fetch(key);
    }

    async deleteAsync(key) {
        return this.delete(key);
    }

    async push(key, value) {
        const array = this.get(key) || [];
        if (!Array.isArray(array)) {
            throw new Error('Target is not an array');
        }
        array.push(value);
        this.set(key, array);
        return array;
    }

    async unpush(key, value) {
        const array = this.get(key) || [];
        if (!Array.isArray(array)) {
            throw new Error('Target is not an array');
        }
        const newArray = array.filter(item => !_.isEqual(item, value));
        this.set(key, newArray);
        return newArray;
    }

    async delByPriority(key, priority) {
        const array = this.get(key) || [];
        if (!Array.isArray(array)) {
            throw new Error('Target is not an array');
        }
        array.splice(priority - 1, 1);
        this.set(key, array);
        return array;
    }

    async setByPriority(key, value, priority) {
        const array = this.get(key) || [];
        if (!Array.isArray(array)) {
            throw new Error('Target is not an array');
        }
        array[priority - 1] = value;
        this.set(key, array);
        return array;
    }

    has(key) {
        return this.getNestedValue(this.data, key) !== undefined;
    }

    deleteAll() {
        this.data = {};
        this.save();
        return true;
    }

    all() {
        return this.data;
    }

    setReadable(value) {
        this.readable = value;
        this.save();
    }

    noBlankData(value) {
        this.noBlankData = value;
    }

    setFolder(folder) {
        this.folder = folder;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        this.filePath = path.join(folder, this.filename + '.json');
        this.backupPath = path.join(folder, this.filename + '.backup.json');
        this.initializeDatabase();
    }

    setFile(filename) {
        this.filename = filename;
        this.filePath = path.join(this.folder, filename + '.json');
        this.backupPath = path.join(this.folder, filename + '.backup.json');
        this.initializeDatabase();
    }

    setCheckUpdates(value) {
        this.checkUpdates = value;
    }
}

module.exports = LumeDB;