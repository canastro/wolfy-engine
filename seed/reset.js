'use strict';

const winston = require('winston');

const Article = require('wolfy-models/src/schema/article');
const Price = require('wolfy-models/src/schema/price');
const Job = require('wolfy-models/src/schema/job');
const Rating = require('wolfy-models/src/schema/rating');
const Order = require('wolfy-models/src/schema/order');
const SentimentReport = require('wolfy-models/src/schema/sentiment-report');
const Stock = require('wolfy-models/src/schema/stock');
const Subscriber = require('wolfy-models/src/schema/subscriber');
const Tweet = require('wolfy-models/src/schema/tweet');

module.exports =  function resetDatabase() {
    winston.info('resetDatabase');

    const promises = [];
    promises.push(Article.remove().exec());
    promises.push(Price.remove().exec());
    promises.push(Rating.remove().exec());
    promises.push(SentimentReport.remove().exec());
    promises.push(Stock.remove().exec());
    promises.push(Subscriber.remove().exec());
    promises.push(Tweet.remove().exec());
    promises.push(Job.remove().exec());
    promises.push(Order.remove().exec());

    return Promise.all(promises);
};
