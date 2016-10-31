'use strict';

const winston = require('winston');
const cluster = require('cluster');
const winstonDailyRotateFile = require('winston-daily-rotate-file');

const Job = require('wolfy-models/src/schema/job');
const Engine = require('./engine');
const boot = require('./boot');
const engineWorker = require('./engine/worker');
const isEnvValid = require('./utils/env');

const DB_NAME = process.env.DB_NAME || 'wolfy';

const numCPUs = require('os').cpus().length;
let workersCount = 0;

boot(`mongodb://localhost/${DB_NAME}`, {
    env: 'development'
});

if (!isEnvValid()) {
    throw 'Environment is Invalid!';
}

/**
 * @name onWorkerExit
 * @param {string} engine
 * @param {number} code
 * @param {string} signal
 * It logs the reason of the exit of a worker and updates the value of workersCount
 */
const onWorkerExit = (engine, code, signal) => {
    workersCount--;

    if (signal) {
        return winston.info(`worker ${engine} was killed by signal: ${signal}`);
    }

    if (code !== 0) {
        return winston.error(`worker ${engine} exited with error code: ${code}`);
    }

    winston.info(`worker ${engine} success!`);
};

/**
 * @name storeJobExecution
 * @param {string} engine
 * @param {object} params
 * Stores the job info in the DB
 */
const storeJobExecution = (engine, params) => {
    const job = new Job();
    job.engine = engine;
    job.params = JSON.stringify(params);
    job.save();
};

/**
 * @name onEngineStart
 * @param {string} engine
 * @param {object} config
 * If config is valid it calls a engine
 * The engine will be called as worker if the number of workers is lower then the number of cpus
 * other wise it will be called directly in the master process
 */
const onEngineStart = (engine, config) => {
    if (config.isValid && !config.isValid()) {
        return;
    }

    storeJobExecution(engine, config.params);

    const data = {
        engine,
        params: config.params
    };

    if (workersCount === numCPUs) {
        winston.info(`start ${engine} in master process`);
        return engineWorker(false, data);
    }

    winston.info(`start ${engine} as a worker`);
    const worker = cluster.fork();
    workersCount++;

    worker.send(data);
    worker.on('exit', (code, signal) => onWorkerExit(engine, code, signal));
};

const execute = () => {
    winston.add(winstonDailyRotateFile, {
        filename: 'log',
        levels: {
            trace: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4
        }
    });

    if (cluster.isMaster) {
        Engine.start(onEngineStart);
    } else {
        process.on('message', (data) => engineWorker(true, data));
    }
};

execute();
