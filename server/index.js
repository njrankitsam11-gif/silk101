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
  const { name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description } = req.body;
  if (!name || !price_fiat || !material || !weaving_time_days) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO inventory (name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category_id || null, artisan_id || null, price_fiat, stock_status || 'available', material, weaving_time_days, description || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Item created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory item status or details
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description } = req.body;
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
          description = COALESCE(?, description)
      WHERE id = ?
    `);
    const result = stmt.run(name, category_id, artisan_id, price_fiat, stock_status, material, weaving_time_days, description, id);
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`Express API running on port ${PORT}`);
});
