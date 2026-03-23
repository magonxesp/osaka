#!/usr/bin/env node
import fs from 'fs';
import { extractFromDownloadLinks, extractFromStreamWishOption } from './animeflv';
import { launchBrowser } from './browser';

const url = process.argv[2];

if (url == null) {
  console.log('URL no especificada');
  process.exit(1);
}

const browser = await launchBrowser()
const id = url.split('/').pop();
const fileName = `${id}-links.json`;
console.log('Saving links to ', fileName);

try {
  const [downloadLinks, swDownloadLinks] = await Promise.all([
    extractFromDownloadLinks(browser, url),
    extractFromStreamWishOption(browser, url)
  ])

  // add sw to discovered download links
  downloadLinks.SW = {
    SUB: swDownloadLinks
  }

  const json = JSON.stringify(downloadLinks, null, 2);
  fs.writeFileSync(fileName, json);
  console.log('Done!');
} catch (exception) {
  console.log('error while scrapping download links:', exception)
} finally {
  browser.close()
}
