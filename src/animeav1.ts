import { Browser } from "puppeteer";

const baseUrl = 'https://animeav1.com/';

async function episodesLinks(browser: Browser, url: string): Promise<string[]> {
    const page = await browser.newPage()
    await page.goto(url)

    return await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('section:nth-child(3) a'))
        return links
            .map(el => el.getAttribute('href'))
            .filter(link => link != null)
            .map(link => `${baseUrl}${link}`)
    })
}