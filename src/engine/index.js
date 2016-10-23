'use strict';

const winston = require('winston');
const schedule = require('node-schedule');

const ENGINE_CONFIG = {
    //Run twitter engine every hour => '0 * * * *'
    TWITTER: {
        cronTime: '58 * * * *'
    },
    //Run price engine every 5 minutes => '1,6,11,16,21,26,31,36,41,46,51,56 * * * *'
    PRICE: {
        cronTime: '4,9,14,19,24,29,34,39,44,49,54,59 * * * *',
        // isValid: () => {
        //     const today = moment().isoWeekday();
        //     return today !== 6 && today !== 7;
        // },
        params: [{
            type: 'LAST_PERIOD',
            query: {
                interval: 5,
                days: 1
            }
        }]
    },
    //Run ratings engine every day at 13h00 => '0 13 * * *'
    RATINGS: {
        cronTime: '0 13 * * *'
    },
    //Run news engine every day at 23h50
    NEWS: {
        cronTime: '50 23 * * *'
    },
    // Run reports engine every hour
    REPORTS: [{
        cronTime: '59 * * * *',
        params: ['HOURLY']
    }, {
        cronTime: '59 23 * * *',
        params: ['DAILY']
    }]
};

const register = (cb, engine, config) => {
    winston.info('Register ', engine, ' with ', config.cronTime);
    schedule.scheduleJob(config.cronTime, () => cb(engine, config));
};

exports.start = function (cb) {
    Object.keys(ENGINE_CONFIG).forEach((key) => {
        const engine = ENGINE_CONFIG[key];

        if (Array.isArray(engine)) {
            return engine.forEach((item) => register(cb, key, item));
        }

        register(cb, key, engine);
    });
};
