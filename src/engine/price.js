'use strict';

const winston = require('winston');
const moment = require('moment-timezone');
const request = require('request');
const { Candle, Price, Stock } = require('wolfy-models');
const zmq = require('zmq');

const lastPeriod = require('../utils/date').lastPeriod;
const ZMQ_PORT = process.env.ZMQ_PORT || 9998;

const socket = zmq.socket('pub');
socket.connect(`tcp://127.0.0.1:${ZMQ_PORT}`);

/**
 * @name transformPrice
 * @param {string} symbol
 * @param {object} item
 * Given a price object from the API its converted to match our schema
 */
const transformPrice = (symbol, item) => {
    const date = `${item.Date || item.EndDate}T${item.Time || item.EndTime}`;
    const price = new Price();
    price.symbol = symbol;
    price.date = moment.tz(date, 'M/D/YYYYTh:mm:ss A', 'America/New_York').toDate();
    price.last = item.Last || item.Close;
    price.open = item.Open;
    price.high = item.High;
    price.low = item.Low;
    price.volume = item.Volume;
    price.candle_color = Candle.getCandleColor(price);
    price.candle_type = Candle.getCandleType(price);

    return price;
};

/**
 * @name processResponse
 * @param {string} symbol
 * @param {array} response
 * It receives the response from the stock price API
 * It calculates the last period we need to fetch the result and finds it in the response
 * Finally the Price is stored in the DB
 */
const processResponse = (symbol, type, response) => {
    if (!response) {
        return;
    }

    response = JSON.parse(response);

    if (!response.length) {
        return;
    }

    if (type === 'HISTORICAL') {
        return Promise.all(response.map((item) => {
            const price = transformPrice(symbol, item);
            return price.save();
        }));
    }

    const now = moment().tz('America/New_York');
    const period = lastPeriod(5, now);

    winston.info(`engine/price.js#processResponse(): Looking for price for ${period}`);
    const found = response.find((item) => {
        let date = `${item.Date || item.EndDate}T${item.Time || item.EndTime}`;
        date = moment.tz(date, 'M/D/YYYYTh:mm:ss A', 'America/New_York');
        return date.diff(period, 'minutes') === 0;
    });

    //Return if date not found, or if found still has no price
    if (!found || !found.Open) {
        return;
    }

    const price = transformPrice(symbol, found);
    return price.save().then(() => {
        winston.info('ADD_PRICE:: ', JSON.stringify(price));
        socket.send(['ADD_PRICE', symbol, JSON.stringify(price)]);
    });
};

/**
 * @name fetchStockPrice
 * @param {String} symbol
 * @param {String} type
 * @param {Object} query
 * @returns {Promise} this promise is rejected if can't fetch prices from the API
 */
const fetchStockPrice = (symbol, type, query) => {
    const precision = 'minutes';
    const period = query.interval;
    const days = query.days;
    let BASE_URL;

    if (type === 'HISTORICAL') {
        BASE_URL = process.env.HISTORICAL_PRICING_BASE_URL;
    } else {
        BASE_URL = process.env.DAILY_PRICING_BASE_URL;
    }

    const url = `${BASE_URL}?period=${period}&precision=${precision}&days=${days}&symbol=${symbol}`;
    winston.info('engine/price.js#fetch(): ', url);

    return new Promise((resolve, reject)=> {
        request(url, (err, response, data) => {
            if (err) {
                winston.error('engine/price.js#fetch(): ', err);
                return reject(err);
            }

            return processResponse(symbol, type, data);
        });
    });
};

/**
 * @name fetchForex
 * @param {string} symbol
 * @returns {Promise}
 */
const fetchForex = (symbol) => {
    console.log(symbol);

    return new Promise((resolve) => resolve());
};

/**
 * @name fetch
 * @param {object} stock
 * @param {string} type
 * @param {object} query
 * @returns {Promise}
 * Builds url, makes the request to the API and calls processResponse to process all the results for a given symbol
 */
const fetch = (stock, type, query) => {
    if (stock.type === 'FOREX') {
        return fetchForex(stock.symbol);
    }

    return fetchStockPrice(stock.symbol, type, query);
};

/**
 * @name isValidToFetch
 * @param {string} type
 * @param {object} stock
 * @returns {boolean}
 * A stock is valid to fetch when the fetch type is HISTORICAL
 * or if its a week day. Only if the stock type is FOREX it will be
 * available to fetch on weekends
 */
const isValidToFetch = (type, stock) => {
    if (type === 'HISTORICAL') {
        return true;
    }

    const today = moment().isoWeekday();
    const isWeekend = today === 6 || today === 7;
    return (isWeekend && stock.type === 'FOREX') || !isWeekend;
};

module.exports = (isWorker, config) => {
    winston.info(`####### Execute Price at ${moment().format('L HH:mm')}#############`);

    return Stock.find().exec()
        .then((stocks) => {
            return Promise.all(
                stocks.filter((stock) => isValidToFetch(config.type, stock))
                    .map((stock) => fetch(stock, config.type, config.query))
            );
        })
        .then(() => {
            if (isWorker) {
                process.exit(0);
            }
        });
};
