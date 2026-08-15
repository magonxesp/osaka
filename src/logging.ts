import pino from "pino"
import path from "node:path"
import { logDir } from "./platform.js"

const transport = pino.transport({
    target: 'pino/file',
    options: {
        destination: process.env.OSAKA_LOG_FILE ?? path.join(logDir(), 'osaka.log'),
        mkdir: true,
        append: true
    },
})

export const log = pino({
    level: process.env.OSAKA_LOG_LEVEL ?? 'debug',
}, transport)
