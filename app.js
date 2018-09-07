"use strict";

var compression = require('compression');
var express = require('express');
const cors = require('cors');
const fs = require("fs");
const expressStaticGzip = require('express-static-gzip');
var path = require('path');
var boom = require('express-boom-2');
var requestp = require('request-promise');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const multer = require("multer");
var multerS3 = require('multer-s3');
const cron = require("node-cron");
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.S3_REGION || constants.S3_REGION,
    accessKeyId: process.env.ACCESS_KEY || constants.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY || constants.SECRET_KEY
});

const s3 = new AWS.S3();

var controller = require('./backend-controller.js');
require("./ContractEventListeners/Intel");


var app = express();
var compression = require('compression');

var uniqueRandomArray = require('unique-random-array');
const debug = require('debug')('pareto-ranking');
const appName = 'Pareto Ranking Backend';
debug('booting %s', appName);

let constants = {};
const constantsPath = path.resolve(__dirname,'backend-private-constants.json');

if (fs.existsSync(constantsPath)) {
  constants = require(constantsPath);
}
/*constants*/
var sessionDebug = process.env.DEBUG || constants.DEBUG;

var bodyParser = require('body-parser');

var upload = multer({
    storage: multerS3({
        s3: s3,
        acl: 'private',
        bucket: 'pareto-images',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname + '-' + Date.now() });
        },
        key: function (req, file, cb) {
            cb(null,'profile-images/' + file.fieldname + '-' + Date.now())
        }
    })
});

//the key/value pairs fixes the error PayloadTooLargeError: request entity too large
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(cookieParser());
app.use(compression());

    const corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true
    };
    app.use(cors(corsOptions));


app.use("/api-docs", express.static('api-docs'));
app.use('/', express.static('public'));

//handles only error codes in a consistent way and format, doesn't do anything for 2XX responses
app.use(boom());

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const ErrorHandler = require('./error-handler.js');

/*app.use(session({
  store: new MongoStore(mongooseConnection: module.exports.mongoose.connection)
}));*/

//web3Auth.attach(app, "Cryptographically sign this to prove ownership.");

/*app.get('/who', function (req, res) {
  console.log(req.cookies.token);
  console.log(req.user);
  if (req.user) {
    res.json({account: req.user.loggedInAs});
  }
  else {
    res.status(404);
  }
  res.end();
});*/



app.get('/profile-image', function (req, res) {
    0
    var params = {Bucket: 'pareto-images', Key: 'profile-images/' + req.query.image};
   // var url = s3.getSignedUrl('getObject', params);

    s3.getObject(params, function(err, data) {
        //res.writeHead(200, {'Content-Type': 'image/jpeg'});
        if(!err){
            res.write(data.Body, 'binary');
            res.end(null, 'binary');
        }else{
            res.sendFile(path.join(__dirname + '/default-avatar.png'));
        }

    });
});

app.get('/', function (req, res) {
    //__dirname : It will resolve to your project folder.
    res.sendFile(path.join(__dirname + '/public/splash.html')); //this will be dashboard
});

app.get('/about', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/about.html'));
});

app.get('/rank', function (req, res) {
    //__dirname : It will resolve to your project folder.
    res.sendFile(path.join(__dirname + '/public/rank.html'));
});

app.get('/dashboard', function (req, res) {
    //__dirname : It will resolve to your project folder.
    res.sendFile(path.join(__dirname + '/public/dashboard.html'));
});

app.get('/intel', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/intel.html'));
});




/********* UNAUTHENTICATED v1 APIs *********/

app.post('/v1/sign', function (req, res) {

    controller.sign(req.body, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            if (sessionDebug == 1) { //this allows you to create a cookie that works on localhost and without SSL, and can be accessed by javascript
                res.cookie('authorization', result.token, {httpOnly: true});
            } else {
                res.cookie('authorization', result.token, {
                    domain: 'pareto.network',
                    path: '/',
                    httpOnly: true,
                    secure: true
                }); //should set a debug flag for env variable
            }
            res.status(200).json(ErrorHandler.getSuccess({}))

        }
    });

});


app.get('/v1/rank', function (req, res) {

    var rank = parseInt(req.query.rank) || 1;
    var limit = parseInt(req.query.limit) || 100;
    var page = parseInt(req.query.page) || 0;

    //max limit
    if (limit > 500) {
        limit = 500;
    }

    controller.retrieveRanksAtAddress(rank, limit, page, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));

        }  else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});

app.get('/v1/balance', function (req, res) {

    controller.getBalance(req.query.address,0, function(err, count){
        if(!err){
            res.status(200).json(ErrorHandler.getSuccess(count));
        }else{
            res.status(200).json(ErrorHandler.getError(err));
        }
    });

});

//get info about your address
app.post('/v1/addresses', function (req, res) {
    controller.retrieveAddresses( req.body.addresses, function (err, results) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(results));
        }
    });

});


