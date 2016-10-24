#!/usr/bin/env node
const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');

const boot = require('../src/boot');
const reset = require('./reset');
const prices = require('./prices');
const stocks = require('./stocks');
const reports = require('./reports');
const tweets = require('./tweets');
const addPrice = require('./add_price');

const program = require('commander')
    .version('0.0.1')
    .option('-r, --reset', 'Reset database');

winston.add(winstonDailyRotateFile, {
    filename: 'log'
});

function before(shouldReset, cb) {
    boot('mongodb://localhost/stocks', {
        env: 'development'
    });

    if (shouldReset) {
        return reset().then(stocks).then(cb);
    }

    return cb();
}

/**
 * @usage ./seed/index.js price -i 30 -p 20 -r
 */
program
    .command('price')
    .description('seed prices')
    .option('-i, --interval [value]', 'Interval (in minutes)')
    .option('-p, --period [value]', 'Period (in days)')
    .action((options) => {
        before(options.parent.reset, () => prices(options.interval, options.period))
            .then(() => process.exit(0));
    });

/**
 * @usage ./seed/index.js reports -s 3
 */
program
    .command('reports')
    .description('run reports')
    .option('-s, --since [value]', 'Since (in days)')
    .action((since, others) => {
        before(others.parent.reset, () => reports(since))
            .then(() => process.exit(0));
    });

/**
 * @usage ./seed/index.js tweets -s 10
 */
program
    .command('tweets')
    .description('run reports')
    .option('-s, --since [value]', 'Since (in days)')
    .action((since, others) => {
        before(others.parent.reset, () => tweets(since))
            .then(() => process.exit(0));
    });

/**
 * @usage ./seed/index.js addprice
 * Posts a message to zeromq with a new price
 */
program
    .command('addprice')
    .description('add price')
    .action(() => {
        before(false, () => addPrice()).then(() => process.exit(0));
    });

program.parse(process.argv);
