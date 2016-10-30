'use strict';

module.exports = {
    baseUrl: 'http://quotes.wsj.com',
    getQueryURL: (baseUrl, stock) => `${baseUrl}/${stock.symbol}`,
    getArticleURL: (baseUrl, path) => path,
    selectors: {
        href: 'a',
        date: '.cr_dateStamp'
    },
    getText: ($, url) => {
        if (url.includes('marketwatch')) {
            return [
                $('#article-headline').text(),
                $('#article-body').text()
            ];
        }

        if (url.includes('blogs.wsj.com')) {
            return [
                $('.wsj-article-headline').text(),
                $('.article-wrap').text()
            ];
        }

        return [
            $('.wsj-article-headline').text(),
            $('.wsj-snippet-body').text()
        ];
    },
    getList: ($) => $('#newsSummary_c > li'),
    isDateValid: (now, text) => {
        const date = text.replace(/[^A-Z0-9\/]/ig, '');
        return date === now.format('MM/DD/YY');
    },
    isURLValid: () => true
};
