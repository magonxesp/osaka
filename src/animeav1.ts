import { Browser } from "puppeteer";
import { GroupedDownloadLinks } from "./extractor.js";
import { sleep } from "./utils.js";

const baseUrl = 'https://animeav1.com';

interface DownloadLink {
    provider: string,
    format: string,
    url: string
}

async function extractEpisodesLinks(browser: Browser, url: string): Promise<string[]> {
    const page = await browser.newPage()
    await page.goto(url)

    const links = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('section:nth-child(3) a, section:nth-child(2) a'))
        return links.map(el => el.getAttribute('href'))
    })

    console.log('found', links.length, 'links')

    const validLinks = links
        .filter(link => link != null && link.startsWith('/media'))
        .map(link => `${baseUrl}${link}`)

    console.log(validLinks.length, 'links were valid')
    console.log(validLinks)
    return validLinks
}

async function extractFromDownloadLinks(browser: Browser, url: string): Promise<GroupedDownloadLinks> {
    const groupedLinks: GroupedDownloadLinks = {};
    const episodesLinks = await extractEpisodesLinks(browser, url)
    const page = await browser.newPage()

    for (const episodeLink of episodesLinks) {
        await page.goto(episodeLink)
        await page.waitForSelector('button[aria-label="Descargar"]')

        await page.evaluate(() => {
            const button: HTMLButtonElement | null = document.querySelector('button[aria-label="Descargar"]')
            button?.click()
        })

        await page.waitForSelector('div[data-dialog-content][data-state="open"]')
        const downloadLinks = await page.evaluate(() => {
            const downloadLinks: DownloadLink[] = []
            const options: HTMLAnchorElement[] = Array.from(
                document.querySelectorAll('div[data-dialog-content][data-state="open"] a')
            )

            for (const option of options) {
                const provider = option.querySelector('span:first-child')?.textContent ?? ''
                const format = option.querySelector('div > span:first-child')?.textContent ?? ''
                const url = option.href

                downloadLinks.push({ provider, format, url })
            }

            return downloadLinks
        })

        for (const downloadLink of downloadLinks) {
            if (typeof groupedLinks[downloadLink.provider] === 'undefined') {
                groupedLinks[downloadLink.provider] = {}
            }

            if (typeof groupedLinks[downloadLink.provider][downloadLink.format] === 'undefined') {
                groupedLinks[downloadLink.provider][downloadLink.format] = []
            }

            groupedLinks[downloadLink.provider][downloadLink.format].push(downloadLink.url)
        }
    }

    page.close()
    return groupedLinks
}

export default {
    baseUrl,
    extract: extractFromDownloadLinks
}
