'use strict';

module.exports = {
    baseUrl: 'http://seekingalpha.com',
    getQueryURL: (baseUrl, stock) => `${baseUrl}/symbol/${stock.symbol}`,
    getArticleURL: (baseUrl, path) => `${baseUrl}${path}`,
    selectors: {
        href: '.symbol_article > a',
        date: '.date_on_by'
    },
    getText: ($) => [$('.mc_article_body .bullets_li').text()],
    getList: ($) => $('.symbol_latest_articles li'),
    isDateValid: (now, text) => {
        return text.toUpperCase().includes('TODAY');
    },
    isURLValid: () => true
};
