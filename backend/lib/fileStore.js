// ====================================================
//  lib/fileStore.js
//  Simple JSON file-based persistence layer.
//  Wraps read/write so routes stay clean.
// ====================================================

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Read a JSON data file.
 * @param {string} filename  e.g. 'products.json'
 * @returns {any}
 */
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[fileStore] Read error for ${filename}:`, err.message);
    throw new Error(`Failed to read ${filename}`);
  }
}

/**
 * Write data to a JSON file atomically (write-then-rename).
 * @param {string} filename  e.g. 'products.json'
 * @param {any}    data
 */
function writeJSON(filename, data) {
  const filePath  = path.join(DATA_DIR, filename);
  const tmpPath   = filePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`[fileStore] Write error for ${filename}:`, err.message);
    // Clean up orphaned temp file if it exists
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    throw new Error(`Failed to write ${filename}`);
  }
}

/**
 * Create a dated backup of a data file using a simple
 * copy to data/backups/. Returns the backup filename.
 * @param {string} filename
 * @returns {string}
 */
function createBackup(filename) {
  const backupDir = path.join(DATA_DIR, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp   = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName  = `${filename.replace('.json', '')}_${timestamp}.json`;
  const srcPath     = path.join(DATA_DIR, filename);
  const destPath    = path.join(backupDir, backupName);

  try {
    fs.copyFileSync(srcPath, destPath);
    // Keep only the 20 most recent backups for this file prefix
    pruneBackups(backupDir, filename.replace('.json', ''), 20);
    return backupName;
  } catch (err) {
    console.warn(`[fileStore] Backup failed for ${filename}:`, err.message);
    return null;
  }
}

/**
 * List available backups for a given data file.
 * @param {string} prefix  e.g. 'products'
 * @returns {string[]}
 */
function listBackups(prefix) {
  const backupDir = path.join(DATA_DIR, 'backups');
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith(prefix + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
}

/**
 * Restore a backup by name, returning the parsed content.
 * @param {string} backupFilename
 * @returns {any}
 */
function restoreBackup(backupFilename) {
  const backupDir  = path.join(DATA_DIR, 'backups');
  const backupPath = path.join(backupDir, backupFilename);
  if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');
  const raw = fs.readFileSync(backupPath, 'utf8');
  return JSON.parse(raw);
}

// Keep only the N most recent backups for a given prefix
function pruneBackups(backupDir, prefix, keep = 20) {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(prefix + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
  files.slice(keep).forEach(f => {
    try { fs.unlinkSync(path.join(backupDir, f)); } catch (_) {}
  });
}

module.exports = { readJSON, writeJSON, createBackup, listBackups, restoreBackup };
