'use strict';

const ALLOWED_HOSTS = [{
    host: 'ophirgottlieb.tumblr.com',
    title: '.post-bd > h2',
    body: '.post-bd > .body-text'
}, {
    host: 'fool.com',
    title: '.article-header',
    body: '.article-content'
}, {
    host: 'thestreet.com',
    title: '.article__headline',
    body: '.article__body'
}, {
    host: 'finance.yahoo.com',
    title: '.headline',
    body: '.body'
}, {
    host: 'investopedia.com',
    title: '.layout-title > h1',
    body: '.layout-content'
}, {
    host: '247wallst.com',
    title: '.entry-title',
    body: '.entry-content'
}, {
    host: 'siliconbeat.com',
    title: '.title',
    body: '.post-content'
}];

function getHost(url) {
    return ALLOWED_HOSTS.find((item) => url.includes(item.host));
}

module.exports = {
    baseUrl: 'http://finance.yahoo.com',
    getQueryURL: (baseUrl, stock) => `${baseUrl}/q?s=${stock.symbol}`,
    getArticleURL: (baseUrl, path) => path,
    selectors: {
        href: 'a',
        date: 'cite > span'
    },
    getText: ($, url) => {
        const host = getHost(url);

        return [
            $(host.title).text(),
            $(host.body).text()
        ];
    },
    getList: ($) => $('#yfi_headlines .bd li'),
    isDateValid: (now, text) => {
        const date = text.toUpperCase();
        return date.includes(now.format('ddd').toUpperCase());
    },
    isURLValid: (url) => !!getHost(url)
};
