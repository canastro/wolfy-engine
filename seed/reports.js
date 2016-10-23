'use strict';

const moment = require('moment');
const winston = require('winston');
const ReportsEngine = require('../src/engine/reports');

module.exports = function (days) {
    winston.info('Seed Reports');

    const promises = [];
    let date = moment().subtract(days, 'days');
    date = date.startOf('day');

    while (moment().diff(date, 'hours') !== 0) {
        promises.push(ReportsEngine(false, 'HOURLY', moment(date)));
        date = date.add(1, 'hour');
    }

    return Promise.all(promises);
};
