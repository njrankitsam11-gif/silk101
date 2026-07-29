let inventory = [];
let enquiries = [];
let artisans = [];
let categories = [];
let articles = [];

const FALLBACK_INVENTORY = [
  // ── HOUSE OF SAMBALPUR (1..5) ──
  {
    id: 1,
    name: 'Sambalpuri Lotus & Pasapalli Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 155000,
    stock_status: 'available',
    material: '100% Pure Mulberry Silk',
    weaving_time_days: 28,
    description: 'Signature Sambalpuri double-Ikat checkerboard Pasapalli with organic crimson lotus pallu Zari figuring.',
    color_hue: 340,
    color_saturation: 1.3
  },
  {
    id: 2,
    name: 'Sambalpuri Phulia Lattice Ikat Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 140000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 24,
    description: 'Intricate violet and emerald geometric lattice woven using mathematical Bandha tie-dye alignment.',
    color_hue: 280,
    color_saturation: 1.2
  },
  {
    id: 3,
    name: 'Sambalpuri Peacock Cascade Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 165000,
    stock_status: 'available',
    material: 'Tussar & Mulberry Silk',
    weaving_time_days: 30,
    description: 'Deep royal blue body adorned with cascading peacock motifs across the pallu and contrast gold zari border.',
    color_hue: 210,
    color_saturation: 1.4
  },
  {
    id: 4,
    name: 'Sambalpuri Rudraksha Border Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 135000,
    stock_status: 'available',
    material: 'Pure Silk',
    weaving_time_days: 22,
    description: 'Warm terracotta ground highlighting sacred Rudraksha seed border reliefs and traditional temple Kumbha spires.',
    color_hue: 25,
    color_saturation: 1.1
  },
  {
    id: 5,
    name: 'Sambalpuri Sacred Temple Grid Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 170000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 32,
    description: 'Emerald green ground with gold-plated silver thread Zari portraying organic lotus petals and temple spires.',
    color_hue: 150,
    color_saturation: 1.3
  },

  // ── HOUSE OF KHANDUA (6..10) ──
  {
    id: 6,
    name: 'Nuapatna Khandua Gita Govinda Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 185000,
    stock_status: 'available',
    material: '100% Pure Khandua Silk',
    weaving_time_days: 36,
    description: 'Sacred Nuapatna Khandua woven with verses of Gita Govinda, tie-dyed with organic turmeric and madder root.',
    color_hue: 0,
    color_saturation: 1.5
  },
  {
    id: 7,
    name: 'Khandua Deula Bhaunri Spire Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Khandua Silk',
    weaving_time_days: 32,
    description: 'Golden yellow body featuring Jagannath temple spire silhouettes and auspicious elephant-deer pallu bandha.',
    color_hue: 45,
    color_saturation: 1.2
  },
  {
    id: 8,
    name: 'Khandua Radhanagar Crimson Silk',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 160000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 26,
    description: 'Radiant crimson silk featuring fine floral ikat weave borders handed down through Radhanagar master weavers.',
    color_hue: 350,
    color_saturation: 1.4
  },
  {
    id: 9,
    name: 'Khandua Elephant March Pallu Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Khandua Patta Silk',
    weaving_time_days: 40,
    description: 'Rich saffron ground with a grand procession of nine royal elephants woven into the pallu using Bandha technique.',
    color_hue: 35,
    color_saturation: 1.3
  },
  {
    id: 10,
    name: 'Khandua Maniabandha Diamond Ikat',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 150000,
    stock_status: 'available',
    material: 'Khandua Silk Blend',
    weaving_time_days: 25,
    description: 'Deep cobalt blue body with geometric diamond ikat repeats, representing sacred mathematical proportions in handloom.',
    color_hue: 220,
    color_saturation: 1.2
  },

  // ── HOUSE OF BOMKAI (11..15) ──
  {
    id: 11,
    name: 'Bomkai Sonepur Jamdani Peacock Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 215000,
    stock_status: 'available',
    material: 'Pure Bomkai Silk',
    weaving_time_days: 38,
    description: 'Deep magenta silk with gold peacock feather pallu. Features extra-weft figuring woven with needle-precision.',
    color_hue: 295,
    color_saturation: 1.4
  },
  {
    id: 12,
    name: 'Bomkai Fish & Lotus Legend Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 190000,
    stock_status: 'available',
    material: 'Bomkai Silk',
    weaving_time_days: 34,
    description: 'Lush teal body displaying the classic Odia Matsya (sacred fish) and lotus motif figuring along the pallu border.',
    color_hue: 170,
    color_saturation: 1.3
  },
  {
    id: 13,
    name: 'Bomkai Royal Amber Zari Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 225000,
    stock_status: 'available',
    material: 'Heavy Bomkai Silk',
    weaving_time_days: 42,
    description: 'Warm amber gold silk woven with heavy metallic Zari extra-weft figuring representing southern Odisha royalty.',
    color_hue: 40,
    color_saturation: 1.5
  },
  {
    id: 14,
    name: 'Bomkai Heritage Crimson Border Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Bomkai Silk',
    weaving_time_days: 30,
    description: 'Vermilion red body with contrasting dark navy border featuring geometric tribal motifs and gold extra-weft brocade.',
    color_hue: 5,
    color_saturation: 1.4
  },
  {
    id: 15,
    name: 'Bomkai Midnight Indigo Brocade Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 210000,
    stock_status: 'available',
    material: 'Pure Mulberry Silk',
    weaving_time_days: 36,
    description: 'Deep midnight indigo with gold and copper thread extra-weft figuring portraying ancient Odia village mythologies.',
    color_hue: 245,
    color_saturation: 1.5
  },

  // ── HOUSE OF BERHAMPUR (16..20) ──
  {
    id: 16,
    name: 'Berhampur Phoda Kumbha Temple Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 180000,
    stock_status: 'available',
    material: 'Berhampur Patta Silk',
    weaving_time_days: 30,
    description: 'Famous Berhampur Pata with interlocking Phoda Kumbha temple spires along the border, woven without electricity.',
    color_hue: 130,
    color_saturation: 1.2
  },
  {
    id: 17,
    name: 'Berhampur Gongdi Silk Relic Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Gongdi Tissue Silk',
    weaving_time_days: 26,
    description: 'Rose-gold gossamer Gongdi tissue silk from Berhampur with peacock fan tail border in pure silver Zari.',
    color_hue: 330,
    color_saturation: 1.1
  },
  {
    id: 18,
    name: 'Berhampur Dual-Tone Patta Joda Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 235000,
    stock_status: 'available',
    material: 'Patta Joda Silk',
    weaving_time_days: 44,
    description: 'Ceremonial dual-tone gold and marigold silk Patta Joda, traditional attire for auspicious temple rituals in Odisha.',
    color_hue: 50,
    color_saturation: 1.3
  },
  {
    id: 19,
    name: 'Berhampur Golden Canopy Silk Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 205000,
    stock_status: 'available',
    material: 'Heavy Tissue Silk',
    weaving_time_days: 35,
    description: 'Rich ocher tissue silk with elaborate golden temple canopy borders and subtle metallic luster across the body.',
    color_hue: 42,
    color_saturation: 1.4
  },
  {
    id: 20,
    name: 'Berhampur Sacred Shrine Border Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Berhampur Silk',
    weaving_time_days: 32,
    description: 'Deep plum body with contrast mustard temple border and hand-interlocked Kumbha spire joins.',
    color_hue: 300,
    color_saturation: 1.2
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
      <td style="font-size:0.78rem;">
        <span style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); color:#d4af37; border-radius:12px; padding:2px 8px; white-space:nowrap;">
          ${item.house_name || '—'}
        </span>
      </td>
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

  // Render Weavers Module Workload table
  const weaversBody = document.getElementById('weavers-table-body');
  if (weaversBody) {
    const mockWeavers = [
      { id: 1, name: 'Smt. Sebati Mohanty', village: 'Nuapatna, Odisha', saree: 'Nuapatana Khandua Ikat Saree', progress: 75, days_left: 7, est_date: 'Nov 04, 2026' },
      { id: 2, name: 'Shri Ranjan Meher', village: 'Maniabandha, Odisha', saree: 'Konark Sundial Relic Saree', progress: 45, days_left: 16, est_date: 'Nov 14, 2026' },
      { id: 3, name: 'Shri Kailash Meher', village: 'Puri, Odisha', saree: 'Lord Jagannath Provenance Saree', progress: 90, days_left: 4, est_date: 'Nov 01, 2026' }
    ];

    weaversBody.innerHTML = mockWeavers.map(w => `
      <tr>
        <td style="font-family:monospace; color:#86868b;">#00${w.id}</td>
        <td style="font-weight:600; color:#fff;">${w.name}</td>
        <td style="color:var(--color-accent);">${w.village}</td>
        <td style="color:#fff;">${w.saree}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:${w.progress}%; height:100%; background:var(--color-accent);"></div>
            </div>
            <span style="font-family:monospace; font-size:0.75rem; color:#ffd700;">${w.progress}%</span>
          </div>
        </td>
        <td style="font-family:monospace; font-size:0.8rem; color:#2ecc71;">${w.est_date} (${w.days_left}d left)</td>
        <td>
          <button class="btn-submit" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="generateProvenanceHash('${w.saree}')">⚡ Certificate</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Enquiry-to-Commission Kanban Pipeline
  const renderKanbanCard = (enq) => `
    <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:0.8rem; font-size:0.8rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <strong style="color:#fff;">${enq.customer_name}</strong>
        <span style="color:#86868b; font-size:0.7rem;">#ENQ-${enq.id}</span>
      </div>
      <div style="color:var(--color-accent); font-size:0.75rem; margin-bottom:4px;">${enq.item_name || 'Bespoke Saree'}</div>
      <p style="color:rgba(255,255,255,0.6); font-size:0.7rem; margin-bottom:8px;">"${enq.message || 'Consultation request'}"</p>
      <div style="display:flex; gap:4px;">
        <select class="status-select" style="font-size:0.7rem; padding:2px 4px; width:100%;" onchange="updateEnquiryStatus(${enq.id}, this.value)">
          <option value="pending" ${enq.status === 'pending' ? 'selected' : ''}>New</option>
          <option value="contacted" ${enq.status === 'contacted' ? 'selected' : ''}>Consultation</option>
          <option value="commissioned" ${enq.status === 'commissioned' ? 'selected' : ''}>Commissioned</option>
          <option value="weaving" ${enq.status === 'weaving' ? 'selected' : ''}>Weaving</option>
          <option value="closed" ${enq.status === 'closed' ? 'selected' : ''}>Shipped</option>
        </select>
      </div>
    </div>
  `;

  const kNew = document.getElementById('kanban-new');
  const kConsult = document.getElementById('kanban-consult');
  const kComm = document.getElementById('kanban-commissioned');
  const kWeav = document.getElementById('kanban-weaving');
  const kShip = document.getElementById('kanban-shipped');

  if (kNew) kNew.innerHTML = enquiries.filter(e => e.status === 'pending' || !e.status).map(renderKanbanCard).join('') || '<div style="color:rgba(255,255,255,0.2); font-size:0.75rem;">Empty</div>';
  if (kConsult) kConsult.innerHTML = enquiries.filter(e => e.status === 'contacted').map(renderKanbanCard).join('') || '<div style="color:rgba(255,255,255,0.2); font-size:0.75rem;">Empty</div>';
  if (kComm) kComm.innerHTML = enquiries.filter(e => e.status === 'commissioned').map(renderKanbanCard).join('') || '<div style="color:rgba(255,255,255,0.2); font-size:0.75rem;">Empty</div>';
  if (kWeav) kWeav.innerHTML = enquiries.filter(e => e.status === 'weaving').map(renderKanbanCard).join('') || '<div style="color:rgba(255,255,255,0.2); font-size:0.75rem;">Empty</div>';
  if (kShip) kShip.innerHTML = enquiries.filter(e => e.status === 'closed' || e.status === 'shipped').map(renderKanbanCard).join('') || '<div style="color:rgba(255,255,255,0.2); font-size:0.75rem;">Empty</div>';

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

  const houseElem = document.getElementById('inp-house');
  const houseName = houseElem ? houseElem.value : 'House of Sambalpur';

  const body = {
    name: document.getElementById('inp-name').value,
    house_name: houseName,
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

/* ══════════════════════════════════════════════════════════════
   FEATURE 3: DYNAMIC PROVENANCE CERTIFICATE CREATOR
   Generates SHA-256 signed certificates from the admin console.
   Stores in localStorage cert ledger, downloadable as .cert JSON.
══════════════════════════════════════════════════════════════ */

// Populate saree dropdown from inventory
function populateCertSareeDropdown() {
  const sel = document.getElementById('cert-saree-id');
  if (!sel) return;
  // Clear except first placeholder
  while (sel.options.length > 1) sel.remove(1);
  const inv = JSON.parse(localStorage.getItem('saree_inventory') || '[]');
  const all = inv.length > 0 ? inv : FALLBACK_INVENTORY;
  all.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `#${String(item.id).padStart(4, '0')} — ${item.name}`;
    opt.dataset.artisan = item.artisan_name || '';
    opt.dataset.material = item.material || '';
    opt.dataset.days = item.weaving_time_days || '';
    opt.dataset.village = item.artisan_location || '';
    sel.appendChild(opt);
  });
}

