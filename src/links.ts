import { Browser } from "puppeteer";
import animeflv from './animeflv.js';
import animeav1 from './animeav1.js';
import { launchBrowser } from './browser.js';

export interface GroupedDownloadLinks {
    [server: string]: {
        [format: string]: string[];
    };
}

export type Extractor = (browser: Browser, url: string) => Promise<GroupedDownloadLinks>

export async function extractLinksFromUrl(browser: Browser, url: string): Promise<GroupedDownloadLinks> {
    let links: GroupedDownloadLinks

    if (url.startsWith(animeflv.baseUrl)) {
        links = await animeflv.extract(browser, url)
    } else if (url.startsWith(animeav1.baseUrl)) {
        links = await animeav1.extract(browser, url)
    } else {
        throw new Error('anime provider not supported')
    }

    return links
}