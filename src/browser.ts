import puppeteer from 'puppeteer';

export async function launchBrowser() {
    return await puppeteer.launch({
        headless: (process.env.OSAKA_HEADLESS_BROWSER ?? 'true') === 'true',
        defaultViewport: null,
        args: [
            '--start-maximized'
        ],
    });
}
