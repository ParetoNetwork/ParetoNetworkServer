"use strict";

const throng = require('throng');

const WORKERS = process.env.WEB_CONCURRENCY || 1;

throng({
  workers: WORKERS,
  lifetime: Infinity
}, start);

function start() {
    const worker = require('./worker-controller.js');
}