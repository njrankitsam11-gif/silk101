import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
let dbPath = join(__dirname, 'database.db');

// In-Memory Database Fallbacks for Serverless context (Vercel)
const MOCK_CATEGORIES = [
  { id: 1, name: 'Ikat', description: 'Tie-dyed warp and weft patterns' },
  { id: 2, name: 'Chanderi', description: 'Sheer texture and gold border' },
  { id: 3, name: 'Kanjivaram', description: 'Heavy silk and wide borders' },
  { id: 4, name: 'Tissue Silk', description: 'Woven with metallic gold threads' }
];

const MOCK_ARTISANS = [
  { id: 1, name: 'Smt. Sebati Mohanty', location: 'Nuapatna, Odisha', experience_years: 32, bio: 'Master weaver specializing in sacred Khandua scripture patterns.', status: 'active' },
  { id: 2, name: 'Shri Ranjan Meher', location: 'Maniabandha, Odisha', experience_years: 28, bio: 'Expert in mathematical geometric double-Ikat patterns.', status: 'active' },
  { id: 3, name: 'Shri Kailash Meher', location: 'Puri, Odisha', experience_years: 40, bio: 'Renowned for complex mythological and temple architecture drapes.', status: 'active' }
];

const MOCK_INVENTORY = [
  {
    id: 1,
    name: 'Nuapatana Khandua Ikat Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    artisan_exp: 32,
    artisan_bio: 'Master weaver specializing in sacred Khandua scripture patterns and traditional wooden looms.',
    price_fiat: 150000,
    stock_status: 'available',
    material: '100% Pure Mulberry Silk',
    weaving_time_days: 28,
    description: 'A masterpiece of Nuapatna, tie-dyed with organic crimson and gold. Highlights a stylized geometric gold elephant Zari motif on the Pallu.',
    color_hue: 0,
    color_saturation: 1.0
  },
  {
    id: 2,
    name: 'Sambalpuri Lotus Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    artisan_exp: 28,
    artisan_bio: 'Expert in mathematical geometric double-Ikat patterns and complex natural dyes.',
    price_fiat: 135000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 24,
    description: 'Traditional Sambalpuri Lotus. Bold raspberry red background with gold-plated silver thread Zari portraying organic lotus petals.',
    color_hue: 320,
    color_saturation: 1.2
  },
  {
    id: 3,
    name: 'Kotpad Temple Border Saree',
    category_id: 2,
    category_name: 'Chanderi',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    artisan_exp: 32,
    artisan_bio: 'Master weaver specializing in sacred Khandua scripture patterns and traditional wooden looms.',
    price_fiat: 125000,
    stock_status: 'available',
    material: 'Organic Cotton',
    weaving_time_days: 35,
    description: 'Kotpad tribal style, featuring deep forest green with ocher oad-tree roots temple borders. Colored using local organic tree barks.',
    color_hue: 165,
    color_saturation: 1.2
  },
  {
    id: 4,
    name: 'Konark Sundial Relic Saree',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    artisan_exp: 28,
    artisan_bio: 'Expert in mathematical geometric double-Ikat patterns and complex natural dyes.',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Tussar Silk',
    weaving_time_days: 30,
    description: 'Dedicated to the Sun God of Konark. The Pallu features a highly detailed, procedurally woven stone relief wheel representing time divisions.',
    color_hue: 260,
    color_saturation: 1.3
  },
  {
    id: 5,
    name: 'Lord Jagannath Provenance Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Puri, Odisha',
    artisan_exp: 40,
    artisan_bio: 'Renowned for complex mythological and temple architecture drapes and double-layer weaves.',
    price_fiat: 205000,
    stock_status: 'available',
    material: 'Khandua Silk',
    weaving_time_days: 42,
    description: 'Sacred Khandua style. Features Balabhadra, Subhadra, and Lord Jagannath in holy shrine, with vertical lotus borders. Woven with ocher and vermilion silk.',
    color_hue: 45,
    color_saturation: 0.8
  },
  {
    id: 6,
    name: 'Maniabandha Grid Saree',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Puri, Odisha',
    artisan_exp: 40,
    artisan_bio: 'Renowned for complex mythological and temple architecture drapes and double-layer weaves.',
    price_fiat: 185000,
    stock_status: 'available',
    material: 'Fine Silk Blend',
    weaving_time_days: 28,
    description: 'Classic Maniabandha grid layout. Geometric diamonds and checkerboard squares representing mathematical symmetry in handloom.',
    color_hue: 30,
    color_saturation: 1.1
  }
];

