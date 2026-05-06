/**
 * Selenium scraper:
 *   1. Opens https://quotes.toscrape.com/login
 *   2. Authenticates (any username/password works on this practice site)
 *   3. Navigates the authenticated home page
 *   4. Scrapes quotes (text, author, tags, goodreads link visible only when logged in)
 *   5. Iterates through pagination
 *   6. Persists results to scraper/scraped-data.json
 */
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface ScrapedQuote {
  text: string;
  author: string;
  tags: string[];
  authorAboutHref: string | null;
}

const BASE_URL = 'https://quotes.toscrape.com';
const OUTPUT_FILE = resolve(__dirname, 'scraped-data.json');
const CREDENTIALS = { username: 'admin', password: 'admin' };
const MAX_PAGES = 5;

async function buildDriver(): Promise<WebDriver> {
  const options = new ChromeOptions();
  options.addArguments(
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,900',
  );
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

async function login(driver: WebDriver): Promise<void> {
  console.log(`[auth] navigating to ${BASE_URL}/login`);
  await driver.get(`${BASE_URL}/login`);

  await driver.wait(until.elementLocated(By.css('input[name="username"]')), 10_000);
  await driver.findElement(By.css('input[name="username"]')).sendKeys(CREDENTIALS.username);
  await driver.findElement(By.css('input[name="password"]')).sendKeys(CREDENTIALS.password);
  await driver.findElement(By.css('input[type="submit"]')).click();

  // Logged-in indicator: the "Logout" link
  await driver.wait(until.elementLocated(By.linkText('Logout')), 10_000);
  console.log('[auth] login successful');
}

async function scrapePage(driver: WebDriver, pageUrl: string): Promise<ScrapedQuote[]> {
  console.log(`[scrape] ${pageUrl}`);
  await driver.get(pageUrl);
  await driver.wait(until.elementLocated(By.css('.quote')), 10_000);

  const quoteElements = await driver.findElements(By.css('.quote'));
  const quotes: ScrapedQuote[] = [];

  for (const quoteEl of quoteElements) {
    const text = await quoteEl.findElement(By.css('.text')).getText();
    const author = await quoteEl.findElement(By.css('.author')).getText();
    const tagElements = await quoteEl.findElements(By.css('.tags a.tag'));
    const tags = await Promise.all(tagElements.map((t) => t.getText()));

    let authorAboutHref: string | null = null;
    try {
      authorAboutHref = await quoteEl.findElement(By.linkText('(about)')).getAttribute('href');
    } catch {
      authorAboutHref = null;
    }

    quotes.push({ text, author, tags, authorAboutHref });
  }
  return quotes;
}

async function hasNextPage(driver: WebDriver): Promise<string | null> {
  const next = await driver.findElements(By.css('li.next a'));
  if (next.length === 0) return null;
  return next[0].getAttribute('href');
}

async function main(): Promise<void> {
  const driver = await buildDriver();
  const allQuotes: ScrapedQuote[] = [];

  try {
    await login(driver);

    let nextUrl: string | null = `${BASE_URL}/`;
    let pageNum = 0;

    while (nextUrl && pageNum < MAX_PAGES) {
      pageNum += 1;
      const pageQuotes = await scrapePage(driver, nextUrl);
      allQuotes.push(...pageQuotes);
      nextUrl = await hasNextPage(driver);
    }

    const summary = {
      scrapedAt: new Date().toISOString(),
      source: BASE_URL,
      authenticated: true,
      pagesVisited: pageNum,
      totalQuotes: allQuotes.length,
      uniqueAuthors: [...new Set(allQuotes.map((q) => q.author))].sort(),
      uniqueTags: [...new Set(allQuotes.flatMap((q) => q.tags))].sort(),
      quotes: allQuotes,
    };

    await mkdir(dirname(OUTPUT_FILE), { recursive: true });
    await writeFile(OUTPUT_FILE, JSON.stringify(summary, null, 2), 'utf-8');

    console.log('\n=== SCRAPE COMPLETE ===');
    console.log(`Pages visited:   ${summary.pagesVisited}`);
    console.log(`Quotes scraped:  ${summary.totalQuotes}`);
    console.log(`Unique authors:  ${summary.uniqueAuthors.length}`);
    console.log(`Unique tags:     ${summary.uniqueTags.length}`);
    console.log(`Saved to:        ${OUTPUT_FILE}`);
  } finally {
    await driver.quit();
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
