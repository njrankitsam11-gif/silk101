import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Wait a bit for JS effects
  await new Promise(r => setTimeout(r, 2000));
  
  const layout = await page.evaluate(() => {
    const vault = document.querySelector('#vault');
    const container = document.querySelector('.tunnel-container');
    const stage = document.querySelector('.tunnel-stage');
    const card = document.querySelector('.saree-card');
    
    return {
      vault: vault ? vault.getBoundingClientRect() : null,
      container: container ? container.getBoundingClientRect() : null,
      stage: stage ? stage.getBoundingClientRect() : null,
      card: card ? {
        rect: card.getBoundingClientRect(),
        transform: getComputedStyle(card).transform,
        top: getComputedStyle(card).top,
        left: getComputedStyle(card).left,
        margin: getComputedStyle(card).marginTop
      } : null
    };
  });
  
  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();
