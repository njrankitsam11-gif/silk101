import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const { lhr } = await lighthouse('https://silk101.vercel.app', {
  port: new URL(browser.wsEndpoint()).port,
  output: 'json',
  logLevel: 'error',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
});
await browser.close();

const cats = lhr.categories;
console.log(JSON.stringify({
  performance: Math.round(cats.performance.score * 100),
  accessibility: Math.round(cats.accessibility.score * 100),
  bestPractices: Math.round(cats['best-practices'].score * 100),
  seo: Math.round(cats.seo.score * 100),
  audits: {
    lcp: lhr.audits['largest-contentful-paint']?.displayValue,
    fcp: lhr.audits['first-contentful-paint']?.displayValue,
    tbt: lhr.audits['total-blocking-time']?.displayValue,
    cls: lhr.audits['cumulative-layout-shift']?.displayValue,
    tti: lhr.audits['interactive']?.displayValue,
    si: lhr.audits['speed-index']?.displayValue,
    totalByteWeight: lhr.audits['total-byte-weight']?.displayValue,
  }
}, null, 2));
