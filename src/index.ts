#!/usr/bin/env node
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');

interface GroupedDownloadLinks {
  [server: string]: {
    [format: string]: string[];
  };
}

const groupedLinks: GroupedDownloadLinks = {};
const url = process.argv[2];

if (url == null) {
  console.log('URL no especificada');
  process.exit(1);
}

const id = url.split('/').pop();
const fileName = `${id}-links.json`;
console.log('Saving links to ', fileName);

const baseUrl = 'https://www3.animeflv.net';
const extensionPath = path.resolve(__dirname, 'ubol-extension');

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    '--start-maximized'
  ],
});

try {
  const page = await browser.newPage();
  await page.goto(url);

  const episodesLinks = await page.$$('.ListCaps a');
  const hrefs: string[] = [];

  for (const episodeLink of episodesLinks) {
    const href = await page.evaluate(el => el.getAttribute('href'), episodeLink);
    if (href) hrefs.push(href);
  }

  for (const href of hrefs) {
    const episodeUrl = baseUrl + href;
    console.log(`navigating to ${episodeUrl}`);

    const episodeHtml = await fetch(episodeUrl).then(response => response.text())
    const episodePage = new JSDOM(episodeHtml)

    console.log('extracting links from download table')
    const tableRows = episodePage.window.document.querySelectorAll('#DwsldCn table tbody tr');
    console.log('found', tableRows.length, 'rows in dowloads table')

    for (const row of tableRows) {
      const server = (row.querySelector('td:nth-child(1)') as HTMLElement | null)?.innerHTML ?? ''
      const format = (row.querySelector('td:nth-child(3)') as HTMLElement | null)?.innerHTML ?? ''
      const getDownloadUrl = (row.querySelector('td:nth-child(4) a') as HTMLAnchorElement | null)?.getAttribute('href') ?? ''

      if (getDownloadUrl == null) {
        console.warn(`download url not found on downloads table row`);
        continue;
      }

      const downloadLinkHtml = await fetch(getDownloadUrl).then(response => response.text())
      const downloadLinkPage = new JSDOM(downloadLinkHtml)
      const downloadUrlBtn: HTMLAnchorElement | null = downloadLinkPage.window.document.querySelector('.dwnl-btn');

      if (downloadUrlBtn == null) {
        console.warn(`download link not found on ${getDownloadUrl}`);
        continue;
      }

      const finalUrl = downloadUrlBtn.getAttribute('href');

      if (finalUrl != null) {
        if (typeof groupedLinks[server] === 'undefined') {
          groupedLinks[server] = {};
        }

        if (typeof groupedLinks[server][format] === 'undefined') {
          groupedLinks[server][format] = [];
        }

        groupedLinks[server][format].push(finalUrl);
      }
    }
  }

  const json = JSON.stringify(groupedLinks, null, 2);
  fs.writeFileSync(fileName, json);
  console.log('Done!');
} catch (error) {
  console.error('Error during scraping:', error);
} finally {
  await browser.close();
}
