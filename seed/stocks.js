'use strict';

const winston = require('winston');
const Stock = require('wolfy-models/src/schema/stock');

const data = [{
    symbol: 'AAPL',
    name: 'Apple'
}, {
    symbol: 'TSLA',
    name: 'Tesla'
}];

module.exports = function seedStocks() {
    winston.info('createStocks');

    const promises = data.map((item) => {
        const stock = new Stock();
        stock.symbol = item.symbol;
        stock.name = item.name;
        return stock.save();
    });

    return Promise.all(promises);
};