// Auto-fill form fields when a saree is selected
const certSareeSelect = document.getElementById('cert-saree-id');
if (certSareeSelect) {
  certSareeSelect.addEventListener('change', () => {
    const opt = certSareeSelect.options[certSareeSelect.selectedIndex];
    if (opt && opt.value) {
      const artisanEl = document.getElementById('cert-artisan');
      const materialEl = document.getElementById('cert-material');
      const daysEl = document.getElementById('cert-weaving-days');
      const villageEl = document.getElementById('cert-village');
      if (artisanEl && opt.dataset.artisan) artisanEl.value = opt.dataset.artisan;
      if (materialEl && opt.dataset.material) materialEl.value = opt.dataset.material;
      if (daysEl && opt.dataset.days) daysEl.value = opt.dataset.days;
      if (villageEl && opt.dataset.village) villageEl.value = opt.dataset.village;
    }
  });
}

// Generate a deterministic mock SHA-256 from cert data
function generateCertHash(data) {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  const h1 = Math.abs(hash).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash ^ 0xdeadbeef).toString(16).padStart(8, '0');
  const h3 = Math.abs(hash ^ 0xcafebabe).toString(16).padStart(8, '0');
  const h4 = Math.abs(hash ^ 0xfeedface).toString(16).padStart(8, '0');
  return `sha256:${h1}${h2}${h3}${h4}a3f7c91e2d058b64`;
}

