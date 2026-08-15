import express, { Router, type Request, type Response } from 'express';
import { launchBrowser } from './browser.js';
import { pinoHttp } from 'pino-http'
import { log } from './logging.js';
import { extractLinksFromUrl } from './links.js';

const router = Router()

router.get('/links', async (req: Request, res: Response) => {
    if (req.query.url == null || req.query.url === '') {
        res.sendStatus(400)
        return
    }

    const url = decodeURIComponent(req.query.url.toString())
    const browser = await launchBrowser()

    try {
        const links = await extractLinksFromUrl(browser, url)
        res.status(200).json(links)
    } catch (error) {
        log.warn('failed extracting download links for %s: %s', url, error)
        res.sendStatus(500)
    } finally {
        await browser.close()
    }
})

export function startHttpServer(listenPort: number) {
    const app = express()
    const port = Number(process.env.OSAKA_HTTP_PORT ?? listenPort)
    log.info('starting http server on port: %d', port)

    app.use(pinoHttp({ logger: log }))
    app.use(router)
    app.listen(port)
}
