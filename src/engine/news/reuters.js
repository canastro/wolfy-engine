'use strict';

module.exports = {
    baseUrl: 'http://www.reuters.com',
    getQueryURL: (baseUrl, stock, now) => `${baseUrl}/finance/stocks/companyArticle?symbol=${stock.symbol}&date=${now}`,
    getArticleURL: (baseUrl, path) => `${baseUrl}${path}`,
    selectors: {
        href: 'a'
    },
    getText: ($) => [
        $('.article-headline').text(),
        $('#articleText').text()
    ],
    getList: ($) => $('.feature'),
    isURLValid: () => true
};
