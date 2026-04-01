#!/usr/bin/env node
import fs from 'fs';
import animeflv from './animeflv';
import animeav1 from './animeav1';
import { launchBrowser } from './browser';
import { GroupedDownloadLinks } from './extractor';

const url = process.argv[2];

if (url == null) {
  console.log('URL no especificada');
  process.exit(1);
}

const browser = await launchBrowser()
const id = url.split('/').pop();
const fileName = `${id}-links.json`;
console.log('Saving links to', fileName);

try {
  let downloadLinks: GroupedDownloadLinks

  if (url.startsWith(animeflv.baseUrl)) {
    downloadLinks = await animeflv.extract(browser, url)
  } else if (url.startsWith(animeav1.baseUrl)) {
    downloadLinks = await animeav1.extract(browser, url)
  } else {
    console.warn('Web de anime no soportado')
    process.exit(1)
  }

  const json = JSON.stringify(downloadLinks, null, 2);
  fs.writeFileSync(fileName, json);
  console.log('Done!');
} catch (exception) {
  console.log('error while scrapping download links:', exception)
} finally {
  browser.close()
}
