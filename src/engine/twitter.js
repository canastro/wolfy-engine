'use strict';

const winston = require('winston');
const Twit = require('twit');
const moment = require('moment');
const sentiment = require('sentiment');
const { Tweet, Stock } = require('wolfy-models');

const dictionary = require('../constants/dictionary');

/**
 * @name updateStock
 * @param {Stock} stock
 * @param {number} lastTweetId
 * Updates the Stock in the DB
 */
const updateStock = (stock, lastTweetId) => {
    stock.last_tweet_id = lastTweetId;
    stock.save();
};

/**
 * @name processSentiment
 * @param {string} text
 * @param {object} status
 * It extracts a absolute and a relative sentiment from a tweet
 * The absolute sentiment is a direct result from the sentiment library
 * The relative sentiment takes in consideration the number of followers of the user and the number of
 * favorites of the tweet
 */
const processSentiment = (text, status) => {
    const value = sentiment(text, dictionary);
    const absolute = value.score;

    if (absolute === 0) {
        return {
            absolute,
            relative: 0
        };
    }

    const followers = status.user.followers_count;
    const favorites = status.favorite_count;

    // If has more then 1000 followers adds 1; the same if has more then 50 favorites
    let relative = 1;
    relative += followers > 1000 ? 1 : 0;
    relative += favorites > 50 ? 1 : 0;
    relative *= absolute > 0 ? 1 : -1;

    return {
        absolute,
        relative
    };
};

/**
 * @name processTweets
 * @param {Stock} stock
 * @param {SocialRecord} record
 * @param {array} statuses
 * Iterates all of the statuses extracting the sentiment and storing the tweet in the DB
 * Finnally it calls updateStock`
 */
const processTweets = (stock, statuses) => {
    statuses.forEach((status) => {
        const tweet = new Tweet();
        tweet.key = status.id_str;
        tweet.date = status.created_at;
        tweet.symbol = stock.symbol;
        tweet.text = status.text;
        tweet.screen_name = status.user.screen_name;
        tweet.followers_count = status.user.followers_count;

        const sentimentValue = processSentiment(status.text, status);
        tweet.absolute_sentiment = sentimentValue.absolute;
        tweet.relative_sentiment = sentimentValue.relative;

        tweet.save((err) => {
            if (err) {
                winston.error('engine/twitter.js#processTweets(): ', err);
            }
        });
    });

    updateStock(stock, statuses[0].id_str);
};

/**
 * @name buildQuery
 * @param {Stock} stock
 * @param {Date} since
 * @param {Date} until
 * @returns {string} twitter query string
 * Given a stock it builds a query for twitter API
 * This query includes the symbol, the language and the since_id or since date parameters
 */
const buildQuery = (stock, since, until) => {
    const base = {
        q: `$${stock.symbol}`,
        language: 'en',
        result_type: 'mixed',
        count: 100
    };

    if (stock.last_tweet_id) {
        return Object.assign(base, {
            since_id: stock.last_tweet_id
        });
    }

    if (until) {
        base.until = until.toISOString().slice(0, 10);
    }

    return Object.assign(base, {
        since: since.toISOString().slice(0, 10)
    });
};

/**
 * @name processStock
 * @param {Twit} T
 * @param {Stock} stock
 * @param {Date} since
 * @param {Date} until
 * Finds or create the SocialRecord for the current hour
 * Queries twitter for statuses of the given stock and then calls processTweets
 */
const processStock = (T, stock, since, until) => {
    const params = buildQuery(stock, since, until);

    return new Promise((resolve, reject) => {
        T.get('search/tweets', params, (err, data = {}) => {
            if (data.errors) {
                winston.error(data.errors);
                return reject();
            }

            if (!data.statuses || (data.statuses && !data.statuses.length)) {
                return resolve();
            }

            resolve(processTweets(stock, data.statuses));
        });
    });
};

/**
 * @name execute
 * Gets all subscribed stocks and calls processStock for each
 */
module.exports = function execute(isWorker, since = new Date(), until) {
    winston.info(`####### Execute Twitter at ${moment().format('L HH:mm')}#############`);
    const T = new Twit({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        app_only_auth: true
    });

    return Stock.find().exec().then((stocks) => {
        const promises = stocks.map((stock) => processStock(T, stock, since, until));
        return Promise.all(promises)
            .then(() => {
                if (isWorker) {
                    process.exit(0);
                }
            });
    });
};