const MOCK_ENQUIRIES = [
  { id: 1, item_id: 1, item_name: 'Nuapatana Khandua Ikat Saree', customer_name: 'Aditi Rao', customer_email: 'aditi@example.com', message: 'I would love to schedule a custom sizing enquiry for the Khandua Saree.', status: 'pending', created_at: new Date().toISOString() }
];

const MOCK_ARTICLES = [
  {
    id: 1,
    slug: 'buy-khandua-silk-sarees-online',
    title: 'Buy Khandua Silk Sarees Online — A Global Buyer’s Guide',
    meta_description: 'Are you looking to buy authentic Khandua Silk sarees online from USA, UK, Canada or UAE? Read our comprehensive 2026 handloom checklist, price guides, and weaver certificate verification.',
    content_html: `<article>
      <h1>Buy Khandua Silk Sarees Online — A Global Buyer’s Guide</h1>
      <p class="intro">For the global Indian diaspora, holding a piece of home is a feeling beyond words. The Khandua Silk saree, originating from the ancient village of Nuapatna in Odisha, represents over eight centuries of sacred weaving heritage.</p>
    </article>`,
    topic_keyword: 'buy Khandua silk online',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  }
];

class MockStatement {
  constructor(sql) {
    this.sql = sql.trim().toLowerCase();
  }

