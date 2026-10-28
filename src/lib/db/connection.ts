import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'tectranz_lms.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA foreign_keys = ON;');
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA synchronous = NORMAL;');
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Converts SQLite rows with null prototypes into plain objects
 * suitable for React Server Component -> Client Component boundary serialization.
 */
export function toPlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Execute a callback within an immediate transaction.
 */
export function withTransaction<T>(callback: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
