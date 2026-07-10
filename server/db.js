import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
let dbPath = join(__dirname, 'database.db');

// Enable serverless write path for Vercel
if (process.env.VERCEL || process.env.NOW_BUILDER || __dirname.includes('/var/task') || __dirname.includes('/tmp')) {
  const targetPath = '/tmp/database.db';
  try {
    if (!fs.existsSync(targetPath)) {
      const srcPath = join(__dirname, 'database.db');
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, targetPath);
        console.log('Copied database to writable path /tmp/database.db');
      }
    }
    dbPath = targetPath;
  } catch (err) {
    console.error('Failed to copy SQLite database to /tmp:', err);
  }
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS artisans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    experience_years INTEGER NOT NULL,
    bio TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    artisan_id INTEGER,
    price_fiat INTEGER NOT NULL,
    stock_status TEXT DEFAULT 'available', -- 'available', 'reserved', 'sold'
    material TEXT NOT NULL,
    weaving_time_days INTEGER NOT NULL,
    description TEXT,
    color_hue INTEGER DEFAULT 0,
    color_saturation REAL DEFAULT 1.0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'closed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_description TEXT,
    content_html TEXT NOT NULL,
    topic_keyword TEXT,
    target_locale TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'published'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
