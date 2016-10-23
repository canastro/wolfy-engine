'use strict';

const winston = require('winston');
const moment = require('moment');
const { Tweet, Stock, Article, SentimentReport } = require('wolfy-models');

/**
 * @name buildQuery
 * @param {Date} now
 * @param {String} symbol
 * @param {String} type
 * @returns {object}
 * It creates a query for a symbol in a date range
 */
const buildQuery = (now, symbol, type) => {
    const period = type === 'HOURLY' ? 'hour' : 'day';
    const fromDate = moment(now).startOf(period).toDate();
    const toDate = moment(now).endOf(period).toDate();

    return {
        symbol,
        date: { '$gte': fromDate.toISOString(), '$lt': toDate.toISOString() }
    };
};

/**
 * @name process
 * @param {Date} now
 * @param {String} type - HOURLY / DAILY
 * @param {String} symbol
 * @param {Array<Article>} articles
 * @param {Array<Tweet>} tweets
 * Given a array of tweets and articles the volume and sentiment is calculated
 * and the sentiment report is updated
 */
const processReports = (now, type, symbol, articles = [], tweets = []) => {
    winston.info(`app/engine/reports#process(): reporting for ${symbol} with ${articles.length} articles and ${tweets.length} tweets`);

    const report = new SentimentReport();
    report.symbol = symbol;
    report.type = type;
    report.date = moment(now).startOf('hour');

    tweets.forEach((tweet) => {
        report.tweet_absolute_sentiment += tweet.absolute_sentiment || 0;
        report.tweet_relative_sentiment += tweet.relative_sentiment || 0;
    });
    articles.forEach((article) => report.articles_sentiment += article.sentiment);

    report.articles_volume += articles.length;
    report.tweet_volume += tweets.length;

    return report.save((err) => {
        if (err) {
            winston.error(err);
        }
    });
};

/**
 * @name getTweets
 * @param {Date} now
 * @param {Stock} stock
 * @param {String} type
 * @returns {Promise}
 * Queries the DB for all the tweets in the last hour
 */
const getTweets = (now, stock, type) => {
    const query = buildQuery(now, stock.symbol, type);
    return Tweet
        .find(query)
        .exec();
};

/**
 * @name getArticles
 * @param {Date} now
 * @param {Stock} stock
 * @param {String} type
 * @returns {Promise}
 * Queries the DB for all the articles in the last hour
 */
const getArticles = (now, stock, type) => {
    const query = buildQuery(now, stock.symbol, type);
    return Article
        .find(query)
        .exec();
};

/**
 * @name execute
 * Gets all subscribed stocks and calls `getSentimentReport`, `getArticles` and `getTweets`
 * and then calls `process` for each of the stocks
 */
module.exports = (isWorker, type, now = moment.utc()) => {
    winston.info(`####### Execute reports at ${moment().format('L HH:mm')}#############`);

    return Stock.find().exec().then((stocks) => {
        return Promise.all(stocks.map((stock) => {
            return Promise.all([
                getArticles(now, stock, type),
                getTweets(now, stock, type)
            ])
            .then((response) => processReports(now, type, stock.symbol, ...response));
        })).then(() => {
            if (isWorker) {
                process.exit(0);
            }
        });
    });
};