app.get("/getIntels", (req, res) => {
    controller.getAllIntel((err, response) => {
      if (err) {
        res.status(502).json({ message: "Could not get Intels" });
      } else {
        res.status(200).json({ message: "success", data: response });
      }
    });
  });
  
  app.get("/getIntel/:id", (req, res) => {
    const { id } = req.params;
    controller.getAnIntel(id, (err, response) => {
      if (err) {
        res.status(502).json({ message: "Could not get Intels" });
      } else {
        res.status(200).json({ message: "success", data: response });
      }
    });
  });
  
  app.get("/getIntelsByProvider/:address", (req ,res) => {
      const {address} = req.params;
      controller.getIntelsByProvider(address, (err, response) => {
          if (err) {
            res.status(502).json({ message: "Could not get Intels" });
          } else {
            res.status(200).json({ message: "success", data: response });
          }
        });
  })
  

/********* AUTHENTICATED v1 APIs *********/

app.use(function (req, res, next) {

    if (req.cookies === undefined || req.cookies.authorization === undefined) {

      res.status(200).json(ErrorHandler.tokenMissingError())

    } else {

        let authorization = req.cookies.authorization;
        if (authorization.includes('Bearer')) {
            authorization = authorization.replace('Bearer', '');
        }
        authorization = authorization.trim();

        jwt.verify(authorization, 'Pareto', function (err, decoded) {
            if (err) {
                res.status(200).json(ErrorHandler.jwtFailedError())
            } else {
                req.user = decoded.user;
                next();
            }
        });
    }

});

/*
* Auth, simple authenticated method to determine if user is properly authenticated. Necessary because client side js
* cannot read the cookie we store for security reasons.
*/
app.get('/v1/auth', function (req, res) {

    res.status(200).json(ErrorHandler.getSuccess({auth: req.user}));
});

app.get('/v1/splash-auth', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/dashboard.html'));
});

app.get('/v1/signws', function (req, res){
    res.status(200).json(ErrorHandler.getSuccess({token:  jwt.sign({user: req.user}, 'ParetoWs',  { expiresIn: "5y" })}));
});

/*
* Unsign - clears cookie session for the client side, which cannot access secure httpOnly cookies
*/
app.post('/v1/unsign', function (req, res) {
    controller.unsign(function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err))
        } else {
            if (sessionDebug == 1) {
                res.cookie('authorization', result.token, {httpOnly: true, maxAge: 1231006505});
            }
            else {
                res.cookie('authorization', result.token, {
                    domain: 'pareto.network',
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    maxAge: 1231006505
                }); //should set a debug flag for env variable
            }
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});


app.get('/v1/summation', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    //req.user is an address
    controller.calculateScore(req.user, 0, function (err, result) {
        if (err) {
            console.log(err.message);
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }

    });

});//end entire function

app.post('/v1/content', function (req, res) {


    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.status(200).json(ErrorHandler.bodyMissingError());
    }
    else if (req.user === undefined || req.body.title === undefined || req.body.body === undefined) {
        console.log(req.body);
        res.status(200).json(ErrorHandler.contentMissingError());
    } else {

        //needs to check address whitelist against the authorized address, if people figure out the post body format.

        controller.postContent(req, function (err, obj) {
            if (err) {
                res.status(200).json(ErrorHandler.getError(err));
            } else {
                res.status(200).json(ErrorHandler.getSuccess({status: 'success', content: obj}));
            }

        });
    }

}); //end content post


app.get('/v1/content', function (req, res) {

    //this needs a session id, basically an authenticated address

    var limit = parseInt(req.query.limit) || 15;
    var page = parseInt(req.query.page) || 0;

    //max limit
    if (limit > 50) {
        limit = 50;
    }

    req.query.limit = limit;
    req.query.page = page;

    controller.getAllAvailableContent(req, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});


app.get('/v1/content/me', function (req, res) {

    controller.getContentByCurrentUser(req, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });
});

//get info about another address
app.get('/v1/content/:content', function (req, res) {
    req.query.limit = 1000;
    req.query.page = 0;
    controller.getAllAvailableContent(req, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            let mycontent = {};
            for (let i = 0; i < result.length; i = i+1){
                if(result[i]._id.toString() === req.params.content){
                    mycontent = result[i];
                    break;
                }
            }
            res.status(200).json(ErrorHandler.getSuccess(mycontent));
        }
    });

});


app.get('/v1/ranking', function (req, res) {

    if (req.query.admin === undefined) { //endpoint protection from DDOS
        res.boom.unauthorized();
    }
    else {
        //controller.seedLatestEvents(null, res);
    }

});


