'use strict';

module.exports = {
    baseUrl: 'http://www.bloomberg.com',
    getQueryURL: (baseUrl, stock) => `${baseUrl}/quote/${stock.symbol}:US`,
    getArticleURL: (baseUrl, path) => path,
    selectors: {
        date: '.news__story__published-at',
        href: 'a'
    },
    getText: ($) => `
        ${$('.lede-headline__highlighted').text()}
        ${$('.article-body').text()}
    `,
    getList: ($) => $('.news__state.active > .news__story'),
    isDateValid: (now, date) => {
        date = date.replace(/[^A-Z0-9\/]/ig, '');
        return date === now.format('M/DD/YYYY');
    },
    isURLValid: (url) => url.includes('/news/articles')
};