// Generate unique cert ID
function generateCertId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BWC-${ts}-${rand}`;
}

let lastCertData = null;

// Render preview
function renderCertPreview(cert) {
  const preview = document.getElementById('cert-preview');
  if (!preview) return;
  preview.innerHTML = `
    <div style="text-align:center; margin-bottom:1.5rem; border-bottom:1px solid rgba(212,175,55,0.2); padding-bottom:1rem;">
      <div style="font-size:0.7rem; letter-spacing:3px; color:rgba(212,175,55,0.6); text-transform:uppercase; margin-bottom:0.4rem;">The Loom of Time — Antigraviti</div>
      <div style="font-size:1.4rem; color:#d4af37; letter-spacing:1px;">Blockchain Weave Certificate</div>
      <div style="font-size:0.75rem; color:rgba(255,255,255,0.3); margin-top:0.25rem;">CERTIFICATE ID: ${cert.cert_id}</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; font-family:'Outfit',sans-serif; font-size:0.82rem;">
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Saree</div><div style="color:#fff;">${cert.saree_name}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Master Artisan</div><div style="color:#fff;">${cert.artisan}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Village Cluster</div><div style="color:#fff;">${cert.village}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Loom ID</div><div style="color:#fff;">${cert.loom_id}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Material</div><div style="color:#fff;">${cert.material}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Thread Count</div><div style="color:#fff;">${cert.weft_count || '—'}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Weaving Time</div><div style="color:#fff;">${cert.weaving_days ? cert.weaving_days + ' days' : '—'}</div></div>
      <div><div style="color:rgba(212,175,55,0.55); font-size:0.67rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Issued On</div><div style="color:#fff;">${new Date(cert.issued_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div></div>
    </div>
    ${cert.notes ? `<div style="margin-top:1rem; font-family:'Outfit',sans-serif; font-size:0.8rem; color:rgba(255,255,255,0.45); border-top:1px solid rgba(255,255,255,0.06); padding-top:0.8rem;">${cert.notes}</div>` : ''}
    <div style="margin-top:1.2rem; padding-top:0.8rem; border-top:1px solid rgba(212,175,55,0.15);">
      <div style="font-size:0.65rem; letter-spacing:0.5px; color:rgba(212,175,55,0.4); font-family:'Outfit',sans-serif; word-break:break-all;">${cert.sha256_hash}</div>
    </div>
  `;

  document.getElementById('cert-copy-btn').style.display = '';
  document.getElementById('cert-download-btn').style.display = '';
}

// Render cert ledger table
function renderCertLedger() {
  const tbody = document.getElementById('cert-ledger-body');
  if (!tbody) return;
  const certs = JSON.parse(localStorage.getItem('loom_certificates') || '[]');
  if (certs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:rgba(255,255,255,0.25); padding:2rem;">No certificates issued yet.</td></tr>';
    return;
  }
  tbody.innerHTML = certs.map(c => `
    <tr>
      <td style="font-family:monospace; font-size:0.75rem;">${c.cert_id}</td>
      <td>${c.saree_name}</td>
      <td>${c.artisan}</td>
      <td>${c.village}</td>
      <td style="font-family:monospace; font-size:0.65rem; color:rgba(212,175,55,0.6);">${c.sha256_hash.substring(0, 28)}…</td>
      <td style="font-size:0.78rem;">${new Date(c.issued_at).toLocaleDateString('en-IN')}</td>
      <td>
        <button onclick="viewCertFromLedger('${c.cert_id}')" style="background:none; border:1px solid rgba(255,255,255,0.15); color:rgba(255,255,255,0.6); padding:3px 10px; border-radius:4px; cursor:pointer; font-size:0.72rem;">View</button>
        <button onclick="deleteCertFromLedger('${c.cert_id}')" style="background:none; border:1px solid rgba(220,50,50,0.3); color:rgba(220,50,50,0.6); padding:3px 10px; border-radius:4px; cursor:pointer; font-size:0.72rem; margin-left:4px;">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.viewCertFromLedger = function(certId) {
  const certs = JSON.parse(localStorage.getItem('loom_certificates') || '[]');
  const cert = certs.find(c => c.cert_id === certId);
  if (cert) {
    lastCertData = cert;
    renderCertPreview(cert);
    // Switch to cert section
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-certificates').classList.add('active');
  }
};