//get info about your address
app.get('/v1/address', function (req, res) {

    controller.retrieveAddress(req.user, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});

//force update inforamtion
app.post('/v1/update', function (req, res) {


});

//get info about another address
app.get('/v1/address/:address', function (req, res) {

    controller.retrieveAddress(req.params.address, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});

//get info of himself
app.get('/v1/userinfo', function (req, res) {
    //Get Info User
     if (req.query.latest=='true'){
         controller.updateScore(req.user, function (err, success) {
             if (err) {
                 res.status(200).json(ErrorHandler.getError(err));
             } else {
                 controller.getUserInfo(req.user,  function (err, result) {
                     if (err) {
                         res.status(200).json(ErrorHandler.getError(err));
                     } else {
                         res.status(200).json(ErrorHandler.getSuccess(result));
                     }
                 });
             }
         });
     } else{
         controller.getUserInfo(req.user,  function (err, result) {
             if (err) {
                 res.status(200).json(ErrorHandler.getError(err));
             } else {
                 res.status(200).json(ErrorHandler.getSuccess(result));
             }
         });
     }

});

app.post('/upload-profile', upload.single('file'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any;
    controller.updateUser(req.user, {profile_pic: req.file.metadata.fieldName}, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});

//get info about another address
app.get('/v1/userinfo/:address', function (req, res) {
    controller.getUserInfo(req.params.address,  function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });

});

//update info user
app.post('/v1/updateuser', function (req, res) {
    controller.updateUser(req.user, req.body, function (err, result) {
        if (err) {
            res.status(200).json(ErrorHandler.getError(err));
        } else {
            res.status(200).json(ErrorHandler.getSuccess(result));
        }
    });
});



/*
  This should be a cron job or background process using the 2nd concurrent worker
*/

app.post('/v1/updatescores', function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.status(200).json(ErrorHandler.bodyMissingError())
    }
    else if (req.body.admin === undefined) {
        res.status(200).json(ErrorHandler.contentMissingError())
    } else {
        controller.updateScore(req.user, function (err, result) {
            if (err) {
                res.status(200).json(ErrorHandler.getError(err));
            } else {
                res.status(200).json(ErrorHandler.getSuccess(result));
            }
        });
    }
});



app.use('/public/static/', expressStaticGzip('/public/static/', {
    customCompressions: [{
        encodingName: 'gzip',
        fileExtension: 'gz'
    }]
}));

/**
 * This is a scheduled task that will update the calculation for the score every ten minutes. Also update CreateEventIntel
 */
cron.schedule("*/5 * * * *", function() {
    try{
        controller.updateFromLastIntel();
        controller.realAllScoreRanking(function(err, result){
            if(err){
                console.log(err)
            }else{
                controller.getScoreAndSaveRedis(function(err, result){
                    if(err){
                        console.log(err)
                    }else{
                        console.log('Sucessfully updated' )
                    }

                });
            }

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
        controller.aproxAllScoreRanking(function(err, result){
            if(err){
                console.log(err)
            }else{
                controller.getScoreAndSaveRedis(function(err, result){
                    if(err){
                        console.log(err)
                    }else{
                        console.log('Sucessfully updated aprox' )
                    }
                    setTimeout(run, Math.max(100, 60000 - (new Date().getTime()) + time ));

                });
            }

        });
    }catch (e) {
        console.log(e);
    }

}, 60000);



/*app.get('/v1/content/social', function(req, res){
  //add solume API key to config + environment variable
  //use request promises and get solume result

  //use controller to process result



}); */
/*
WEb socket in order to keep fronted updated
 */

const WebSocket = require('ws');
var WebSocketServer = WebSocket.Server,
    wss = new WebSocketServer({
        verifyClient: function (info, cb) {

            var token = info.req.headers.cookie.split('authorization=')[1];
            if (!token)
                cb(false, 401, 'Unauthorized');
            else {
                jwt.verify(token, 'Pareto', function (err, decoded) {
                    if (err) {
                        cb(false, 401, 'Unauthorized')
                    } else {
                        info.req.user = decoded;
                        cb(true)
                    }
                })

            }
        },
        port: process.env.WS_PORT || constants.WS_PORT
    });


/**
 * We need these functions in order to prevent issues with the sockets ‘alive’ status and improve performance.
 */
function noop() {}

function heartbeat() {
    this.isAlive = true;
}

/**
 * Initialize connections
 */
wss.on('connection', function connection(ws, req) {
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    ws.user = req.user;
    ws.on('message', function (message) {
        ws.info = JSON.parse(message);
    });
});

/**
 * Validates if the connection is alive and sends info each minute,
 */
cron.schedule("* * * * *", function() {
    try{
        wss.clients.forEach(function each(client) {
            if (client.isAlive === false) return client.terminate();

            client.isAlive = false;
            client.ping(noop);
            if (client.readyState === WebSocket.OPEN ) {
                // Validate if the user is subscribed a set of information
                if(client.info && client.user){
                    const rank = parseInt(client.info.rank) || 1;
                    let limit = parseInt(client.info.limit) || 100;
                    const page = parseInt(client.info.page) || 0;

                    //max limit
                    if (limit > 500) {
                        limit = 500;
                    }
                    /**
                     * Send ranking
                     */
                    controller.retrieveRanksAtAddress(rank, limit, page, function (err, result) {
                        if (!err) {
                            client.send(JSON.stringify(ErrorHandler.getSuccess(result)) );
                        }
                    });

                    controller.retrieveAddress(client.user.user, function (err, result) {
                        if (!err) {
                            client.send(JSON.stringify(ErrorHandler.getSuccess(result)));
                        }
                    });

                }
            }
        });
    }catch (e) {
        console.log(e);
    }

});


module.exports = {app: app, controller: controller };