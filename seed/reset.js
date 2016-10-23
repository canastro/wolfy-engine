'use strict';

const winston = require('winston');
const Article = require('../src/schema/article');
const Price = require('../src/schema/price');
const Job = require('../src/schema/job');
const Rating = require('../src/schema/rating');
const Order = require('../src/schema/order');
const SentimentReport = require('../src/schema/sentiment-report');
const Stock = require('../src/schema/stock');
const Subscriber = require('../src/schema/subscriber');
const Tweet = require('../src/schema/tweet');

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