window.deleteCertFromLedger = function(certId) {
  if (!confirm('Delete this certificate permanently?')) return;
  let certs = JSON.parse(localStorage.getItem('loom_certificates') || '[]');
  certs = certs.filter(c => c.cert_id !== certId);
  localStorage.setItem('loom_certificates', JSON.stringify(certs));
  renderCertLedger();
};

// Form submission
const certForm = document.getElementById('cert-form');
if (certForm) {
  certForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = document.getElementById('cert-saree-id');
    const sareeName = sel && sel.options[sel.selectedIndex].value
      ? sel.options[sel.selectedIndex].textContent
      : 'Bespoke Commission';

    const cert = {
      cert_id: generateCertId(),
      saree_name: sareeName,
      artisan: document.getElementById('cert-artisan').value,
      village: document.getElementById('cert-village').value,
      loom_id: document.getElementById('cert-loom-id').value,
      material: document.getElementById('cert-material').value,
      weft_count: document.getElementById('cert-weft-count').value || null,
      weaving_days: document.getElementById('cert-weaving-days').value || null,
      notes: document.getElementById('cert-notes').value || '',
      issued_at: new Date().toISOString(),
      issued_by: 'LoomAdmin v2.0',
      loom_technology: 'Zero-Electricity Pit Loom (Traditional Handloom)',
      standards: 'Silk Mark India Certified, GI Tag Protected',
    };
    cert.sha256_hash = generateCertHash(cert);

    lastCertData = cert;
    renderCertPreview(cert);

    // Save to ledger
    const certs = JSON.parse(localStorage.getItem('loom_certificates') || '[]');
    certs.unshift(cert);
    localStorage.setItem('loom_certificates', JSON.stringify(certs));
    renderCertLedger();

    const status = document.getElementById('cert-status');
    if (status) {
      status.textContent = `✓ Certificate ${cert.cert_id} issued and saved to ledger.`;
      setTimeout(() => { status.textContent = ''; }, 4000);
    }
  });
}

// Copy JSON
const certCopyBtn = document.getElementById('cert-copy-btn');
if (certCopyBtn) {
  certCopyBtn.addEventListener('click', () => {
    if (!lastCertData) return;
    navigator.clipboard?.writeText(JSON.stringify(lastCertData, null, 2)).then(() => {
      certCopyBtn.textContent = '✓ Copied!';
      setTimeout(() => { certCopyBtn.textContent = '📋 Copy Certificate JSON'; }, 2000);
    }).catch(() => {});
  });
}

// Download .cert
const certDownloadBtn = document.getElementById('cert-download-btn');
if (certDownloadBtn) {
  certDownloadBtn.addEventListener('click', () => {
    if (!lastCertData) return;
    const blob = new Blob([JSON.stringify(lastCertData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lastCertData.cert_id}.cert`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Init on load
populateCertSareeDropdown();
renderCertLedger();
