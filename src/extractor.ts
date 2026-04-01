import { Browser } from "puppeteer";

export interface GroupedDownloadLinks {
    [server: string]: {
        [format: string]: string[];
    };
}

export type Extractor = (browser: Browser, url: string) => Promise<GroupedDownloadLinks>
