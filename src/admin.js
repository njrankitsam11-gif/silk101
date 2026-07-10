let inventory = [];
let enquiries = [];
let artisans = [];
let categories = [];
let articles = [];

const FALLBACK_INVENTORY = [
  {
    id: 1,
    name: 'Nuapatana Khandua Ikat Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
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
    price_fiat: 185000,
    stock_status: 'available',
    material: 'Fine Silk Blend',
    weaving_time_days: 28,
    description: 'Classic Maniabandha grid layout. Geometric diamonds and checkerboard squares representing mathematical symmetry in handloom.',
    color_hue: 30,
    color_saturation: 1.1
  }
];

const FALLBACK_ARTICLES = [
  {
    id: 1,
    slug: 'buy-khandua-silk-sarees-online',
    title: 'Buy Khandua Silk Sarees Online — A Global Buyer’s Guide',
    meta_description: 'Are you looking to buy authentic Khandua Silk sarees online from USA, UK, Canada or UAE? Read our comprehensive 2026 handloom checklist, price guides, and weaver certificate verification.',
    content_html: `<article>
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
    topic_keyword: 'buy Khandua silk online',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    slug: 'odisha-handloom-heritage-diaspora',
    title: 'Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora',
    meta_description: 'Discover the legacy of double-Ikat patterns, Sambalpuri Lotus motifs, and Maniabandha weaves. Why global Indian diaspora collectors trust pure handloom drapes.',
    content_html: `<article>
      <h1>Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora</h1>
      <p class="intro">From the mathematical geometry of Maniabandha grids to the spectacular floral complexity of Sambalpuri Lotus sarees, Odisha's handloom stands as a testament to the country's ancient craftsmanship.</p>
      <h2>The Art of Ikat</h2>
      <p>Ikat, or "Bandha", is a resist dyeing technique where the warp and weft threads are tied and dyed prior to weaving. In double-Ikat, both warp and weft are dyed with mathematical precision so they align perfectly on the loom to form motifs of elephants, conch shells, and lotus blooms.</p>
      <h2>Preserving Heritage Abroad</h2>
      <p>For Indians residing in countries like Australia, the UK, and the USA, owning an authentic Sambalpuri saree is a way to celebrate cultural pride at festivals, family weddings, and religious gatherings. Powerloom counterfeits have flooded mass marketplaces, which is why sourcing directly from weaver cooperatives remains paramount.</p>
    </article>`,
    topic_keyword: 'authentic Sambalpuri saree',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    slug: 'how-to-style-patta-silk-wedding-abroad',
    title: 'How to Style a Patta Silk Saree for Wedding Season Abroad',
    meta_description: 'Learn how to style traditional Odisha Patta and Khandua Silk sarees for modern wedding celebrations in the USA, UK, Canada, and Australia.',
    content_html: `<article>
      <h1>How to Style a Patta Silk Saree for Wedding Season Abroad</h1>
      <p class="intro">Odisha Patta Silk is famous for its heavy weight, structural drape, and rich temple borders. Styling it for an international destination wedding requires balancing traditional elegance with modern comfort.</p>
      <h2>1. The Classic Royal Drape</h2>
      <p>Drape the saree with a neat, pleated pallu over the left shoulder to highlight the detailed craftsmanship of the Zari-work temple motifs. This drape works best with heavy gold jewelry or high-neck blouses.</p>
      <h2>2. The Contemporary Jacket Blouse</h2>
      <p>In colder regions like the UK or Canada, pair your Patta silk with a tailored velvet jacket or brocade crop blouse. This adds structural modern elegance while keeping you warm during winter receptions.</p>
      <h2>3. Minimalist Modern Styling</h2>
      <p>Keep accessories minimal with simple diamond studs and a sleek watch. Let the vibrant organic dyes and bold geometric prints of Maniabandha silk occupy center stage.</p>
    </article>`,
    topic_keyword: 'traditional Indian saree online',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    slug: 'how-to-identify-real-handloom-silk',
    title: 'Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom',
    meta_description: 'The ultimate guide to distinguishing pure zero-electricity handloom silk sarees from cheap machine-made duplicates. Key checks for Zari, borders, and weave.',
    content_html: `<article>
      <h1>Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom</h1>
      <p class="intro">As the global demand for Indian handlooms rises, cheap machine duplicates have flooded the market. Use this five-step checklist to ensure you are buying real heritage craft.</p>
      <h2>1. The Temple Border Joint</h2>
      <p>On a handloom, the transition border where the body meets the border (often called "Phoda Kumbha" or temple spikes) is woven by interlocking the threads. This leaves a unique hand-joined edge. Powerlooms mimic this with print or loose threads.</p>
      <h2>2. The Thread Burning Test</h2>
      <p>Real mulberry silk threads burn with a smell similar to burning hair, leaving behind a crumbly black ash. Synthetic fibers melt, smell like plastic, and form a hard bead.</p>
      <h2>3. The Reverse Side Check</h2>
      <p>Look at the reverse side of the pallu. Handloom sarees feature clean, hand-threaded knots and floats. Powerlooms will show mass-clipped, fuzzy loose threads from automated shuttle cutters.</p>
    </article>`,
    topic_keyword: 'handloom silk saree Odisha',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  }
];

function initializeLocalStorage() {
  try {
    const inv = localStorage.getItem('saree_inventory');
    if (!inv || JSON.parse(inv).length === 0) {
      localStorage.setItem('saree_inventory', JSON.stringify(FALLBACK_INVENTORY));
    }
  } catch (e) {
    localStorage.setItem('saree_inventory', JSON.stringify(FALLBACK_INVENTORY));
  }
  
  try {
    const arts = localStorage.getItem('saree_artisans');
    if (!arts || JSON.parse(arts).length === 0) {
      localStorage.setItem('saree_artisans', JSON.stringify([
        { id: 1, name: 'Smt. Sebati Mohanty', location: 'Nuapatna, Odisha', experience_years: 32, bio: 'Master weaver specializing in sacred Khandua scripture patterns.', status: 'active' },
        { id: 2, name: 'Shri Ranjan Meher', location: 'Maniabandha, Odisha', experience_years: 28, bio: 'Expert in mathematical geometric double-Ikat patterns.', status: 'active' },
        { id: 3, name: 'Shri Kailash Meher', location: 'Puri, Odisha', experience_years: 40, bio: 'Renowned for complex mythological and temple architecture drapes.', status: 'active' }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_artisans', JSON.stringify([
      { id: 1, name: 'Smt. Sebati Mohanty', location: 'Nuapatna, Odisha', experience_years: 32, bio: 'Master weaver specializing in sacred Khandua scripture patterns.', status: 'active' },
      { id: 2, name: 'Shri Ranjan Meher', location: 'Maniabandha, Odisha', experience_years: 28, bio: 'Expert in mathematical geometric double-Ikat patterns.', status: 'active' },
      { id: 3, name: 'Shri Kailash Meher', location: 'Puri, Odisha', experience_years: 40, bio: 'Renowned for complex mythological and temple architecture drapes.', status: 'active' }
    ]));
  }

  try {
    const cats = localStorage.getItem('saree_categories');
    if (!cats || JSON.parse(cats).length === 0) {
      localStorage.setItem('saree_categories', JSON.stringify([
        { id: 1, name: 'Ikat', description: 'Tie-dyed warp and weft patterns' },
        { id: 2, name: 'Chanderi', description: 'Sheer texture and gold border' },
        { id: 3, name: 'Kanjivaram', description: 'Heavy silk and wide borders' },
        { id: 4, name: 'Tissue Silk', description: 'Woven with metallic gold threads' }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_categories', JSON.stringify([
      { id: 1, name: 'Ikat', description: 'Tie-dyed warp and weft patterns' },
      { id: 2, name: 'Chanderi', description: 'Sheer texture and gold border' },
      { id: 3, name: 'Kanjivaram', description: 'Heavy silk and wide borders' },
      { id: 4, name: 'Tissue Silk', description: 'Woven with metallic gold threads' }
    ]));
  }

  try {
    const enqs = localStorage.getItem('saree_enquiries');
    if (!enqs || JSON.parse(enqs).length === 0) {
      localStorage.setItem('saree_enquiries', JSON.stringify([
        { id: 1, item_id: 1, item_name: 'Nuapatana Khandua Ikat Saree', customer_name: 'Aditi Rao', customer_email: 'aditi@example.com', message: 'I would love to schedule a custom sizing enquiry for the Khandua Saree.', status: 'pending', created_at: new Date().toISOString() }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_enquiries', JSON.stringify([
      { id: 1, item_id: 1, item_name: 'Nuapatana Khandua Ikat Saree', customer_name: 'Aditi Rao', customer_email: 'aditi@example.com', message: 'I would love to schedule a custom sizing enquiry for the Khandua Saree.', status: 'pending', created_at: new Date().toISOString() }
    ]));
  }

  try {
    const articles = localStorage.getItem('saree_articles');
    if (!articles || JSON.parse(articles).length === 0) {
      localStorage.setItem('saree_articles', JSON.stringify(FALLBACK_ARTICLES));
    }
  } catch (e) {
    localStorage.setItem('saree_articles', JSON.stringify(FALLBACK_ARTICLES));
  }
}

// Tab switching
const navBtns = document.querySelectorAll('.admin-nav-btn[data-target]');
const sections = document.querySelectorAll('.admin-section');

navBtns.forEach(btn => {
  btn.onclick = () => {
    navBtns.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.target);
    if (target) target.classList.add('active');
  };
});

// Fetch all database records
async function fetchData() {
  try {
    initializeLocalStorage();
  } catch (e) {}

  try {
    const [resInv, resEnq, resArt, resCat, resArtic] = await Promise.all([
      fetch('/api/inventory'),
      fetch('/api/enquiries'),
      fetch('/api/artisans'),
      fetch('/api/categories'),
      fetch('/api/articles')
    ]);

    if (resInv.ok && resEnq.ok && resArt.ok && resCat.ok && resArtic.ok) {
      inventory = await resInv.json();
      enquiries = await resEnq.json();
      artisans = await resArt.json();
      categories = await resCat.json();
      articles = await resArtic.json();

      try {
        localStorage.setItem('saree_inventory', JSON.stringify(inventory));
        localStorage.setItem('saree_enquiries', JSON.stringify(enquiries));
        localStorage.setItem('saree_artisans', JSON.stringify(artisans));
        localStorage.setItem('saree_categories', JSON.stringify(categories));
        localStorage.setItem('saree_articles', JSON.stringify(articles));
      } catch (e) {}
      
      renderDashboard();
      renderArticles();
      return;
    }
  } catch (err) {
    console.warn('API fetch failed in admin panel, using localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    inventory = JSON.parse(localStorage.getItem('saree_inventory'));
  } catch (e) {}
  if (!Array.isArray(inventory) || inventory.length === 0) {
    inventory = FALLBACK_INVENTORY;
  }

  try {
    enquiries = JSON.parse(localStorage.getItem('saree_enquiries'));
  } catch (e) {}
  if (!Array.isArray(enquiries)) enquiries = [];

  try {
    artisans = JSON.parse(localStorage.getItem('saree_artisans'));
  } catch (e) {}
  if (!Array.isArray(artisans)) artisans = [];

  try {
    categories = JSON.parse(localStorage.getItem('saree_categories'));
  } catch (e) {}
  if (!Array.isArray(categories)) categories = [];

  try {
    articles = JSON.parse(localStorage.getItem('saree_articles'));
  } catch (e) {}
  if (!Array.isArray(articles)) articles = [];

  renderDashboard();
  renderArticles();
}

// Render dynamic tables & metrics
function renderDashboard() {
  // Update metrics
  document.getElementById('metric-total-designs').textContent = inventory.length;
  document.getElementById('metric-available').textContent = inventory.filter(item => item.stock_status === 'available').length;
  document.getElementById('metric-weavers').textContent = artisans.filter(a => a.status === 'active').length;
  document.getElementById('metric-enquiries').textContent = enquiries.filter(e => e.status === 'pending').length;

  // Render Inventory table
  const invBody = document.getElementById('inventory-table-body');
  invBody.innerHTML = inventory.map(item => `
    <tr>
      <td style="font-family:monospace; color:#86868b;">#${String(item.id).padStart(3, '0')}</td>
      <td style="font-weight:600; color:#fff;">${item.name}</td>
      <td>${item.category_name || '---'}</td>
      <td style="color:var(--color-accent);">${item.artisan_name || '---'}</td>
      <td style="font-family:monospace; font-weight:600;">₹${item.price_fiat.toLocaleString()}</td>
      <td>${item.weaving_time_days} days</td>
      <td style="color:#86868b; font-size:0.8rem;">${item.material}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:hsl(${item.color_hue || 0}, ${Math.floor((item.color_saturation || 1.0) * 100)}%, 35%); border:1px solid rgba(255,255,255,0.25);"></span>
          <span style="font-family:monospace; font-size:0.75rem; color:#86868b;">${item.color_hue || 0}° / ${(item.color_saturation || 1.0).toFixed(1)}</span>
        </div>
      </td>
      <td>
        <select class="status-select ${item.stock_status}" onchange="updateItemStatus(${item.id}, this.value)">
          <option value="available" ${item.stock_status === 'available' ? 'selected' : ''}>Available</option>
          <option value="reserved" ${item.stock_status === 'reserved' ? 'selected' : ''}>Reserved</option>
          <option value="sold" ${item.stock_status === 'sold' ? 'selected' : ''}>Sold</option>
        </select>
      </td>
      <td>
        <button class="btn-delete" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    </tr>
  `).join('');

  // Render Enquiries table
  const enqBody = document.getElementById('enquiries-table-body');
  enqBody.innerHTML = enquiries.map(e => {
    const formattedDate = new Date(e.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    return `
      <tr>
        <td style="font-family:monospace; font-size:0.8rem; color:#86868b;">${formattedDate}</td>
        <td style="font-weight:600;">${e.customer_name}</td>
        <td><a href="mailto:${e.customer_email}" style="color:var(--color-accent); text-decoration:none;">${e.customer_email}</a></td>
        <td style="color:#fff;">${e.item_name || 'General Inquiry'}</td>
        <td style="color:#86868b; font-size:0.85rem; max-width:300px; word-wrap:break-word;">${e.message || '---'}</td>
        <td>
          <select class="status-select" onchange="updateEnquiryStatus(${e.id}, this.value)">
            <option value="pending" ${e.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="closed" ${e.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');

  // Render Artisans table
  const artBody = document.getElementById('artisans-table-body');
  artBody.innerHTML = artisans.map(a => `
    <tr>
      <td style="font-family:monospace; color:#86868b;">#${String(a.id).padStart(3, '0')}</td>
      <td style="font-weight:600; color:#fff;">${a.name}</td>
      <td style="color:var(--color-accent);">${a.location}</td>
      <td>${a.experience_years} years</td>
      <td style="color:#86868b; font-size:0.85rem;">${a.bio || '---'}</td>
      <td>
        <span style="font-size:0.75rem; font-weight:600; padding:0.2rem 0.5rem; border-radius:10px; background:${a.status === 'active' ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.05)'}; color:${a.status === 'active' ? '#2ecc71' : '#86868b'};">
          ${a.status.toUpperCase()}
        </span>
      </td>
    </tr>
  `).join('');

  // Populate form selects
  populateFormDropdowns();
}

// Render articles database in table list
function renderArticles() {
  const artBody = document.getElementById('articles-table-body');
  artBody.innerHTML = articles.map(art => `
    <tr>
      <td style="font-family:monospace; color:#86868b;">#${String(art.id).padStart(3, '0')}</td>
      <td style="font-weight:600; color:#fff;">${art.title}</td>
      <td style="color:var(--color-accent);">${art.topic_keyword || '---'}</td>
      <td style="font-family:monospace; font-size:0.8rem; text-transform:uppercase;">${art.target_locale || 'global'}</td>
      <td style="font-family:monospace; font-size:0.85rem; color:#86868b;">/articles.html?slug=${art.slug}</td>
      <td>
        <select class="status-select ${art.status}" onchange="updateArticleStatus(${art.id}, this.value)">
          <option value="draft" ${art.status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="published" ${art.status === 'published' ? 'selected' : ''}>Published</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <a href="/articles.html?slug=${art.slug}" target="_blank" class="btn-cancel" style="text-decoration:none; padding:0.25rem 0.6rem; font-size:0.75rem; display:inline-block;">View</a>
          <button class="btn-delete" onclick="deleteArticle(${art.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Form dropdown values
function populateFormDropdowns() {
  const catSelect = document.getElementById('inp-category');
  catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const artSelect = document.getElementById('inp-artisan');
  artSelect.innerHTML = artisans.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// Global actions linked via table html handlers
window.updateItemStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_status: status })
    });
    if (res.ok) {
      fetchData();
      return;
    }
  } catch (err) {
    console.warn('API updateItemStatus failed, using localStorage:', err);
  }

  const inv = JSON.parse(localStorage.getItem('saree_inventory') || '[]');
  const item = inv.find(i => i.id === id);
  if (item) {
    item.stock_status = status;
    localStorage.setItem('saree_inventory', JSON.stringify(inv));
  }
  fetchData();
};

window.updateEnquiryStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchData();
      return;
    }
  } catch (err) {
    console.warn('API updateEnquiryStatus failed, using localStorage:', err);
  }

  const enqs = JSON.parse(localStorage.getItem('saree_enquiries') || '[]');
  const enq = enqs.find(e => e.id === id);
  if (enq) {
    enq.status = status;
    localStorage.setItem('saree_enquiries', JSON.stringify(enqs));
  }
  fetchData();
};

window.updateArticleStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchData();
      return;
    }
  } catch (err) {
    console.warn('API updateArticleStatus failed, using localStorage:', err);
  }

  const arts = JSON.parse(localStorage.getItem('saree_articles') || '[]');
  const art = arts.find(a => a.id === id);
  if (art) {
    art.status = status;
    localStorage.setItem('saree_articles', JSON.stringify(arts));
  }
  fetchData();
};

window.deleteItem = async (id) => {
  if (!confirm('Are you sure you want to delete this saree design?')) return;
  try {
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
      return;
    }
  } catch (err) {
    console.warn('API deleteItem failed, using localStorage:', err);
  }

  let inv = JSON.parse(localStorage.getItem('saree_inventory') || '[]');
  inv = inv.filter(i => i.id !== id);
  localStorage.setItem('saree_inventory', JSON.stringify(inv));
  fetchData();
};

window.deleteArticle = async (id) => {
  if (!confirm('Are you sure you want to delete this article?')) return;
  try {
    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
      return;
    }
  } catch (err) {
    console.warn('API deleteArticle failed, using localStorage:', err);
  }

  let arts = JSON.parse(localStorage.getItem('saree_articles') || '[]');
  arts = arts.filter(a => a.id !== id);
  localStorage.setItem('saree_articles', JSON.stringify(arts));
  fetchData();
};

// Modal trigger handling
const addModal = document.getElementById('add-saree-modal');
const openAddBtn = document.getElementById('btn-open-add-modal');
const closeAddBtn = document.getElementById('btn-close-add-modal');

openAddBtn.onclick = () => addModal.classList.add('open');
closeAddBtn.onclick = () => addModal.classList.remove('open');

// Submit new saree
document.getElementById('add-saree-form').onsubmit = async (e) => {
  e.preventDefault();
  const catId = parseInt(document.getElementById('inp-category').value);
  const artId = parseInt(document.getElementById('inp-artisan').value);
  const cat = categories.find(c => c.id === catId);
  const art = artisans.find(a => a.id === artId);

  const body = {
    name: document.getElementById('inp-name').value,
    category_id: catId,
    category_name: cat ? cat.name : 'Ikat',
    artisan_id: artId,
    artisan_name: art ? art.name : 'Smt. Sebati Mohanty',
    artisan_location: art ? art.location : 'Nuapatna, Odisha',
    price_fiat: parseInt(document.getElementById('inp-price').value),
    weaving_time_days: parseInt(document.getElementById('inp-weaving-time').value),
    color_hue: parseInt(document.getElementById('inp-hue').value),
    color_saturation: parseFloat(document.getElementById('inp-sat').value),
    material: document.getElementById('inp-material').value,
    description: document.getElementById('inp-description').value,
    stock_status: 'available'
  };

  let apiSuccess = false;
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) apiSuccess = true;
  } catch (err) {
    console.warn('API addSaree failed, using localStorage:', err);
  }

  if (!apiSuccess) {
    const inv = JSON.parse(localStorage.getItem('saree_inventory') || '[]');
    const maxId = inv.reduce((max, item) => item.id > max ? item.id : max, 0);
    body.id = maxId + 1;
    inv.push(body);
    localStorage.setItem('saree_inventory', JSON.stringify(inv));
  }

  addModal.classList.remove('open');
  document.getElementById('add-saree-form').reset();
  updateModalColorPreview();
  fetchData();
};

// Live color preview updates
const inpHue = document.getElementById('inp-hue');
const inpSat = document.getElementById('inp-sat');
const valHue = document.getElementById('val-hue');
const valSat = document.getElementById('val-sat');
const colorPreview = document.getElementById('color-preview');

function updateModalColorPreview() {
  if (!inpHue || !inpSat) return;
  const h = inpHue.value;
  const s = parseFloat(inpSat.value);
  valHue.textContent = `${h}°`;
  valSat.textContent = `${s.toFixed(1)}×`;
  colorPreview.style.background = `hsl(${h}, ${Math.floor(s * 100)}%, 25%)`;
}
if (inpHue && inpSat) {
  inpHue.addEventListener('input', updateModalColorPreview);
  inpSat.addEventListener('input', updateModalColorPreview);
}

// Submit automated article generator
const genForm = document.getElementById('generate-article-form');
const genStatus = document.getElementById('generation-status');

if (genForm) {
  genForm.onsubmit = async (e) => {
    e.preventDefault();
    genStatus.textContent = 'Weaving SEO article threads... please wait...';
    
    const theme = document.getElementById('art-theme').value;
    const targetRegion = document.getElementById('art-region').value;
    const keyword = document.getElementById('art-keyword').value;
    
    const body = {
      theme: theme,
      target_region: targetRegion,
      keyword: keyword
    };

    let apiSuccess = false;
    let apiData = null;
    try {
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        apiData = await res.json();
        apiSuccess = true;
      }
    } catch (err) {
      console.warn('API generateArticle failed, simulating locally:', err);
    }

    if (apiSuccess && apiData) {
      genStatus.innerHTML = `<span style="color:#2ecc71;">✓ Success! Published: <a href="/articles.html?slug=${apiData.slug}" target="_blank" style="color:#fff;">${apiData.title}</a></span>`;
      genForm.reset();
      fetchData();
    } else {
      const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const title = `Special Edition: ${theme} - Targeted to Buyers in ${targetRegion}`;
      const meta = `A curated guide on ${theme} focused on authentic ${keyword} for diaspora collectors in ${targetRegion}.`;
      const content = `<article>
        <h1>${title}</h1>
        <p class="intro">Exploring the deep cultural connection of ${keyword} for the diaspora community living in ${targetRegion}.</p>
        <h2>The Significance of ${keyword}</h2>
        <p>This premium collection highlights our finest handloom, created using traditional processes, now shipped directly to ${targetRegion}.</p>
      </article>`;
      
      const arts = JSON.parse(localStorage.getItem('saree_articles') || '[]');
      const maxId = arts.reduce((max, art) => art.id > max ? art.id : max, 0);
      const newArt = {
        id: maxId + 1,
        slug: slug || 'generated-article',
        title: title,
        meta_description: meta,
        content_html: content,
        topic_keyword: keyword,
        target_locale: targetRegion,
        status: 'published',
        created_at: new Date().toISOString()
      };
      
      arts.push(newArt);
      localStorage.setItem('saree_articles', JSON.stringify(arts));
      
      genStatus.innerHTML = `<span style="color:#2ecc71;">✓ Local Success! Created: <a href="/articles.html?slug=${newArt.slug}" target="_blank" style="color:#fff;">${newArt.title}</a></span>`;
      genForm.reset();
      fetchData();
    }
  };
}

// ── Custom Trailing Cursor for Admin Page ──────────────────────────────────
function setupAdminCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
  });

  function updateRing() {
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    ringX += dx * 0.16;
    ringY += dy * 0.16;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(updateRing);
  }
  updateRing();

  const hoverSelectors = 'a, button, select, input, tr';
  function addHoverListeners() {
    document.querySelectorAll(hoverSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  addHoverListeners();

  const observer = new MutationObserver(() => addHoverListeners());
  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize
fetchData();
setupAdminCursor();
