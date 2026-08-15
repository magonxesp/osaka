import { Browser } from "puppeteer";
import { JSDOM } from "jsdom";
import { sleep } from "./utils.js";
import { DownloadLinks, GroupedDownloadLinks } from "./links.js";
import { log } from "./logging.js";

type Info = [string, string, string]
type Episodes = [[number, number]]

const baseUrl = 'https://www3.animeflv.net';

export async function extract(browser: Browser, url: string): Promise<DownloadLinks> {
    const [downloadLinks, swDownloadLinks] = await Promise.all([
        extractFromDownloadLinks(browser, url),
        extractFromStreamWishOption(browser, url)
    ])

    // add sw to discovered download links
    downloadLinks.SW = {
        SUB: swDownloadLinks
    }

    return { title: '', links: downloadLinks }
}

async function episodesLinks(_browser: Browser, url: string): Promise<string[]> {
    const episodesHtml = await fetch(url).then(response => response.text())
    const episodesPage = new JSDOM(episodesHtml)
    const scripts: HTMLScriptElement[] = Array.from(episodesPage.window.document.querySelectorAll('body > script') ?? [])
    const script = scripts.filter(element => element.innerHTML.includes('var anime_info')).pop()

    if (script == null) {
        throw 'episodes script not found'
    }

    const scriptContent = script.innerHTML
    const infoRegex = /^ *var anime_info = (.*);$/gm
    const info: Info = JSON.parse((infoRegex.exec(scriptContent) ?? [])[1] ?? '')

    const episodesRegex = /^ *var episodes = (.*);$/gm
    const episodes: Episodes = JSON.parse((episodesRegex.exec(scriptContent) ?? [])[1] ?? '')

    const [_id, _title, slug] = info
    return episodes.map(([episode, _]) => `${baseUrl}/ver/${slug}-${episode}`)
}

async function extractFromDownloadLinks(browser: Browser, url: string): Promise<GroupedDownloadLinks> {
    const groupedLinks: GroupedDownloadLinks = {};

    const links = await episodesLinks(browser, url)

    for (const link of links) {
        log.info('navigating to %s', link);

        const episodeHtml = await fetch(link).then(response => response.text())
        const episodePage = new JSDOM(episodeHtml)

        log.info('extracting links from download table')
        const tableRows = episodePage.window.document.querySelectorAll('#DwsldCn table tbody tr');
        log.info('found %d rows in dowloads table', tableRows.length)

        for (const row of tableRows) {
            const server = (row.querySelector('td:nth-child(1)') as HTMLElement | null)?.innerHTML ?? ''
            const format = (row.querySelector('td:nth-child(3)') as HTMLElement | null)?.innerHTML ?? ''
            const getDownloadUrl = (row.querySelector('td:nth-child(4) a') as HTMLAnchorElement | null)?.getAttribute('href') ?? ''

            if (getDownloadUrl == null) {
                log.warn('download url not found on downloads table row');
                continue;
            }

            const downloadLinkHtml = await fetch(getDownloadUrl).then(response => response.text())
            const downloadLinkPage = new JSDOM(downloadLinkHtml)
            const downloadUrlBtn: HTMLAnchorElement | null = downloadLinkPage.window.document.querySelector('.dwnl-btn');

            if (downloadUrlBtn == null) {
                log.warn('download link not found on %s', getDownloadUrl);
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

    return groupedLinks
}

type Videos = {
    SUB: [{
        server: string
        code: string
    }]
}

async function extractFromStreamWishOption(browser: Browser, url: string): Promise<string[]> {
    const links: string[] = []
    const epLinks = await episodesLinks(browser, url)

    for (const link of epLinks) {
        log.info('[SW] navigating to %s', link);

        const episodeHtml = await fetch(link).then(response => response.text())
        const episodePage = new JSDOM(episodeHtml)
        const script: HTMLScriptElement | null = episodePage.window.document.querySelector('body > script:nth-child(16)')

        if (script == null) {
            log.warn('videos script not found')
            continue
        }

        const videosRegex = /^ *var videos = (.*);$/gm
        const videosJson = (videosRegex.exec(script.innerHTML) ?? [])[1] ?? ''

        if (videosJson === '') {
            log.warn('unable to extract videos json')
            continue
        }

        const videos: Videos = JSON.parse(videosJson)
        const videoUrl = videos.SUB
            .filter(option => option.server === 'sw')
            .pop()?.code

        if (videoUrl == null) {
            log.warn('unable to find video on sw server')
            continue
        }

        const downloadPage = await browser.newPage()
        await downloadPage.goto(videoUrl)

        const host = await downloadPage.evaluate(() => window.location.host)
        const videoId = videoUrl.replace('https://streamwish.to/e/', '')
        const downloadLinksPageUrl = `https://${host}/f/${videoId}`

        log.info('Extrayendo link a la pagina del boton de descargar en: %s', downloadLinksPageUrl)
        const downloadLinksPageHtml = await fetch(downloadLinksPageUrl).then(response => response.text())
        const downloadLinksPage = new JSDOM(downloadLinksPageHtml)
        const downloadLink: HTMLAnchorElement | null = downloadLinksPage.window.document.querySelector('.downloadv-item')
        let downloadUrl = downloadLink?.getAttribute('href')

        if (downloadUrl == null) {
            log.warn('No se ha encontrado link de descarga en: %s', downloadLinksPageUrl)
            continue
        }

        downloadUrl = `https://${host}${downloadUrl}`
        log.info('Url a la pagina del boton de descargar resuelto: %s', downloadUrl)

        await sleep(3 * 1000)
        await downloadPage.goto(downloadUrl)

        try {
            await downloadPage.waitForSelector('.alert.alert-danger,.text-danger.text-center.mb-5', {
                timeout: 2 * 1000
            })

            log.info('found page error on: %s', downloadUrl)
            downloadPage.close()
            continue
        } catch {
            // do nothing
        }

        await Promise.all([
            downloadPage.waitForNavigation({
                timeout: 0, // no timeout,
            }),
            downloadPage.evaluate(() => {
                const button: HTMLButtonElement | null = document.querySelector('.submit-btn')
                button?.click()
            })
        ])

        log.info('waiting for link button: %s', downloadUrl)
        await downloadPage.waitForSelector('.submit-btn')

        const downloadlink = await downloadPage.evaluate(() => {
            const element: HTMLAnchorElement | null = document.querySelector('.submit-btn')
            return element?.getAttribute('href')
        })

        if (downloadlink == null) {
            log.warn('download link missing')
            downloadPage.close()
            continue
        }

        links.push(downloadlink)
        downloadPage.close()
    }

    return links
}

export default { baseUrl, extract }