  run(...args) {
    console.log('MockStatement.run:', this.sql, args);
    if (this.sql.includes('insert into inventory')) {
      const [name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation] = args;
      const newId = MOCK_INVENTORY.length > 0 ? Math.max(...MOCK_INVENTORY.map(i => i.id)) + 1 : 1;
      const artisan = MOCK_ARTISANS.find(a => a.id === artisan_id) || {};
      const category = MOCK_CATEGORIES.find(c => c.id === category_id) || {};
      MOCK_INVENTORY.push({
        id: newId,
        name,
        category_id,
        category_name: category.name || 'Ikat',
        artisan_id,
        artisan_name: artisan.name || 'Smt. Sebati Mohanty',
        artisan_location: artisan.location || 'Nuapatna, Odisha',
        price_fiat,
        stock_status: stock_status || 'available',
        material,
        weaving_time_days,
        description,
        color_hue: color_hue || 0,
        color_saturation: color_saturation || 1.0
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('insert into enquiries')) {
      const [item_id, customer_name, customer_email, message] = args;
      const newId = MOCK_ENQUIRIES.length > 0 ? Math.max(...MOCK_ENQUIRIES.map(e => e.id)) + 1 : 1;
      const item = MOCK_INVENTORY.find(i => i.id === item_id) || {};
      MOCK_ENQUIRIES.push({
        id: newId,
        item_id,
        item_name: item.name || 'Saree',
        customer_name,
        customer_email,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('insert into articles')) {
      const [slug, title, meta_description, content_html, topic_keyword, target_locale, status] = args;
      const newId = MOCK_ARTICLES.length > 0 ? Math.max(...MOCK_ARTICLES.map(a => a.id)) + 1 : 1;
      MOCK_ARTICLES.push({
        id: newId,
        slug,
        title,
        meta_description,
        content_html,
        topic_keyword,
        target_locale,
        status,
        created_at: new Date().toISOString()
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('update inventory')) {
      const id = args[args.length - 1];
      const item = MOCK_INVENTORY.find(i => i.id == id);
      if (item) {
        const [name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation] = args;
        if (name !== undefined && name !== null) item.name = name;
        if (category_id !== undefined && category_id !== null) item.category_id = category_id;
        if (artisan_id !== undefined && artisan_id !== null) item.artisan_id = artisan_id;
        if (price_fiat !== undefined && price_fiat !== null) item.price_fiat = price_fiat;
        if (stock_status !== undefined && stock_status !== null) item.stock_status = stock_status;
        if (material !== undefined && material !== null) item.material = material;
        if (weaving_time_days !== undefined && weaving_time_days !== null) item.weaving_time_days = weaving_time_days;
        if (description !== undefined && description !== null) item.description = description;
        if (color_hue !== undefined && color_hue !== null) item.color_hue = color_hue;
        if (color_saturation !== undefined && color_saturation !== null) item.color_saturation = color_saturation;
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (this.sql.includes('update enquiries')) {
      const [status, id] = args;
      const enq = MOCK_ENQUIRIES.find(e => e.id == id);
      if (enq) {
        enq.status = status;
        return { changes: 1 };
      }
      return {
        changes: 0
      };
    }
    if (this.sql.includes('update articles')) {
      const id = args[args.length - 1];
      const art = MOCK_ARTICLES.find(a => a.id == id);
      if (art) {
        const [title, meta_description, content_html, status] = args;
        if (title !== undefined && title !== null) art.title = title;
        if (meta_description !== undefined && meta_description !== null) art.meta_description = meta_description;
        if (content_html !== undefined && content_html !== null) art.content_html = content_html;
        if (status !== undefined && status !== null) art.status = status;
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (this.sql.includes('delete from inventory')) {
      const id = args[0];
      const idx = MOCK_INVENTORY.findIndex(i => i.id == id);
      if (idx !== -1) {
        MOCK_INVENTORY.splice(idx, 1);
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (this.sql.includes('delete from articles')) {
      const id = args[0];
      const idx = MOCK_ARTICLES.findIndex(a => a.id == id);
      if (idx !== -1) {
        MOCK_ARTICLES.splice(idx, 1);
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    return { changes: 1 };
  }

  all(...args) {
    console.log('MockStatement.all:', this.sql, args);
    if (this.sql.includes('inventory')) {
      const mockVars = {
        'Ikat': [
          { name: "Standard 80-Count Weave", price_delta: 0 },
          { name: "Premium 120-Count Fine Double-Warp Weave", price_delta: 18000 },
          { name: "Gilded Silver Zari Border Custom Pallu", price_delta: 35000 }
        ],
        'Chanderi': [
          { name: "Traditional Silk-Cotton Sheer Blend", price_delta: 0 },
          { name: "Pure Silk-Tissue Warp border variation", price_delta: 12000 },
          { name: "Heavy Gold-Thread Zari Motif border variation", price_delta: 25000 }
        ],
        'Kanjivaram': [
          { name: "Standard Kanjivaram 2-Ply Silk Weave", price_delta: 0 },
          { name: "Exquisite 3-Ply Gold Zari Brocade Temple Border", price_delta: 25000 }
        ],
        'Tissue Silk': [
          { name: "Fine Golden Tissue Silk Weave", price_delta: 0 },
          { name: "Heavily Ornamented Gold-Thread Zari Pallu Relic", price_delta: 30000 }
        ]
      };
      return MOCK_INVENTORY.map(item => {
        const cat = item.category_name || 'Ikat';
        const variations = mockVars[cat] || mockVars['Ikat'];
        return { ...item, variations };
      });
    }
    if (this.sql.includes('artisans')) {
      return MOCK_ARTISANS;
    }
    if (this.sql.includes('categories')) {
      return MOCK_CATEGORIES;
    }
    if (this.sql.includes('enquiries')) {
      return MOCK_ENQUIRIES;
    }
    if (this.sql.includes('articles')) {
      return MOCK_ARTICLES;
    }
    return [];
  }

  get(...args) {
    console.log('MockStatement.get:', this.sql, args);
    if (this.sql.includes('articles')) {
      const slug = args[0];
      return MOCK_ARTICLES.find(a => a.slug === slug) || null;
    }
    return null;
  }
}

class MockDatabase {
  prepare(sql) {
    return new MockStatement(sql);
  }
  exec(sql) {
    console.log('MockDatabase.exec:', sql);
    if (sql.includes('DELETE FROM')) {
      if (sql.includes('inventory')) MOCK_INVENTORY.length = 0;
      if (sql.includes('enquiries')) MOCK_ENQUIRIES.length = 0;
      if (sql.includes('categories')) MOCK_CATEGORIES.length = 0;
      if (sql.includes('artisans')) MOCK_ARTISANS.length = 0;
      if (sql.includes('articles')) MOCK_ARTICLES.length = 0;
    }
  }
  pragma(sql) {
    console.log('MockDatabase.pragma:', sql);
  }
}

let db;

// Enable serverless write path for Vercel
if (process.env.VERCEL || process.env.NOW_BUILDER) {
  console.log('Running on Vercel: Initializing in-memory mock database');
  db = new MockDatabase();
} else {
  try {
    const Database = (await import('better-sqlite3')).default;
    dbPath = join(__dirname, 'database.db');
    
    // Serverless fallback copy for local Vercel CLI tests
    if (__dirname.includes('/var/task') || __dirname.includes('/tmp')) {
      const targetPath = '/tmp/database.db';
      if (!fs.existsSync(targetPath)) {
        const srcPath = join(__dirname, 'database.db');
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, targetPath);
        }
      }
      dbPath = targetPath;
    }
    
    db = new Database(dbPath);
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
        stock_status TEXT DEFAULT 'available',
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
        status TEXT DEFAULT 'pending',
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
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('Failed to load better-sqlite3, falling back to in-memory database:', err);
    db = new MockDatabase();
  }
}

export default db;
