'use strict';

const winston = require('winston');
const Stock = require('../src/schema/stock');

const data = [{
    symbol: 'AAPL',
    name: 'Apple'
}, {
    symbol: 'TSLA',
    name: 'Tesla'
}];
// , {
//     symbol: 'FB',
//     name: 'Facebook'
// }, {
//     symbol: 'COST',
//     name: 'Costco Wholesale Corporation'
// }, {
//     symbol: 'LNKD',
//     name: 'LinkedIn'
// }, {
//     symbol: 'BIDU',
//     name: 'Baidu, Inc.'
// }, {
//     symbol: 'SBUX',
//     name: 'Starbucks Corporation'
// }, {
//     symbol: 'TWTR',
//     name: 'Twitter'
// }, {
//     symbol: 'SCTY',
//     name: 'SolarCity'
// }, {
//     symbol: 'NXPI',
//     name: 'NXP Semiconductors NV'
// }];

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
