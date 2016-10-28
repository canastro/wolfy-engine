'use strict';

const winston = require('winston');
const nodemailer = require('nodemailer');
const Subscriber = require('wolfy-models/src/schema/subscriber');

/**
 * @name buildURL
 * @param {string} username
 * @param {string} password
 * @returns {string}
 * Builds the url for the smtp transport
 */
function buildURL(username, password) {
    return `smtps://${username}@gmail.com:${password}@smtp.gmail.com`;
}

/**
 * @name send
 * @param {string} subject
 * @param {string} html
 * @returns {Promise}
 * Sends a email to a list of subscribed users
 */
exports.send = function send(subject, html) {
    const url = buildURL(process.env.MAIL_USERNAME, process.env.MAIL_PASSWORD);
    const smtpTransport = nodemailer.createTransport(url);

    return Subscriber.find().exec().then((subscribers) => {
        if (!subscribers || !subscribers.length) {
            return;
        }

        const mail = {
            to: subscribers.join(', '),
            subject,
            html
        };

        return smtpTransport.sendMail(mail, (error) => {
            if (error) {
                winston.error('app/utils/email.js#send(): ', error);
                return;
            }

            smtpTransport.close();
        });
    });
};
