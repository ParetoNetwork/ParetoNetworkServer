
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
            const minutes =   ((clock.time === 0)? 5: 1);
            const job = queue
                .create('clock-job',{minutes} )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        console.log('Sucessfully updated aprox' );

                        clock.time=(clock.time === 4)? 0: clock.time+1;
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                    job.on('failed', () => {
                        console.log('Failed')
                        setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
                    });
                });



        }catch (e) {
            console.log(e);
            setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));
        }

    }, 60000);

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
                    job.on('failed', () => {
                        console.log('fail weekly snap' );
                    });
                });



        }catch (e) {
            console.log(e);
        }
    });
}




