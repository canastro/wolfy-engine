'use strict';

const TwitterEngine = require('./twitter');
const PriceEngine = require('./price');
const RatingsEngine = require('./ratings');
const NewsEngine = require('./news');
const ReportsEngine = require('./reports');

const ENGINES = {
    'PRICE': PriceEngine,
    'TWITTER': TwitterEngine,
    'RATINGS': RatingsEngine,
    'NEWS': NewsEngine,
    'REPORTS': ReportsEngine
};

module.exports = (isWorker, { engine, params = []}) => ENGINES[engine](isWorker, ...params);
