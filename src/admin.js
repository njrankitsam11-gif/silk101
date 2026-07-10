let inventory = [];
let enquiries = [];
let artisans = [];
let categories = [];
let articles = [];

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
    const [resInv, resEnq, resArt, resCat, resArtic] = await Promise.all([
      fetch('/api/inventory'),
      fetch('/api/enquiries'),
      fetch('/api/artisans'),
      fetch('/api/categories'),
      fetch('/api/articles')
    ]);

    inventory = await resInv.json();
    enquiries = await resEnq.json();
    artisans = await resArt.json();
    categories = await resCat.json();
    articles = await resArtic.json();

    renderDashboard();
    renderArticles();
  } catch (err) {
    console.error('Error fetching admin data:', err);
  }
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
    if (res.ok) fetchData();
  } catch (err) {
    console.error('Error updating status:', err);
  }
};

window.updateEnquiryStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchData();
  } catch (err) {
    console.error('Error updating status:', err);
  }
};

window.updateArticleStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchData();
  } catch (err) {
    console.error('Error updating status:', err);
  }
};

window.deleteItem = async (id) => {
  if (!confirm('Are you sure you want to delete this saree design?')) return;
  try {
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  } catch (err) {
    console.error('Error deleting item:', err);
  }
};

window.deleteArticle = async (id) => {
  if (!confirm('Are you sure you want to delete this article?')) return;
  try {
    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  } catch (err) {
    console.error('Error deleting article:', err);
  }
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
  const body = {
    name: document.getElementById('inp-name').value,
    category_id: parseInt(document.getElementById('inp-category').value),
    artisan_id: parseInt(document.getElementById('inp-artisan').value),
    price_fiat: parseInt(document.getElementById('inp-price').value),
    weaving_time_days: parseInt(document.getElementById('inp-weaving-time').value),
    color_hue: parseInt(document.getElementById('inp-hue').value),
    color_saturation: parseFloat(document.getElementById('inp-sat').value),
    material: document.getElementById('inp-material').value,
    description: document.getElementById('inp-description').value
  };

  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      addModal.classList.remove('open');
      document.getElementById('add-saree-form').reset();
      updateModalColorPreview();
      fetchData();
    }
  } catch (err) {
    console.error('Error adding new saree:', err);
  }
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
    
    const body = {
      theme: document.getElementById('art-theme').value,
      target_region: document.getElementById('art-region').value,
      keyword: document.getElementById('art-keyword').value
    };

    try {
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        genStatus.innerHTML = `<span style="color:#2ecc71;">✓ Success! Published: <a href="/articles.html?slug=${data.slug}" target="_blank" style="color:#fff;">${data.title}</a></span>`;
        genForm.reset();
        fetchData();
      } else {
        genStatus.textContent = `Error: ${data.error}`;
      }
    } catch (err) {
      console.error(err);
      genStatus.textContent = 'Failed to generate article.';
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
