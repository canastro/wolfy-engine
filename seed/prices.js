'use strict';

const winston = require('winston');
const PriceEngine = require('../src/engine/price');

module.exports = function (interval, days) {
    winston.info('Seed Prices');

    return PriceEngine(false, {
        type: 'HISTORICAL',
        query: {
            interval,
            days
        }
    });
};
