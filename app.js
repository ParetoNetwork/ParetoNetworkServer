"use strict";

var compression = require('compression');
var express = require('express');
const fs = require("fs");
const expressStaticGzip = require('express-static-gzip');
var path = require('path');
var boom = require('express-boom-2');
var requestp = require('request-promise');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const multer = require("multer");
var controller = require('./backend-controller.js');

var app = express();
var compression = require('compression');

var uniqueRandomArray = require('unique-random-array');
const debug = require('debug')('pareto-ranking');
const appName = 'Pareto Ranking Backend';
debug('booting %s', appName);

var bodyParser = require('body-parser');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "/images");

        fs.mkdir(dir, err => cb(err, dir))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });

//the key/value pairs fixes the error PayloadTooLargeError: request entity too large
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));
app.use(cookieParser());
app.use(compression());
app.use(express.static('public'));
app.all('/*', function (req, res, next) {
    // add details of what is allowed in HTTP request headers to the response headers

    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_SERVER || "*");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, App-Key,Authorization,Accept');

    // the next() function continues execution and will move onto the requested URL/URI
    next();
});

app.use("/api-docs", express.static('docs'));
//handles only error codes in a consistent way and format, doesn't do anything for 2XX responses
app.use(boom());

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

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

app.post('/upload-profile', upload.single('file'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    res.status(200).json({filename: req.file.filename});
});

app.get('/profile-image', function (req, res) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    res.sendFile( path.join(__dirname, "/images/"+req.query.image));
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
            console.log(err);
            if(err.code){
                res.status(err.code).json(err)
            }else{
                //if this is a message
                res.boom.badData(err);
            }

        } else {
            controller.getProfileAndSaveRedis(req.body.owner, function (err, user) {
                if (err) {
                    console.log(err); //if this is a message
                    res.boom.badData(err);
                } else {
                    if (process.env.DEBUG == 1) { //this allows you to create a cookie that works on localhost and without SSL, and can be accessed by javascript
                        res.cookie('authorization', result.token, {httpOnly: true});
                    }
                    else {
                        res.cookie('authorization', result.token, {
                            domain: 'pareto.network',
                            path: '/',
                            httpOnly: true,
                            secure: true
                        }); //should set a debug flag for env variable
                    }
                    user.score = result.score;
                    user.rank = result.rank;
                    user.tokens = result.tokens;
                    res.status(200).json({status: 'success',result: user});
                }
            })

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
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

/********* AUTHENTICATED v1 APIs *********/

app.use(function (req, res, next) {

    if (req.cookies === undefined || req.cookies.authorization === undefined) {

        res.boom.unauthorized('Token missing, failed to authenticate token.');

    } else {

        var authorization = req.cookies.authorization;
        if (authorization.includes('Bearer')) {
            authorization = authorization.replace('Bearer', '');
        }
        authorization = authorization.trim();

        jwt.verify(authorization, 'Pareto', function (err, decoded) {
            if (err) {
                res.boom.unauthorized('Failed to authenticate token.');
            }
            else {
                req.user = decoded.user;
                next();
            }
            ;
        });
    }

});

/*
* Auth, simple authenticated method to determine if user is properly authenticated. Necessary because client side js
* cannot read the cookie we store for security reasons.
*/
app.get('/v1/auth', function (req, res) {

    res.status(200).json({auth: req.user});
});

app.get('/v1/splash-auth', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/dashboard.html'));
});

/*
* Unsign - clears cookie session for the client side, which cannot access secure httpOnly cookies
*/
app.post('/v1/unsign', function (req, res) {
    controller.unsign(function (err, result) {
        if (err) {
            console.log(err);
            res.boom.badData(err);
        } else {
            if (process.env.DEBUG == 1) {
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
            res.status(200).json({status: 'success', result});
        }
    });

});


app.get('/v1/summation', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    //req.user is an address
    controller.calculateScore(req.user, 0, function (err, result) {
        if (err) {
            console.log(err.message);
            res.boom.badImplementation(err.message);
        } else {
            res.status(200).json(result);
        }

    });

});//end entire function

app.post('/v1/content', function (req, res) {

    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.boom.badRequest('POST body missing');
    }
    else if (req.user === undefined || req.body.title === undefined || req.body.body === undefined) {
        console.log(req.body);
        res.boom.badRequest('POST body missing, needs address, title and body');
    } else {

        //needs to check address whitelist against the authorized address, if people figure out the post body format.

        controller.postContent(req, function (err, obj) {
            if (err) {
                console.log(err);
                res.boom.badData(err);
            } else {
                res.status(200).json({status: 'success', content: obj});
            }

        });
    }

}); //end content post

app.get('/v1/content', function (req, res) {

    //this needs a session id, basically an authenticated address

    controller.getAllAvailableContent(req, function (err, result) {
        if (err) {
            res.boom.badData(err);
        } else {
            res.status(200).json(result);
        }
    });

});

app.get('/v1/content/me/', function (req, res) {

    controller.getContentByCurrentUser(req.user, function (err, result) {
        if (err) {
            res.boom.badData(err);
        } else {
            res.status(200).json(result);
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
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

//get info about another address
app.get('/v1/address/:address', function (req, res) {

    controller.retrieveAddress(req.params.address, function (err, result) {
        if (err) {
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

//get info of himself
app.get('/v1/userinfo', function (req, res) {
    controller.getUserInfo(req.user,  function (err, result) {
        if (err) {
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

//get info about another address
app.get('/v1/userinfo/:address', function (req, res) {
    controller.getUserInfo(req.params.params,  function (err, result) {
        if (err) {
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

//update info user
app.post('/v1/updateuser', function (req, res) {
    controller.updateUser(req.user, req.body, function (err, result) {
        if (err) {
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });
});

/*
* re-calculate rank?
*/
app.post('/v1/rank', function (req, res) {

    controller.calculateScore(req.body.address, 0, function (err, result) {
        if (err) {
            res.boom.badRequest(err.message);
        } else {
            res.status(200).json(result);
        }
    });

});

/*
  This should be a cron job or background process using the 2nd concurrent worker
*/

app.post('/v1/updatescores', function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.boom.badRequest('POST body missing');
    }
    else if (req.body.admin === undefined) {
        res.boom.badRequest('POST body missing, needs keys');
    } else {
        if (req.body.admin == 'events')
            controller.seedLatestEvents(res);
        else if (req.body.admin == 'scores')
            controller.calculateAllScores(function (err, result) {
                if (err) {
                    res.boom.badRequest(err.message);
                } else {
                    res.status(200).json(result);
                }
            });
    }
});

app.post('/v1/updateranks', function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.boom.badRequest('POST body missing');
    }
    else if (req.body.admin === undefined) {
        res.boom.badRequest('POST body missing, needs keys');
    } else {
        if (req.body.admin == 'update') {
            controller.calculateAllRanks(function (err, result) {
                if (err) {
                    res.boom.badRequest(err.message);
                } else {
                    res.status(200).json(result);
                }
            });
        } else if (req.body.admin == 'reset') {
            controller.resetRanks(function (err, result) {
                if (err) {
                    res.boom.badRequest(err.message);
                } else {
                    res.status(200).json(result);
                }
            });
        }
    } //end else
});


app.use('/public/static/', expressStaticGzip('/public/static/', {
    customCompressions: [{
        encodingName: 'gzip',
        fileExtension: 'gz'
    }]
}));

/*app.get('/v1/content/social', function(req, res){
  //add solume API key to config + environment variable
  //use request promises and get solume result

  //use controller to process result



}); */

module.exports = {app: app, controller: controller };