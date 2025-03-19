# LumeDB

A lightweight, fast, and reliable JSON database for Node.js with nested object support and automatic backup system.

## Features

- 🚀 **Fast & Lightweight**: In-memory caching with persistent storage
- 🔒 **Safe & Reliable**: Automatic backup system and data validation
- 🌳 **Nested Objects**: Support for deep object operations using dot notation
- ⚡ **Sync & Async**: Both synchronous and asynchronous API support
- 🛡️ **Data Protection**: Temporary file writing and validation before saving
- 🧹 **Auto Cleanup**: Optional removal of empty objects (noBlankData)
- 📖 **Readable Format**: Optional pretty-printing for stored data
- ⏰ **Configurable Backups**: Customizable backup interval

## Installation

```bash
npm install lumedb
```

## Quick Start

```javascript
const LumeDB = require('lumedb');
const db = new LumeDB();

// Synchronous Operations
db.set('user.name', 'John');
console.log(db.get('user.name')); // John
console.log(db.fetch('user')); // { name: 'John' }
db.delete('user.name');

// Asynchronous Operations
await db.setAsync('config.theme', 'dark');
const theme = await db.getAsync('config.theme');
await db.deleteAsync('config.theme');

// Array Operations
await db.push('users', { id: 1, name: 'Alice' });
await db.push('users', { id: 2, name: 'Bob' });
await db.unpush('users', { id: 1, name: 'Alice' });
```

## API Reference

### Basic Operations

#### Synchronous
- `db.set(key, value)`: Set a value
- `db.get(key)`: Get a value
- `db.fetch(key)`: Alias for get
- `db.delete(key)`: Delete a value
- `db.has(key)`: Check if key exists

#### Asynchronous
- `db.setAsync(key, value)`: Set a value
- `db.getAsync(key)`: Get a value
- `db.fetchAsync(key)`: Alias for getAsync
- `db.deleteAsync(key)`: Delete a value

### Array Operations
- `db.push(key, value)`: Add value to array
- `db.unpush(key, value)`: Remove value from array
- `db.delByPriority(key, priority)`: Delete item by index
- `db.setByPriority(key, value, priority)`: Set item by index

### Database Management
- `db.all()`: Get all data
- `db.deleteAll()`: Clear all data
- `db.setReadable(boolean)`: Toggle pretty-printing
- `db.noBlankData(boolean)`: Toggle auto-cleanup
- `db.setFolder(path)`: Set database folder
- `db.setFile(name)`: Set database filename
- `db.setCheckUpdates(boolean)`: Toggle update checking
- `db.setBackupInterval(minutes)`: Set backup interval in minutes

## Configuration

```javascript
const db = new LumeDB({
  folder: './database', // Database folder
  file: 'mydb', // Database filename
  readable: true, // Pretty-print stored data
  noBlankData: true, // Remove empty objects
  checkUpdates: true, // Check for updates
  backupInterval: 5 // Backup interval in minutes (default: 5)
});
```

## Data Safety Features

1. **Automatic Backups**: Creates backup files at configurable intervals (default: 5 minutes)
2. **Safe Writing**: Uses temporary files for atomic writes
3. **Data Validation**: Validates data format before saving
4. **Backup Recovery**: Automatically recovers from backup if main file is corrupted

## Best Practices

1. Use dot notation for nested operations:
   ```javascript
   db.set('users.123.profile.name', 'John');
   ```

2. Enable `noBlankData` to keep your database clean:
   ```javascript
   db.noBlankData(true);
   ```

3. Configure backup interval based on your needs:
   ```javascript
   db.setBackupInterval(15); // Backup every 15 minutes
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.