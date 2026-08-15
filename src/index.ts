#!/usr/bin/env node
import { program } from 'commander';
import { extractLinksCommand } from './cli.js';
import { log } from './logging.js';

program.name("osaka")
  .argument("<url>")
  .option('-o, --output <file>', 'File path or STDOUT to write the links JSON', 'STDOUT')
  .action((url, options) => {
    extractLinksCommand(url, options.output).catch(error => {
      log.warn('failed extracting download links for %s: %s', url, error)
      process.exit(1)
    })
  })

program.parse()
