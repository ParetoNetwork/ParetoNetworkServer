"use strict";

const throng = require('throng');

const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 3000;

throng({
  workers: WORKERS,
  lifetime: Infinity
}, start);

function start() {
  var express = require('express');
  var path    = require("path");
  var boom = require('express-boom-2');
  var requestp = require('request-promise');
  var controller = require('./backend-controller.js');
  var app = express();
  var Web3 = require('web3');
  var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i"));
  var uniqueRandomArray = require('unique-random-array');
  const debug = require('debug')('pareto-ranking')
  const appName = 'Pareto Ranking Backend'
  debug('booting %s', appName)

  var bodyParser = require('body-parser');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));

  app.use(boom()); //handles error codes in a consistent way and format

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

  app.get('/',function(req,res){
    //__dirname : It will resolve to your project folder.
    res.sendFile(path.join(__dirname+'/public/index.html'));
  });

  app.get('/intel',function(req,res){
    res.sendFile(path.join(__dirname+'/public/intel.html'));
  });

  app.get('/summation', function(req, fres){
      
      controller.calculateScore(req, fres, web3);

  });//end entire function

  app.post('/content', function(req, res){

    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
      res.boom.badRequest('POST body missing');
    }
    else if(req.body.address === undefined || req.body.title === undefined || req.body.body === undefined ){
      res.boom.badRequest('POST body missing, needs address, title and body'); 
    } else {
      controller.postContent(req.body, res);
    }

  }); //end content post

  app.get('/content', function(req, res){

  });

  app.listen(process.env.PORT || 3000, function () {
    console.log('Pareto Network ranking app listening on port 3000!')
  });
}