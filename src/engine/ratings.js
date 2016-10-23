'use strict';

const winston = require('winston');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const request = require('request');
const { Stock, Rating } = require('wolfy-models');

const UPGRADES_URLS = [
    'http://www.nasdaq.com/earnings/daily-analyst-recommendations.aspx',
    'http://www.nasdaq.com/earnings/daily-analyst-recommendations.aspx?type=downgraded',
    'http://www.nasdaq.com/earnings/daily-analyst-recommendations.aspx?type=reiterated'
];

/**
 * @name transformContent
 * @param {string} text
 * @param {string} replace
 * It clears any non alphanumberic character
 */
const transformContent = (text, replace) => {
    return text.replace(/[^A-Z0-9]/ig, replace).toUpperCase();
};

/**
 * @name fetchRating
 * @param {string} url
 * @param {array} symbols
 * Makes the request to the url and loads it up to cheerio
 * It queries for the rows of the ratings and gets the firm, the symbol and the value
 * then it filters the list leaving only the ratings for the given symbols
 * Finally it stores them in the DB
 */
const fetchRating = (url, symbols) => {
    return new Promise((resolve, reject) => {
        request(url, (err, response, html) => {
            if (err) {
                winston.error('engine/ratings.js#fetchRating(): ', err);
                return reject(err);
            }

            const items = [];
            const $ = cheerio.load(html);

            $('#earningchangetable tbody tr').each((index, row) => {
                const cols = $(row).find('td');

                if (!cols.length) {
                    return;
                }

                const firm = cols.eq(3).text();
                items.push({
                    symbol: transformContent(cols.eq(1).text(), ''),
                    firmKey: transformContent(firm, '_'),
                    firmFullText: firm,
                    value: transformContent(cols.eq(5).text(), '_')
                });
            });

            items
                .filter((item) => symbols.indexOf(item.symbol) !== -1)
                .forEach((item) => {
                    const rating = new Rating();
                    rating.symbol = item.symbol;
                    rating.firmKey = item.firmKey;
                    rating.firmFullText = item.firmFullText;
                    rating.value = item.value;
                    rating.save();
                });

            return resolve();
        });
    });
};

/**
 * @name fetchRatings
 * @param {array} symbols
 * Iterates the configured urls and for each one calls fetchRatings
 */
const fetchRatings = (symbols) => {
    const promises = UPGRADES_URLS.map((url) => fetchRating(url, symbols));
    return Promise.all(promises);
};

module.exports = (isWorker) => {
    winston.info(`####### Execute ratings at ${moment().format('L HH:mm')}#############`);
    Stock.find().exec().then((stocks) => {
        fetchRatings(stocks.map((stock) => stock.symbol))
            .then(() => {
                if (isWorker) {
                    process.exit(0);
                }
            });
    });
};
