import express from 'express';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── INVENTORY API ──────────────────────────────────────────────────────────

// GET all inventory
app.get('/api/inventory', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT i.*, a.name AS artisan_name, a.location AS artisan_location, c.name AS category_name
      FROM inventory i
      LEFT JOIN artisans a ON i.artisan_id = a.id
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.id DESC
    `);
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new inventory item
app.post('/api/inventory', (req, res) => {
  const { name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation } = req.body;
  if (!name || !price_fiat || !material || !weaving_time_days) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO inventory (name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category_id || null, artisan_id || null, price_fiat, stock_status || 'available', material, weaving_time_days, description || '', color_hue || 0, color_saturation || 1.0);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Item created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory item status or details
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE inventory
      SET name = COALESCE(?, name),
          category_id = COALESCE(?, category_id),
          artisan_id = COALESCE(?, artisan_id),
          price_fiat = COALESCE(?, price_fiat),
          stock_status = COALESCE(?, stock_status),
          material = COALESCE(?, material),
          weaving_time_days = COALESCE(?, weaving_time_days),
          description = COALESCE(?, description),
          color_hue = COALESCE(?, color_hue),
          color_saturation = COALESCE(?, color_saturation)
      WHERE id = ?
    `);
    const result = stmt.run(name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, color_hue, color_saturation, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── ARTISANS API ───────────────────────────────────────────────────────────

app.get('/api/artisans', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM artisans ORDER BY name ASC');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CATEGORIES API ─────────────────────────────────────────────────────────

app.get('/api/categories', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name ASC');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── ENQUIRIES API ──────────────────────────────────────────────────────────

// GET all enquiries
app.get('/api/enquiries', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, i.name AS item_name
      FROM enquiries e
      LEFT JOIN inventory i ON e.item_id = i.id
      ORDER BY e.created_at DESC
    `);
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new enquiry
app.post('/api/enquiries', (req, res) => {
  const { item_id, customer_name, customer_email, message } = req.body;
  if (!customer_name || !customer_email) {
    return res.status(400).json({ error: 'Customer name and email are required' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO enquiries (item_id, customer_name, customer_email, message)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(item_id || null, customer_name, customer_email, message || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Enquiry submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update enquiry status
app.put('/api/enquiries/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const stmt = db.prepare('UPDATE enquiries SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json({ message: 'Enquiry status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── ARTICLES & AUTOMATED SEO ENGINE API ──────────────────────────────────────

// GET all articles
app.get('/api/articles', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM articles ORDER BY created_at DESC');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single article by slug
app.get('/api/articles/:slug', (req, res) => {
  const { slug } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM articles WHERE slug = ?');
    const article = stmt.get(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save manual/generated article
app.post('/api/articles', (req, res) => {
  const { slug, title, meta_description, content_html, topic_keyword, target_locale, status } = req.body;
  if (!slug || !title || !content_html) {
    return res.status(400).json({ error: 'Slug, title, and content are required' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO articles (slug, title, meta_description, content_html, topic_keyword, target_locale, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(slug, title, meta_description || '', content_html, topic_keyword || '', target_locale || 'global', status || 'draft');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Article created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update article
app.put('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const { title, meta_description, content_html, status } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE articles
      SET title = COALESCE(?, title),
          meta_description = COALESCE(?, meta_description),
          content_html = COALESCE(?, content_html),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(title, meta_description, content_html, status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE article
app.delete('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM articles WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Automated Article Generator
app.post('/api/articles/generate', (req, res) => {
  const { theme, keyword, target_region } = req.body;
  if (!theme || !keyword || !target_region) {
    return res.status(400).json({ error: 'Theme, keyword, and target_region are required' });
  }

  // Define locale-specific names and terms
  const regionalCenters = {
    'US': { city: 'New York & San Francisco', currency: 'USD ($)', desc: 'diaspora communities across North America' },
    'UK': { city: 'London & Leicester', currency: 'GBP (£)', desc: 'historical Indian diaspora communities in Great Britain' },
    'CA': { city: 'Toronto & Vancouver', currency: 'CAD ($)', desc: 'vibrant Punjabi and Odia cultural associations in Canada' },
    'AU': { city: 'Sydney & Melbourne', currency: 'AUD ($)', desc: 'growing handloom collectors network in Australia' },
    'UAE': { city: 'Dubai & Abu Dhabi', currency: 'AED (Dirhams)', desc: 'the thriving Gulf NRI business cluster' },
    'SG': { city: 'Singapore Little India', currency: 'SGD ($)', desc: 'prestigious South East Asian silk connoisseurs' },
    'global': { city: 'metropolitan areas worldwide', currency: 'USD ($)', desc: 'discerning Indian diaspora globally' }
  };

  const reg = regionalCenters[target_region] || regionalCenters['global'];

  let title = '';
  let meta_desc = '';
  let content = '';

  const cleanKeyword = keyword.trim();
  const slug = cleanKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (theme === 'heritage') {
    title = `The Woven Scriptures: Exploring Authentic ${cleanKeyword} Handloom`;
    meta_desc = `Explore the historical legacy, sacred ties, and artisan details of authentic ${cleanKeyword} drapes curated for the global diaspora.`;
    content = `<article>
      <h1>${title}</h1>
      <p class="intro">In a world dominated by fast fashion and mass-produced powerlooms, the luxury of a hand-woven masterpiece remains unmatched. For the ${reg.desc}, buying authentic ${cleanKeyword} represents a connection to pure Indian craftsmanship.</p>
      
      <h2>The Roots of Handloom Excellence</h2>
      <p>Odisha’s weaving clusters, including the famous cooperatives of Nuapatna, have spent centuries perfecting warp and weft tie-dye techniques. Each thread is dyed using organic, natural pigments before being hand-threaded onto wooden frames. The process is completely carbon-free, requiring zero electricity and relying solely on the muscle memory of master weavers.</p>

      <blockquote>"Each motif tells a story—from the sacred conch representing prosperity to the lotus symbolizing purity."</blockquote>

      <h2>Why Diaspora Collections Value Authentic ${cleanKeyword}</h2>
      <p>Whether you reside in <strong>${reg.city}</strong> or other global centers, sourcing an authentic saree is a pledge to sustain local weaver households. Our platform partners directly with Brahma Weavers Company (BWC) to guarantee fair-trade wages and mathematical traceability for every item.</p>

      <h2>Global Buyer Verification Checklist</h2>
      <ul>
        <li><strong>Weave Edge Interlock:</strong> Check for manual Kumbha joint spikes along the border.</li>
        <li><strong>Texture Weight:</strong> True mulberry silk maintains a lightweight, comfortable feel compared to heavy synthetic substitutes.</li>
        <li><strong>Fibre Match Test:</strong> Real silk threads dissolve cleanly in combustion tests leaving crumbly residue.</li>
      </ul>
    </article>`;
  } else if (theme === 'wedding') {
    title = `Saree Styling Guide: How to Wear ${cleanKeyword} for Wedding Season in ${target_region}`;
    meta_desc = `How to select and drape premium ${cleanKeyword} sarees for wedding occasions in ${reg.city} with custom styling and shipping guidelines.`;
    content = `<article>
      <h1>${title}</h1>
      <p class="intro">Planning a traditional wedding wardrobe abroad can be challenging. For NRI brides and guests in <strong>${reg.city}</strong>, draping a high-fidelity ${cleanKeyword} saree brings royal heritage to modern wedding venues.</p>

      <h2>Top 3 Styling Methods for NRI Weddings</h2>
      <ol>
        <li><strong>The Classic Nivi Pleat:</strong> Keeps the shoulder drape formal and professional. Perfect for highlighting gold Zari patterns.</li>
        <li><strong>The Open Pallu:</strong> Allows the complex double-Ikat motifs on the pallu to be fully displayed. Best suited for indoor receptions.</li>
        <li><strong>Jacket Blouse Pairings:</strong> Adapt to local climates (such as cold winters in Canada or the UK) by matching your ${cleanKeyword} with a structured velvet coat or embroidered jacket.</li>
      </ol>

      <h2>Premium Shipping and Custom Sewing</h2>
      <p>We provide global express delivery within 5-7 business days to major international hubs. Prices are displayed dynamically in <strong>${reg.currency}</strong> and include custom lining, fall stitching, and tailored blouse services.</p>
    </article>`;
  } else {
    // default/general
    title = `A Connoisseur's Checklist to Buying ${cleanKeyword} Online`;
    meta_desc = `Avoid counterfeit sarees. Read our ultimate online check to verify authentic ${cleanKeyword} weave quality, Silk Marks, and pricing.`;
    content = `<article>
      <h1>${title}</h1>
      <p class="intro">With powerloom counterfeits flooding online marketplaces, discerning buyers across <strong>${reg.city}</strong> must exercise caution. Here is the ultimate check for buying ${cleanKeyword} online.</p>

      <h2>Understanding the Price of Authentic Handloom</h2>
      <p>A handloom saree represents between 20 to 50 days of manual labor. If an online shop offers a ${cleanKeyword} saree at prices far below standard weaver cooperative rates, it is highly likely a machine-made duplicate printed on synthetic yarn.</p>

      <h2>Key Features of Hand-woven Masterpieces</h2>
      <ul>
        <li><strong>Unique Silk Mark Hologram:</strong> Ensures certified pure mulberry silk.</li>
        <li><strong>Subtle Weave Irregularities:</strong> Small shifts in warp alignment verify human hands operated the shuttle.</li>
        <li><strong>Organic Dyes:</strong> Muted, premium tones that look rich under spotlight lighting rather than cheap neon colors.</li>
      </ul>
    </article>`;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO articles (slug, title, meta_description, content_html, topic_keyword, target_locale, status)
      VALUES (?, ?, ?, ?, ?, ?, 'published')
    `);
    stmt.run(slug, title, meta_desc, content, keyword, target_region);
    res.status(201).json({ slug, title, message: 'SEO Article automatically generated and published!' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      // Append random suffix
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newSlug = `${slug}-${randomSuffix}`;
      try {
        const stmt2 = db.prepare(`
          INSERT INTO articles (slug, title, meta_description, content_html, topic_keyword, target_locale, status)
          VALUES (?, ?, ?, ?, ?, ?, 'published')
        `);
        stmt2.run(newSlug, title, meta_desc, content, keyword, target_region);
        return res.status(201).json({ slug: newSlug, title, message: 'SEO Article automatically generated with suffix and published!' });
      } catch (err2) {
        return res.status(500).json({ error: err2.message });
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// Start Express Server only if not imported as serverless
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Express API running on port ${PORT}`);
  });
}

export default app;
