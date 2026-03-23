import { Browser } from "puppeteer";
import { JSDOM } from "jsdom";
import { sleep } from "./utils";

export interface GroupedDownloadLinks {
    [server: string]: {
        [format: string]: string[];
    };
}

type Info = [string, string, string]
type Episodes = [[number, number]]

const baseUrl = 'https://www3.animeflv.net';

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

export async function extractFromDownloadLinks(browser: Browser, url: string): Promise<GroupedDownloadLinks> {
    const groupedLinks: GroupedDownloadLinks = {};

    const links = await episodesLinks(browser, url)

    for (const link of links) {
        console.log(`navigating to ${link}`);

        const episodeHtml = await fetch(link).then(response => response.text())
        const episodePage = new JSDOM(episodeHtml)

        console.log('extracting links from download table')
        const tableRows = episodePage.window.document.querySelectorAll('#DwsldCn table tbody tr');
        console.log('found', tableRows.length, 'rows in dowloads table')

        for (const row of tableRows) {
            const server = (row.querySelector('td:nth-child(1)') as HTMLElement | null)?.innerHTML ?? ''
            const format = (row.querySelector('td:nth-child(3)') as HTMLElement | null)?.innerHTML ?? ''
            const getDownloadUrl = (row.querySelector('td:nth-child(4) a') as HTMLAnchorElement | null)?.getAttribute('href') ?? ''

            if (getDownloadUrl == null) {
                console.warn(`download url not found on downloads table row`);
                continue;
            }

            const downloadLinkHtml = await fetch(getDownloadUrl).then(response => response.text())
            const downloadLinkPage = new JSDOM(downloadLinkHtml)
            const downloadUrlBtn: HTMLAnchorElement | null = downloadLinkPage.window.document.querySelector('.dwnl-btn');

            if (downloadUrlBtn == null) {
                console.warn(`download link not found on ${getDownloadUrl}`);
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

export async function extractFromStreamWishOption(browser: Browser, url: string): Promise<string[]> {
    const links: string[] = []
    const epLinks = await episodesLinks(browser, url)

    for (const link of epLinks) {
        console.log(`[SW] navigating to ${link}`);

        const episodeHtml = await fetch(link).then(response => response.text())
        const episodePage = new JSDOM(episodeHtml)
        const script: HTMLScriptElement | null = episodePage.window.document.querySelector('body > script:nth-child(16)')

        if (script == null) {
            console.log('videos script not found')
            continue
        }

        const videosRegex = /^ *var videos = (.*);$/gm
        const videosJson = (videosRegex.exec(script.innerHTML) ?? [])[1] ?? ''

        if (videosJson === '') {
            console.log('unable to extract videos json')
            continue
        }

        const videos: Videos = JSON.parse(videosJson)
        const videoUrl = videos.SUB
            .filter(option => option.server === 'sw')
            .pop()?.code

        if (videoUrl == null) {
            console.log('unable to find video on sw server')
            continue
        }

        const videoId = videoUrl.replace('https://streamwish.to/e/', '')
        const downloadUrl = `https://hglamioz.com/f/${videoId}_h`
        await sleep(3 * 1000)
        const downloadPage = await browser.newPage()
        await downloadPage.goto(downloadUrl)

        try {
            await downloadPage.waitForSelector('.alert.alert-danger', {
                timeout: 2 * 1000
            })

            console.log('found page error on:', downloadUrl)
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

        console.log('waiting for link button:', downloadUrl)
        await downloadPage.waitForSelector('.submit-btn')

        const downloadlink = await downloadPage.evaluate(() => {
            const element: HTMLAnchorElement | null = document.querySelector('.submit-btn')
            return element?.getAttribute('href')
        })

        if (downloadlink == null) {
            console.log('download link missing')
            downloadPage.close()
            continue
        }

        links.push(downloadlink)
        downloadPage.close()
    }

    return links
}
