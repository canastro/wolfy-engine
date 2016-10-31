const winston = require('winston');

const isEnvVarSet = key => {
    winston.info(`${key} ==> ${process.env[key]}`);
    return !!process.env[key];
};
//validate all necessary env vars are set:
const envVars = [
    'ZMQ_PORT',
    'HISTORICAL_PRICING_BASE_URL',
    'DAILY_PRICING_BASE_URL',
    'TWITTER_CONSUMER_KEY',
    'TWITTER_CONSUMER_SECRET',
    'DB_NAME',
    'MAIL_USERNAME',
    'MAIL_PASSWORD'
];

module.exports = () => {
    let isValid = true;
    envVars.forEach(envVar => {
        const isSet = isEnvVarSet(envVar);

        if (!isSet) {
            winston.error(`Env var: ${envVar} is not set`)
            isValid = false;
        }
    });

    return isValid;
};
