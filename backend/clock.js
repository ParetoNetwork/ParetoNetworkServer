const ErrorHandler = require('./utils/error-handler.js');

console.log(new Date());
var clock = module.exports = {};
clock.time = 0;
clock.start= function(wqueue){
    const cron = require("node-cron");
    const kue  = require ('kue');
    let queue = wqueue;
    if(!queue){
        const  REDIS_URL = process.env.REDIS_URL  || constants.REDIS_URL;
        queue = kue.createQueue({
            redis: REDIS_URL,
        });
    }

    kue.Job.rangeByState( 'active', 0, 100, 'asc', function( err, jobs ) {
        console.log('actives jobs');
        jobs.forEach( function( job ) {
            job.remove( function(){
                console.log( 'removed ', job.id );
            });
        });
    });
    kue.Job.rangeByState( 'inactive', 0, 100, 'asc', function( err, jobs ) {
        console.log('inactives jobs');
        jobs.forEach( function( job ) {
            job.remove( function(){
                console.log( 'removed ', job.id );
            });
        });
    });
    /**
     * This is a scheduled task that approximate score every minute.
     */

    setTimeout(function run() {
        try{
            const time = (new Date().getTime());
            const minutes =   1;
            const job = queue
                .create('clock-job-aprox',{minutes} )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully updated aprox' );
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                    job.on('failed', (e) => {
                        const error = ErrorHandler.backendErrorList('b10');
                        error.systemMessage = e.message? e.message: e;
                        console.log(JSON.stringify(error));
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                });



        }catch (e) {
            const error = ErrorHandler.backendErrorList('b10');
            error.systemMessage = e.message? e.message: e;
            console.log(JSON.stringify(error));
            setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
        }

    }, 60000);


    cron.schedule('*/5 * * * *', () => {
        try{
            console.log(new Date());
            const job = queue
                .create('clock-job-score',{} )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully Score' );
                        console.log(new Date());
                    });
                    job.on('failed', err => {
                        const error = ErrorHandler.backendErrorList('b11');
                        error.systemMessage = err.message? err.message: err;
                        console.log(JSON.stringify(error));
                    });
                });



        }catch (e) {
            const error = ErrorHandler.backendErrorList('b11');
            error.systemMessage = e.message? e.message: e;
            console.log(JSON.stringify(error));
        }
    });

    cron.schedule('0 0 0 * * 7', () => {
        try{

            const job = queue
                .create('clock-job-snapshot',{} )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully weekly snap' );
                    });
                    job.on('failed', (e) => {
                        const error = ErrorHandler.backendErrorList('b12');
                        error.systemMessage = e.message? e.message: e;
                        console.log(JSON.stringify(error));
                    });
                });



        }catch (e) {
            const error = ErrorHandler.backendErrorList('b12');
            error.systemMessage = e.message? e.message: e;
            console.log(JSON.stringify(error));
        }
    });
}




