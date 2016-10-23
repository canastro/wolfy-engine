'use strict';

/**
 * @name lastPeriod
 * @param {number} period
 * @param {Moment} now - date now in the America/New_York timezone
 * Given the desired period and the current time (this is passed by parameter because I might want to query older data)
 * It calculates the last date that matches the desired period
 */
exports.lastPeriod = (period, now) => {
    const currentMinute = now.minutes();

    if (currentMinute === 0 || currentMinute % period === 0) {
        return now;
    }

    const remainder = ((period - currentMinute) % period);
    return now.add(remainder, 'minutes').startOf('minute');
};
