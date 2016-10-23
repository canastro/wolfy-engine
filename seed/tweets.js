'use strict';

const winston = require('winston');
const moment = require('moment');

const TwitterEngine = require('../src/engine/twitter');

module.exports = function (days) {
    winston.info('Seed Reports');

    const promises = [];
    let date = moment().subtract(days, 'days');
    date = date.startOf('day');

    while (moment().diff(date, 'days') !== 0) {
        const since = moment(date).toDate();
        const until = moment(date).endOf('day').toDate();

        promises.push(TwitterEngine(false, since, until));
        date = date.add(1, 'day');
    }

    return Promise.all(promises);
};
