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

const item1 = insertItem.run(
  'Nuapatana Khandua Ikat Saree',
  catIkat, artSebati, 150000, 'available',
  '100% Pure Mulberry Silk', 28,
  'A masterpiece of Nuapatna, tie-dyed with organic crimson and gold. Highlights a stylized geometric gold elephant Zari motif on the Pallu.'
).lastInsertRowid;

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
insertEnquiry.run(item1, 'Aditi Rao', 'aditi@example.com', 'I would love to schedule a custom sizing enquiry for the Khandua Saree.');

// Clean and Seed Articles Table for SEO Crawlers
db.exec('DELETE FROM articles;');

const insertArticle = db.prepare(`
  INSERT INTO articles (slug, title, meta_description, content_html, topic_keyword, target_locale, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertArticle.run(
  'buy-khandua-silk-sarees-online',
  'Buy Khandua Silk Sarees Online — A Global Buyer’s Guide',
  'Are you looking to buy authentic Khandua Silk sarees online from USA, UK, Canada or UAE? Read our comprehensive 2026 handloom checklist, price guides, and weaver certificate verification.',
  `<article>
    <h1>Buy Khandua Silk Sarees Online — A Global Buyer’s Guide</h1>
    <p class="intro">For the global Indian diaspora, holding a piece of home is a feeling beyond words. The Khandua Silk saree, originating from the ancient village of Nuapatna in Odisha, represents over eight centuries of sacred weaving heritage.</p>
    
    <h2>Why Khandua Silk is Sacred</h2>
    <p>Traditionally woven for the deities of the Jagannath Temple in Puri, Khandua silk incorporates shlokas from Gita Govinda directly into its weave. Known as the "Loom of Devotion", this fabric uses tie-dyed mulberry silk threads, dyed with local organic turmeric, indigo, and madder root extracts.</p>
    
    <h2>How to Verify Authentic Handloom Silk Online</h2>
    <ul>
      <li><strong>Look for the Silk Mark Certification:</strong> Authentic pieces carry a government-certified label with a unique hologram.</li>
      <li><strong>Inspect the Zari Weft:</strong> Genuine gold and silver plated copper threads feel heavy and display a subtle, elegant gleam rather than a harsh metallic shine.</li>
      <li><strong>Identify Warp Variations:</strong> Unlike powerlooms, handlooms have organic irregularities in thread count and tension, reflecting human craftsmanship.</li>
    </ul>

    <h2>Global Shipping and Custom Sizing Details</h2>
    <p>Our platform delivers directly from Tigiria and Maniabandha weaving cooperatives to international destinations like New York, London, Toronto, Dubai, and Sydney. All custom blouse stitching requests are handled by expert traditional tailors in Odisha.</p>
  </article>`,
  'buy Khandua silk online',
  'global',
  'published'
);

insertArticle.run(
  'odisha-handloom-heritage-diaspora',
  'Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora',
  'Discover the legacy of double-Ikat patterns, Sambalpuri Lotus motifs, and Maniabandha weaves. Why global Indian diaspora collectors trust pure handloom drapes.',
  `<article>
    <h1>Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora</h1>
    <p class="intro">From the mathematical geometry of Maniabandha grids to the spectacular floral complexity of Sambalpuri Lotus sarees, Odisha's handloom stands as a testament to the country's ancient craftsmanship.</p>
    
    <h2>The Art of Ikat</h2>
    <p>Ikat, or "Bandha", is a resist dyeing technique where the warp and weft threads are tied and dyed prior to weaving. In double-Ikat, both warp and weft are dyed with mathematical precision so they align perfectly on the loom to form motifs of elephants, conch shells, and lotus blooms.</p>
    
    <h2>Preserving Heritage Abroad</h2>
    <p>For Indians residing in countries like Australia, the UK, and the USA, owning an authentic Sambalpuri saree is a way to celebrate cultural pride at festivals, family weddings, and religious gatherings. Powerloom counterfeits have flooded mass marketplaces, which is why sourcing directly from weaver cooperatives remains paramount.</p>
  </article>`,
  'authentic Sambalpuri saree',
  'global',
  'published'
);

insertArticle.run(
  'how-to-style-patta-silk-wedding-abroad',
  'How to Style a Patta Silk Saree for Wedding Season Abroad',
  'Learn how to style traditional Odisha Patta and Khandua Silk sarees for modern wedding celebrations in the USA, UK, Canada, and Australia.',
  `<article>
    <h1>How to Style a Patta Silk Saree for Wedding Season Abroad</h1>
    <p class="intro">Odisha Patta Silk is famous for its heavy weight, structural drape, and rich temple borders. Styling it for an international destination wedding requires balancing traditional elegance with modern comfort.</p>
    
    <h2>1. The Classic Royal Drape</h2>
    <p>Drape the saree with a neat, pleated pallu over the left shoulder to highlight the detailed craftsmanship of the Zari-work temple motifs. This drape works best with heavy gold jewelry or high-neck blouses.</p>
    
    <h2>2. The Contemporary Jacket Blouse</h2>
    <p>In colder regions like the UK or Canada, pair your Patta silk with a tailored velvet jacket or brocade crop blouse. This adds structural modern elegance while keeping you warm during winter receptions.</p>
    
    <h2>3. Minimalist Modern Styling</h2>
    <p>Keep accessories minimal with simple diamond studs and a sleek watch. Let the vibrant organic dyes and bold geometric prints of Maniabandha silk occupy center stage.</p>
  </article>`,
  'traditional Indian saree online',
  'global',
  'published'
);

insertArticle.run(
  'how-to-identify-real-handloom-silk',
  'Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom',
  'The ultimate guide to distinguishing pure zero-electricity handloom silk sarees from cheap machine-made duplicates. Key checks for Zari, borders, and weave.',
  `<article>
    <h1>Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom</h1>
    <p class="intro">As the global demand for Indian handlooms rises, cheap machine duplicates have flooded the market. Use this five-step checklist to ensure you are buying real heritage craft.</p>
    
    <h2>1. The Temple Border Joint</h2>
    <p>On a handloom, the transition border where the body meets the border (often called "Phoda Kumbha" or temple spikes) is woven by interlocking the threads. This leaves a unique hand-joined edge. Powerlooms mimic this with print or loose threads.</p>
    
    <h2>2. The Thread Burning Test</h2>
    <p>Real mulberry silk threads burn with a smell similar to burning hair, leaving behind a crumbly black ash. Synthetic fibers melt, smell like plastic, and form a hard bead.</p>
    
    <h2>3. The Reverse Side Check</h2>
    <p>Look at the reverse side of the pallu. Handloom sarees feature clean, hand-threaded knots and floats. Powerlooms will show mass-clipped, fuzzy loose threads from automated shuttle cutters.</p>
  </article>`,
  'handloom silk saree Odisha',
  'global',
  'published'
);

console.log('Database seeded successfully!');
