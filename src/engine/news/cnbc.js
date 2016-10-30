'use strict';

const moment = require('moment');

module.exports = {
    baseUrl: 'http://data.cnbc.com',
    getQueryURL: (baseUrl, stock) => `${baseUrl}/quotes/${stock.symbol}`,
    getArticleURL: (baseUrl, path) => path,
    selectors: {
        date: '.note',
        href: 'a'
    },
    getText: ($) => [
        $('.story-header-left > .title').text(),
        $('#article_body group').text(),
    ],
    getList: ($) => $('.subsection').eq(1).find('li'),
    isDateValid: (now, text) => {
        const dateArray = text.split(' ').slice(0, 3);
        let date;

        if (dateArray[1] === 'hrs') {
            const hours = dateArray[0];
            const currentHours = moment().hours();

            if (hours > currentHours) {
                date = moment().subtract(1, 'days');
            } else {
                date = moment();
            }
        } else {
            date = moment(dateArray.join('/'), 'DD/MMM/YYYY');
        }

        return date.diff(now, 'days') !== 0;
    },
    isURLValid: (url) => url.includes('www.cnbc.com')
};
