import db from './db.js';

// Clean out existing data (in order of dependencies)
db.exec(`
  DELETE FROM enquiries;
  DELETE FROM inventory;
  DELETE FROM categories;
  DELETE FROM artisans;
`);

// Insert Categories
const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
const catIkat = insertCategory.run('Ikat', 'Tie-dyed warp and weft patterns').lastInsertRowid;
const catChanderi = insertCategory.run('Chanderi', 'Sheer texture and gold border').lastInsertRowid;
const catKanjivaram = insertCategory.run('Kanjivaram', 'Heavy silk and wide borders').lastInsertRowid;
const catTissue = insertCategory.run('Tissue Silk', 'Woven with metallic gold threads').lastInsertRowid;

// Insert Artisans
const insertArtisan = db.prepare(`
  INSERT INTO artisans (name, location, experience_years, bio)
  VALUES (?, ?, ?, ?)
`);
const artSebati = insertArtisan.run('Smt. Sebati Mohanty', 'Nuapatna, Odisha', 32, 'Master weaver specializing in sacred Khandua scripture patterns.').lastInsertRowid;
const artRanjan = insertArtisan.run('Shri Ranjan Meher', 'Maniabandha, Odisha', 28, 'Expert in mathematical geometric double-Ikat patterns.').lastInsertRowid;
const artKailash = insertArtisan.run('Shri Kailash Meher', 'Puri, Odisha', 40, 'Renowned for complex mythological and temple architecture drapes.').lastInsertRowid;

// Insert Initial Inventory Items
const insertItem = db.prepare(`
  INSERT INTO inventory (name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertItem.run(
  'Nuapatana Khandua Ikat Saree',
  catIkat, artSebati, 150000, 'available',
  '100% Pure Mulberry Silk', 28,
  'A masterpiece of Nuapatna, tie-dyed with organic crimson and gold. Highlights a stylized geometric gold elephant Zari motif on the Pallu.'
);

insertItem.run(
  'Sambalpuri Lotus Saree',
  catIkat, artRanjan, 135000, 'available',
  'Mulberry Silk', 24,
  'Traditional Sambalpuri Lotus. Bold raspberry red background with gold-plated silver thread Zari portraying organic lotus petals.'
);

insertItem.run(
  'Kotpad Temple Border Saree',
  catIkat, artSebati, 125000, 'available',
  'Organic Cotton', 35,
  'Kotpad tribal style, featuring deep forest green with ocher oad-tree roots temple borders. Colored using local organic tree barks.'
);

insertItem.run(
  'Konark Sundial Relic Saree',
  catIkat, artRanjan, 175000, 'available',
  'Tussar Silk', 30,
  'Dedicated to the Sun God of Konark. The Pallu features a highly detailed, procedurally woven stone relief wheel representing time divisions.'
);

insertItem.run(
  'Lord Jagannath Provenance Saree',
  catIkat, artKailash, 205000, 'available',
  'Khandua Silk', 42,
  'Sacred Khandua style. Features Balabhadra, Subhadra, and Lord Jagannath in holy shrine, with vertical lotus borders. Woven with ocher and vermilion silk.'
);

insertItem.run(
  'Maniabandha Grid Saree',
  catIkat, artKailash, 185000, 'available',
  'Fine Silk Blend', 28,
  'Classic Maniabandha grid layout. Geometric diamonds and checkerboard squares representing mathematical symmetry in handloom.'
);

// Insert a sample Enquiry
const insertEnquiry = db.prepare(`
  INSERT INTO enquiries (item_id, customer_name, customer_email, message)
  VALUES (?, ?, ?, ?)
`);
insertEnquiry.run(1, 'Aditi Rao', 'aditi@example.com', 'I would love to schedule a custom sizing enquiry for the Khandua Saree.');

console.log('Database seeded successfully!');
