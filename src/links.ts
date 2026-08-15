import { Browser } from "puppeteer";
import animeflv from './animeflv.js';
import animeav1 from './animeav1.js';

export interface GroupedDownloadLinks {
    [server: string]: {
        [format: string]: string[];
    };
}

export interface DownloadLinks {
    title: string
    links: GroupedDownloadLinks
}

export type Extractor = (browser: Browser, url: string) => Promise<DownloadLinks>

export async function extractLinksFromUrl(browser: Browser, url: string): Promise<DownloadLinks> {
    let links: DownloadLinks

    if (url.startsWith(animeflv.baseUrl)) {
        links = await animeflv.extract(browser, url)
    } else if (url.startsWith(animeav1.baseUrl)) {
        links = await animeav1.extract(browser, url)
    } else {
        throw new Error('anime provider not supported')
    }

    return links
}