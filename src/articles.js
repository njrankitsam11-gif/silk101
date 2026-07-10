// Client side engine for dynamic articles rendering and SEO injection
import './style.css'; // Make sure styles exist

document.addEventListener('DOMContentLoaded', async () => {
  setupCursor();
  
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const listSection = document.getElementById('articles-list-view');
  const detailSection = document.getElementById('article-detail-view');
  const breadcrumbs = document.getElementById('breadcrumbs-panel');

  if (slug) {
    // Render Single Article
    listSection.style.display = 'none';
    detailSection.style.display = 'block';
    
    try {
      const response = await fetch(`/api/articles/${slug}`);
      if (!response.ok) {
        throw new Error('Article not found');
      }
      const article = await response.json();
      
      // Update metadata on page dynamically for crawlers
      document.title = `${article.title} | The Loom of Time`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', article.meta_description || 'Handloom silk weaving chronicles and guides.');
      }

      // Update breadcrumbs
      breadcrumbs.innerHTML = `<a href="/">Home</a> / <a href="/articles.html">Weaving Journal</a> / <span class="current">${article.title}</span>`;

      // Render content
      const detailContent = document.getElementById('article-detail-content');
      detailContent.innerHTML = `
        <div class="article-card-meta">
          Published on ${new Date(article.created_at).toLocaleDateString()} &nbsp;·&nbsp; Target Locale: ${article.target_locale ? article.target_locale.toUpperCase() : 'GLOBAL'}
        </div>
        ${article.content_html}
      `;

      // Inject dynamic JSON-LD Schema
      injectArticleSchema(article);

    } catch (error) {
      console.error(error);
      const detailContent = document.getElementById('article-detail-content');
      detailContent.innerHTML = `
        <h1 style="color:#ff6b6b; font-family:'Playfair Display', serif;">Article Not Found</h1>
        <p style="font-family:'Outfit', sans-serif;">The article you are searching for is not available. <a href="/articles.html" style="color:var(--color-zari);">Browse Weaving Journal</a></p>
      `;
    }
  } else {
    // Render Articles Index List
    listSection.style.display = 'block';
    detailSection.style.display = 'none';
    breadcrumbs.innerHTML = `<a href="/">Home</a> / <span class="current">Weaving Journal</span>`;

    try {
      const response = await fetch('/api/articles');
      const articles = await response.json();
      
      // Only show published articles in directory
      const published = articles.filter(a => a.status === 'published');
      
      const grid = document.getElementById('article-grid');
      if (published.length === 0) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No published articles yet. Check back soon!</p>';
        return;
      }

      grid.innerHTML = published.map(art => `
        <div class="article-card">
          <div class="article-card-meta">
            ${new Date(art.created_at).toLocaleDateString()} &nbsp;·&nbsp; KEYWORD: ${art.topic_keyword || 'General'}
          </div>
          <h2 class="article-card-title">${art.title}</h2>
          <p class="article-card-desc">${art.meta_description || 'Explore the complete handloom silk article details.'}</p>
          <a href="/articles.html?slug=${art.slug}" class="read-more-btn">Read Article &rarr;</a>
        </div>
      `).join('');

    } catch (error) {
      console.error(error);
      document.getElementById('article-grid').innerHTML = '<p style="color:#ff6b6b;">Error loading Weaving Journal articles list.</p>';
    }
  }
});

// Dynamic Schema Injection
function injectArticleSchema(article) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description,
    "datePublished": article.created_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Organization",
      "name": "The Loom of Time Team",
      "url": "https://silk101.vercel.app/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Loom of Time",
      "logo": {
        "@type": "ImageObject",
        "url": "https://silk101.vercel.app/favicon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://silk101.vercel.app/articles.html?slug=${article.slug}`
    }
  };

  script.text = JSON.stringify(articleSchema);
  document.head.appendChild(script);
}

// Custom Cursor Trail Implementation matching main page aesthetics
function setupCursor() {
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');

  if (!cursorDot || !cursorRing) return;

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Add interactions for hover states
  const interactives = document.querySelectorAll('a, button, input, select');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursorRing.style.borderColor = 'var(--color-zari, #d4af37)';
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    });
  });
}
