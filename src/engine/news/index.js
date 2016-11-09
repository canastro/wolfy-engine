'use strict';

const winston = require('winston');
const cheerio = require('cheerio');
const sentiment = require('sentiment');
const moment = require('moment-timezone');
const request = require('request');
const Article = require('wolfy-models/src/schema/article');
const Stock = require('wolfy-models/src/schema/stock');
const dictionary = require('../../constants/dictionary');

const config = [
    require('./bloomberg'),
    require('./cnbc'),
    require('./reuters'),
    require('./seeking-alpha'),
    require('./wsj'),
    require('./yahoo')
];

/**
 * @name store
 * @param {string} symbol
 * @param {string} url
 * @param {number} sentiment
 * It stores in the DB the results
 */
const store = (symbol, url, title, text, sentiment) => {
    if (!title && !text) {
        return null;
    }

    const article = new Article();
    article.symbol = symbol;
    article.title = title ? title.substring(0, 200) : '';
    article.text = text ? text.substring(0, 400) : '';
    article.url = url;
    article.sentiment = sentiment;
    article.save();
};

/**
 * @name getSentiment
 * @param {string} text
 * @returns {number}
 * Gets the text of the artile and returns the sentiment on a scale of -1 to 1
 */
const getSentiment = (text) => {
    let absolute = sentiment(text, dictionary).score;
    if (absolute === 0) {
        return 0;
    }

    return absolute > 0 ? 1 : -1;
};

/**
 * @name fetchArticle
 * @param {object} config
 * @param {object} stock
 * @param {string} path - url to the article
 * First getArticleURL is called to build the complete url to the article (in some cases
 * its used relative paths to the articles)
 * Then the url is validated (some of websites have articles that are only videos and that can be identified by url)
 * If url is valid then a request is made, with the response we get the text of the article
 * Then the sentiment value is extracted and `store` is called
 */
const fetchArticle = (config, stock, path) => {
    const url = config.getArticleURL(config.baseUrl, path);

    if (!config.isURLValid(url)) {
        return;
    }

    request(url, (err, response, html) => {
        if (err) {
            winston.error('news/index.js#fetchArticle(): ', err);
            return;
        }

        const $ = cheerio.load(html);
        const text = config.getText($, url);

        const value = getSentiment(text.join(' '));
        store(stock.symbol, url, text[0], text[1], value);
    });
};

/**
 * @name processHTML
 * @param {Moment} now
 * @param {object} config
 * @param {object} stock
 * @param {string} html
 * Builds a cheerio object from the html
 * Calls getList from the configuration, iterates each element from the list
 * if the date of that item is valid (matchs the now param)
 * then the url to the article is passed down to `fetchArticle`
 */
const processHTML = (now, config, stock, html) => {
    const $ = cheerio.load(html);

    config.getList($).each((index, row) => {
        let isDateValid = true;

        if (config.selectors.date) {
            isDateValid = config.isDateValid(now, $(row).find(config.selectors.date).text());
        }

        if (!isDateValid) {
            return;
        }

        const href = $(row).find(config.selectors.href).prop('href');
        fetchArticle(config, stock, href);
    });
};

/**
 * @name fetch
 * @param {object} config
 * @param {object} stock
 * Builds url to fech news, makes the request and calls processHTML
 */
const fetch = (config, stock) => {
    const now = moment();
    const url = config.getQueryURL(config.baseUrl, stock, now);

    return new Promise((resolve, reject) => {
        request(url, (err, response, html) => {
            if (err) {
                winston.error('news/index.js#fetch(): ', err);
                return reject(err);
            }

            resolve(processHTML(now, config, stock, html));
        });
    });
};

/**
 * @name execute
 * Gets all subscribed stocks, iterates all of the news engines configured and calls fetch for each stock
 */
module.exports = (isWorker) => {
    winston.info(`####### Execute News at ${moment().format('L HH:mm')} #############`);
    Stock.find().exec().then((stocks) => {
        const promises = [];
        stocks.forEach((stock) => {
            config.forEach((item) => promises.push(fetch(item, stock)));
        });

        Promise.all(promises)
            .then(() => {
                if (isWorker) {
                    process.exit(0);
                }
            });
    });
};
