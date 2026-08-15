import { launchBrowser } from "./browser.js";
import { extractLinksFromUrl } from "./links.js";
import fs from 'node:fs'

export async function extractLinksCommand(url: string, output: string) {
    const browser = await launchBrowser()

    try {
        const links = await extractLinksFromUrl(browser, url)
        const json = JSON.stringify(links, undefined, 2)

        if (output === 'STDOUT') {
            process.stdout.write(json)
        } else {
            fs.writeFileSync(output, json)
        }
    } finally {
        browser.close()
    }
}
