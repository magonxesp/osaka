import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');
const extensionPath = path.resolve(__dirname, 'ubol-extension');

export async function launchBrowser() {
    return await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--start-maximized'
        ],
    });
}