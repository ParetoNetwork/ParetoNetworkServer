'use strict';
//
// const throng = require('throng');
//
// const WORKERS = process.env.WEB_CONCURRENCY || 1;
//
//
// throng({
//     workers: WORKERS,
//     lifetime: Infinity
// }, start);
//
// function start() {

    require('./app.js').app.listen(process.env.PORT || 3000, function () {
        console.log('Pareto Network ranking app listening on port 3000!');
    });
// }