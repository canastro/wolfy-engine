'use strict';

const winston = require('winston');
const zmq = require('zmq');

module.exports = function () {
    return new Promise((resolve) => {

        const socket = zmq.socket('pub');
        socket.identity = 'publisher seedprice';

        winston.info('connect to tcp://*:9998');
        socket.bindSync('tcp://*:9998');

        const prices = {
            past: {
                date: '7/7/2016',
                high: 96.01,
                last: 95.94,
                low: 95.75,
                open: 95.8,
                time: '3:30:00 pm',
                volume: 189410
            },
            current: {
                date: '7/8/2016',
                high: 96.89,
                last: 96.73,
                low: 96.06,
                open: 96.47,
                time: '9:30:00 am',
                volume: 457711
            }
        };

        winston.info('send complex message');
        socket.send(['ADD_PRICE', 'AAPL', JSON.stringify(prices)]);
        resolve();
    });
};
