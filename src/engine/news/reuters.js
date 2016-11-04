'use strict';

module.exports = {
    baseUrl: 'http://www.reuters.com',
    // getQueryURL: (baseUrl, stock, now) => `${baseUrl}/finance/stocks/companyNews?symbol=${stock.symbol}.O&date=${now.format('MMDDYYYY')}`,
    getQueryURL: (baseUrl, stock, now) => `${baseUrl}/finance/stocks/companyNews?symbol=${stock.symbol}.O&date=10312016`,
    getArticleURL: (baseUrl, path) => `${baseUrl}${path}`,
    selectors: {
        href: 'a'
    },
    getText: ($) => [
        $('.article-headline').text(),
        $('#article-text').text()
    ],
    getList: ($) => $('.feature'),
    isURLValid: () => true
};
