"use strict";

const throng = require('throng');

const WORKERS = process.env.WORKER_CONCURRENCY || 1;

throng({
  workers: WORKERS,
  lifetime: Infinity
}, start);

function start() {
    const worker = require('./worker-controller.js');
    const clock = require('./clock.js');
}