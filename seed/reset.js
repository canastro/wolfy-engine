'use strict';

const winston = require('winston');
const {
    Article,
    Price,
    Job,
    Rating,
    Order,
    SentimentReport,
    Stock,
    Subscriber,
    Tweet
} = require('wolfy-models');

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
