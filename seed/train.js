'use strict';

const winston = require('winston');
const Price = require('../src/schema/price');
const ArtificialNeuralNetwork = require('../src/neural-network/artificial-neural-network');

module.exports = function (symbol) {
    winston.info('Train');
    return Price.find({ symbol }).exec().then((prices) => {
        const artificialNeuralNetwork = new ArtificialNeuralNetwork(symbol);
        artificialNeuralNetwork.train(prices);

        const result = artificialNeuralNetwork.activate({
            volume: 4018,
            low: 205.53,
            high: 207.14,
            open: 206.9,
            last: 205.53
        }, {
            volume: 5018,
            low: 200,
            high: 205.53,
            open: 205.53,
            last: 200
        });

        winston.info(`it predicts that this stock ${result > 0.5 ? 'raise' : 'fall'}`);
    });
};
