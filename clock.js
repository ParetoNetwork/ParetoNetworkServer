
var clock = module.exports = {};

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


    /**
     * This is a scheduled task that will update the calculation for the score every ten minutes. Also update CreateEventIntel
     */

    cron.schedule("*/5 * * * *", function() {
        try{
            const job = queue
                .create('clock-job-5' )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully updated' )
                    });
                    job.on('failed', () => {
                        console.log('Failed')
                    });
                });

        }catch (e) {
            console.log(e);
        }

    });

    /**
     * This is a scheduled task that approximate score every minute.
     */

    setTimeout(function run() {
        try{
            const time = (new Date().getTime());
            const job = queue
                .create('clock-job-1' )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully updated aprox' )
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                    job.on('failed', () => {
                        console.log('Failed')
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                });

        }catch (e) {
            console.log(e);
        }

    }, 60000);
}




