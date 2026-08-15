#!/usr/bin/env node
import { program } from 'commander';
import { extractLinksCommand } from './cli.js';
import { log } from './logging.js';
import { startHttpServer } from './http.js';

program.name("osaka")
  .argument("<url>")
  .option('-o, --output <file>', 'File path or STDOUT to write the links JSON', 'STDOUT')
  .action((url, options) => {
    extractLinksCommand(url, options.output).catch(error => {
      log.warn('failed extracting download links for %s: %s', url, error)
      process.exit(1)
    })
  })

program.command('http')
  .description('Start osaka as HTTP server')
  .option('-p, --port <port>', 'Server port', '3000')
  .action(options => startHttpServer(options.port))

program.parse()
