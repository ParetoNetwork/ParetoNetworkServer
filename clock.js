
var clock = module.exports = {};
clock.time = 0;
clock.snapshot = true;
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
     * This is a scheduled task that approximate score every minute.
     */

    setTimeout(function run() {
        try{
            const time = (new Date().getTime());
            const minutes = clock.snapshot? 1440: ((clock.time === 0)? 5: 1);
            const job = queue
                .create('clock-job',{minutes} )
                .removeOnComplete(true)
                .save((error) => {
                    if (error) {
                        next(error);
                        return;
                    }
                    job.on('complete', result => {
                        if(result==='snapshot'){
                            clock.snapshot = false
                        }
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
        }

    }, 60000);

    cron.schedule('0 0 0 * * *', () => {
        clock.snapshot = true
    });
}




