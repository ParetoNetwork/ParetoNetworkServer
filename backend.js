
'use strict';

const throng = require('throng');

const WORKERS = process.env.WEB_CONCURRENCY || 1;


throng({
    workers: WORKERS,
    lifetime: Infinity
}, start);

function start() {

    const app =  require('./app.js').app;
    const server = app.listen(process.env.PORT || 3000, function () {
        app.initializeWebSocket(server);
        app.initializeLibSignalSocket({port: 8082});
        console.log('Pareto Network ranking app listening on port 3000!');
    });

    if(process.env.LOCAL_ENVIRONMENT){
        const worker = require('./worker-controller.js');
    }

}


