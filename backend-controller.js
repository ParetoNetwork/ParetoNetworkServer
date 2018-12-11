const https = require('https');
const request = require('request');
const kue  = require ('kue');
var controller = module.exports = {};
const Decimal = require('decimal.js-light');
const fs = require('fs');
const path = require('path');
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -7,
    toExpPos: 21
});

let constants = {};
const constantsPath = path.resolve(__dirname,'backend-private-constants.json');

if (fs.existsSync(constantsPath)) {
  constants = require(constantsPath);
}

/*constants*/
var CONNECTION_URL = process.env.MONGODB_URI || constants.MONGODB_URI;
var PARETO_CONTRACT_ADDRESS = process.env.CRED_PARETOCONTRACT || constants.CRED_PARETOCONTRACT;
var WEB3_URL = process.env.WEB3_URL;
var WEB3_WEBSOCKET_URL = process.env.WEB3_WEBSOCKET_URL;
var ETH_NETWORK = process.env.ETH_NETWORK;
var PARETO_SIGN_VERSION = process.env.PARETO_SIGN_VERSION;
var COIN_MARKET_API_KEY = process.env.COIN_MARKET_API_KEY;
/*ways of writing contract creation block height*/
//const CONTRACT_CREATION_BLOCK_HEX = '0x4B9696'; //need this in hex
const CONTRACT_CREATION_BLOCK_HEX = process.env.CONTRACT_CREATION_BLOCK_HEX;  //need this in hex
//const CONTRACT_CREATION_BLOCK_INT = 4953750;
const CONTRACT_CREATION_BLOCK_INT = process.env.CONTRACT_CREATION_BLOCK_INT;
const EXPONENT_BLOCK_AGO = process.env.EXPONENT_BLOCK_AGO;
const  REDIS_URL = process.env.REDIS_URL  || constants.REDIS_URL;
const queue = kue.createQueue({
    redis: REDIS_URL,
});
const modelsPath = path.resolve(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
  require(modelsPath + '/' + file);
});


/**
 * Redis Initialization
 */
const redis = require("redis");
redisClient = redis.createClient(REDIS_URL, {no_ready_check: true});

redisClient.on("connect", function () {
  console.log("PARETO: Success connecting to Redis ")
});
redisClient.on("error", function (err) {
  console.log("PARETO: Problems connecting to Redis "+ err );
});


/**
 * Web3 Initialization
 */
var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider("https://sealer.giveth.io:40404/"));
// var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"));
var web3 = new Web3(new Web3.providers.HttpProvider(WEB3_URL));
var web3_events_provider = null;
var web3_events = null;

controller.startW3WebSocket = function () {
    web3_events_provider.on('connect', function () {
        console.log('WS web3 connected');
        controller.startwatchIntel()
    });

    web3_events_provider.on('end', e => {
        console.log('WS web3 closed');
        console.log('Attempting to reconnect...');
        web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
        web3_events = new Web3(web3_events_provider);
        controller.startW3WebSocket()
    });
};

/**
 *
 * Db Initialization
 */

const mongoose = require('mongoose');
//var models = require('./models/address');
mongoose.connect(CONNECTION_URL, { useNewUrlParser: true }).then(tmp=>{
    web3_events_provider =  new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
    web3_events  = new Web3(web3_events_provider);
    controller.startW3WebSocket();
  console.log("PARETO: Success connecting to Mongo ")
}).catch(err=>{
  console.log("PARETO: Problems connecting to Mongo: "+err)
});


/*db model initializations*/
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const ParetoAddress = mongoose.model('address');
const ParetoContent = mongoose.model('content');
const ParetoProfile = mongoose.model('profile');
const ParetoReward = mongoose.model('reward');
const ParetoTransaction = mongoose.model('transaction');


// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require("./build/contracts/Intel.json");

var sigUtil = require('eth-sig-util');
var jwt = require('jsonwebtoken');

/*project files*/
var utils = require('./backend-utils.js');

module.exports.mongoose = mongoose;
module.exports.redisClient = redisClient;

controller.endConnections= function(){
    mongoose.connection.close();
    redisClient.end(true);
}



const dbName = 'pareto';

/*system constants*/
const PARETO_SCORE_MINIMUM 					=			100000; 	//minimum score to get intel
const PARETO_RANK_GRANULARIZED_LIMIT 		= 			10; 		//how far down to go through ranks until separating by tiers

const ErrorHandler = require('./error-handler.js');



controller.getParetoCoinMarket = function(callback){
    let url = 'https://pro-api.coinmarketcap.com/v1';

    request(url + '/cryptocurrency/quotes/latest?symbol=PARETO&convert=USD',
        {headers: {'x-cmc_pro_api_key': COIN_MARKET_API_KEY }},
        (error, res, body) => {
            console.log(COIN_MARKET_API_KEY);
            callback(error, JSON.parse(body));
        });
};

controller.getBalance = async function(address, blockHeightFixed, callback){

    address = address.toLowerCase();

    var blockHeight = 0;

    if(web3.utils.isAddress(address) == false){
        if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
    } else {

        //console.log(address);

        //this call doesn't use the padded address
        var tknAddress = (address).substring(2);
        var contractData = ('0x70a08231000000000000000000000000' + tknAddress);

        //ethereum servers suck, give them 5ms to breath
        await new Promise(r => setTimeout(() => r(), 5));
        //get current blocknumber too
        web3.eth.getBlock('latest')
            .then(function(res) {
                blockHeight = res.number;
                //console.log("blockheight: " + blockHeight);

                //then re-tally total
                return web3.eth.call({
                    to: PARETO_CONTRACT_ADDRESS,
                    data: contractData
                }).then(function(result) {
                    var amount = 0;
                    if (result) {
                        var tokens = web3.utils.toBN(result).toString();
                        amount = web3.utils.fromWei(tokens, 'ether');
                       // console.log("amount: " + amount);
                    }

                    if(amount > 0){
                        callback(null,amount)
                    } else {

                        callback(ErrorHandler.zeroParetoBalanceMessage)

                    } //end


                }, function (error) {
                    callback(error);
                }).catch(function (err) {
                    callback(err);
                });//end promise related to balance//end promise related to balance
            }, function (error) {
                callback(error);
            }).catch(function (err) {
            callback(err);
        });//end promise related to balance //end promise related to block height
    } //end address validation

};

controller.postContent = function (req, callback) {

    var body = req.body;

    //exposed endpoint to write content to database
      if(web3.utils.isAddress(req.user) == false){
        if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
      } else {

    let Intel = new ParetoContent({
        address: req.body.address || req.user,
        title: req.body.title,
        body: req.body.body,
        text: req.bodytext,
        dateCreated: Date.now(),
        block: req.body.number || 0,
        txHash: req.body.txHash || '0x0', //this is done client side to cause an internal invocation
        speed: 3, //1 is very fast speed, 2 is fast, 3 is normal, medium speed, 4 is very slow speed for long applicable swing trades
        reward: req.body.reward || 1

    });
    Intel.save((err, savedIntel) => {

        if (err) {
            if (callback && typeof callback === "function") { callback(err); }
        } else {

            if (callback && typeof callback === "function") { callback(null, { Intel_ID: savedIntel.id }); }

        }
    })

      } // end else

};


controller.getPendingTransaction = function (address, callback){
    ParetoTransaction.find({address: address, status: {$lt: 3}}).sort({dateCreated : -1}).exec( callback);
}

controller.watchTransaction =  function (data, callback){
    if(data.address){
        data.address = data.address.toLowerCase();
    }

    var dbQuery = {
        txHash: data.txHash
    };
    if (data.txRewardHash){
        data.status = 2;
    }
    var dbValues = {
        $set: data
    };
    var dbOptions = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    };

    var updateQuery = ParetoTransaction.findOneAndUpdate(dbQuery, dbValues, dbOptions);
    updateQuery.exec().then(function (r) {
         callback(null, r);
    }).catch(function(e){
        callback(e)
    });
}


controller.startwatchNewIntel = function(){
    const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    console.log('startWatch');
    intel.events.NewIntel().on('data',  event => {
        try{
            const initialBalance = web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
            const expiry_time = event.returnValues.ttl;
            ParetoContent.findOneAndUpdate({ id: event.returnValues.intelID, validated: false }, {intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address, validated: true, reward: initialBalance, expires: expiry_time, block: event.blockNumber, txHash: event.transactionHash }, { multi: false }, function (err, data) {
                if(!err && data){
                    try{
                        controller.getBalance(data.address,0, function(err, count){
                            if(!err){
                                let promises = [ParetoAddress.findOneAndUpdate({address: data.address}, {tokens : count})
                                    ,  ParetoTransaction.findOneAndUpdate(
                                            {txRewardHash: null,  intel: event.returnValues.intelID, event: 'create'}, { status: 3  })];
                                        Promise.all(promises).then( values =>{
                                            if(values.length > 1 ){
                                                controller.getScoreAndSaveRedis((err, result)=>{
                                                    controller.SendInfoWebsocket({address: data.address, transaction: values[1]});
                                                })
                                            }
                                        })
                                    .catch(e=>{
                                        console.log(e);
                                    });

                            }
                        });

                    }catch (e) {
                        console.log(e);
                    }
                }
            });
        }catch (e) {
            console.log(e);
        }

    }).on('error', err=>{
        console.log(err);
    });
}


controller.startwatchReward= function(intel, intelAddress){
    intel.events.Reward().on('data',  event => {
        try{
            const intelIndex = parseInt(event.returnValues.intelIndex);
            const rewardData = {
                sender: event.returnValues.sender.toLowerCase(),
                receiver: '',
                intelAddress: intelAddress,
                intelId: intelIndex,
                txHash: event.transactionHash,
                dateCreated:  Date.now() ,
                block: event.blockNumber,
                amount: web3.utils.fromWei(event.returnValues.rewardAmount, 'ether')
            };

            ParetoReward.findOneAndUpdate({ txHash: event.transactionHash},rewardData, {upsert: true, new: true},
                function(err, r){
                    if(err){
                        console.error('unable to write to db because: ', err);
                    } else {
                        ParetoContent.findOne({id:intelIndex}, (err, intel) => {
                            if(intel){
                                const {address} = intel;
                                ParetoReward.findOneAndUpdate({ txHash: event.transactionHash},{receiver: address}, {},
                                    function(err, r){ }
                                );
                            }
                        });

                        controller.getBalance(event.returnValues.sender.toLowerCase(),0, function(err, count){
                            if(!err){
                                controller.updateAddressReward(event, count);
                            }else{
                                callback(err);
                            }
                        });
                        controller.updateIntelReward(intelIndex, event.transactionHash,event.returnValues.sender.toLowerCase());
                    }
                }
            );

        }catch (e) {
            console.log(e);
        }

    }).on('error', err=>{
        console.log(err);
    });
}

controller.startwatchDistribute= function (intel, intelAddress){
    intel.events.RewardDistributed().on('data',  event => {
        try{
            const intelIndex = parseInt(event.returnValues.intelIndex);

            let promises = [ ParetoContent.findOneAndUpdate({id:intelIndex}, {distributed: true, txHashDistribute: event.transactionHash})
                ,  ParetoTransaction.findOneAndUpdate({   txHash: event.transactionHash } , { status: 3,  txRewardHash: event.transactionHash  })];
            Promise.all(promises).then( values =>{
                if(controller.wss && values.length > 1){
                    controller.SendInfoWebsocket({address: values[0].address, transaction: values[1]});
                }else{
                    console.log('no wss');
                }
            })
                .catch(e=>{
                    console.log(e);
                });



        }catch (e) {
            console.log(e);
        }

    }).on('error', err=>{
        console.log(err);
    });
}


controller.startWatchApprove=function (){
    web3_events.eth.subscribe('logs',
        {
            fromBlock: 'latest',
            address: PARETO_CONTRACT_ADDRESS,
            topics: ['0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', null, null]
        }).on('data', function (log) {
        const txHash = log.transactionHash;
        const blockNumber = log.blockNumber;
        if(blockNumber!=null){
            ParetoTransaction.findOneAndUpdate({ txHash: txHash }, { status: 1, block: blockNumber }, function (err, r) {
                if(!err && r){
                    controller.SendInfoWebsocket({address: r.address, transaction: r});
                }else{
                    if(err){console.log(err);}
                }

            })
        }
    });
}

/**
 * Watch Intel events. Support watch rewards for old Intel address
 */
controller.startwatchIntel = function(){
    controller.startwatchNewIntel()
    ParetoContent.find({ 'expires':{ $gt : Math.round(new Date().getTime() / 1000)}, 'validated': true }).distinct('intelAddress').exec(function(err, results) {
        if (err) {
            callback(err);
        }
        else {
            let data = results.filter(item => item === Intel_Contract_Schema.networks[ETH_NETWORK].address);
            if(!data.length){
                results = [ Intel_Contract_Schema.networks[ETH_NETWORK].address];
            }
            for (let i=0;i<results.length;i=i+1) {
                const intelAddress =results[i];
                const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, intelAddress);
                controller.startwatchReward(intel, intelAddress);
                controller.startwatchDistribute(intel, intelAddress);
            }

        }
    });
    controller.startWatchApprove();

};


/**
 * update Address score when reward an intel
 * @param event
 */
controller.updateAddressReward = function(event, token){
    let addressToUpdate = event.returnValues.sender.toLowerCase();
    ParetoAddress.findOneAndUpdate({address: addressToUpdate}, {tokens: token},{  new: true  },(err, data)=>{
        let dbValues =  {
            bonus: data.bonus,
            tokens: data.tokens,
            score: data.score,
            block: data.block
        };
        controller.addExponentAprox([addressToUpdate],[dbValues],event.blockNumber,function (err, res){
            var dbQuery = {
                address: addressToUpdate
            };
            var dbValues = {
                $set: {
                    score: res[0].score,
                    block: res[0].block,
                    bonus: res[0].bonus,
                    tokens: res[0].tokens
                }
            };
            var dbOptions = {
                upsert: true,
                new: true //mongo uses returnNewDocument, mongo uses new
            };
            // console.log({
            //     addrees: dbQuery.address,
            //     dbValues: dbValues
            // });
            //should queue for writing later
            var updateQuery = ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions);
            //var countQuery = ParetoAddress.count({ score : { $gt : 0 } });

            updateQuery.exec().then(function (r) {
                controller.getScoreAndSaveRedis( function (err, result) {
                    if(!err){
                        controller.SendInfoWebsocket({address: addressToUpdate});
                    }else{
                        console.log(err);
                    }
                })
            })
        });
    })
}


controller.SendInfoWebsocket = function (data ){
    if(controller.wss){
        controller.wss.clients.forEach(function each(client) {
            try{
                if (client.isAlive === false) return client.terminate();
                if (client.readyState === controller.WebSocket.OPEN ) {
                    // Validate if the user is subscribed a set of information
                    client.send(JSON.stringify(ErrorHandler.getSuccess({ action: 'updateContent'})) );
                    if(client.user && client.user.user==data.address){
                        controller.retrieveAddress(client.user.user, function (err, result) {
                            if (!err) {
                                client.send(JSON.stringify(ErrorHandler.getSuccess(result)));
                            }
                        });

                        if(data.transaction){
                            client.send(JSON.stringify(ErrorHandler.getSuccess({ action: 'updateHash', data: data.transaction})) );
                        } else{

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
                        }
                    }
                }
            }catch (e) {
                console.log(e);
            }
        });
    }

}

/**
 * Update totalreward count in Intel document
 * @param intelIndex
 * @param txHash
 */
controller.updateIntelReward=function(intelIndex, txHash, sender){
    let agg =  [ {$match: { 'intelId': intelIndex } },
        { $group: { _id: null,
                rewards : {
                    "$addToSet" : {
                        "txHash" : "$txHash",
                        "amount" : "$amount"
                    }
                } } },
        {  $unwind : "$rewards" },
        { $group: { _id: null,
                reward: {$sum: "$rewards.amount"}}}

    ];
    ParetoReward.aggregate( agg).exec(function (err, r) {
        if(r.length > 0) {
            const reward = r[0].reward;
            let promises = [ParetoContent.findOneAndUpdate({id: intelIndex}, {totalReward: reward})
            ,  ParetoTransaction.findOneAndUpdate({ $or: [{ txRewardHash: txHash },
                    {txRewardHash: null, address: sender, intel: intelIndex, event: 'reward'}]}, { status: 3,  txRewardHash: txHash  })];
            Promise.all(promises).then( values =>{
                    if(values.length > 1 && controller.wss){
                        controller.SendInfoWebsocket({address: values[1].address, transaction: values[1]});
                    }
                })
                .catch(e=>{
                    console.log(e);
                });
        }
    })
};


/**
 *  addExponent using db instead of Ethereum network
 */
controller.addExponentAprox =  function(addresses, scores,  blockHeight,callback){
    return ParetoReward.find({'block': { '$gt': (blockHeight-EXPONENT_BLOCK_AGO)} }).exec(function(err, values) {
        if (err) {
            callback(err);
        }
        else {
            let total=values.length;
            let rewards={};
            for (let j = 0; j < values.length; j = j + 1) {
                try{
                    const sender = values[j].sender.toLowerCase();
                    if(!rewards[sender]){
                        rewards[sender] = 0;
                    }
                    rewards[sender]=rewards[sender]+1;
                }catch (e) { console.log(e) }
            }
            const M = total/2;
            for (let i = 0; i < addresses.length; i = i + 1) {
                try{
                    const address = addresses[i].toLowerCase();
                    if (rewards[address] && scores[i].bonus > 0 && scores[i].tokens > 0) {
                        const V = (1 + (rewards[address] / M) / 2);
                        scores[i].score = parseFloat(Decimal(parseFloat(scores[i].tokens)).mul(Decimal(parseFloat(scores[i].bonus)).pow(V)));

                    }else{
                        scores[i].score = 0;
                    }
                }catch (e) { console.log(e) }

            }
            return callback(null, scores);
        }
    })
};


controller.validateQuery = function(query){
    const array = [];
    if( query.created && !isNaN(Date.parse(query.created))) {
        try {
            const date =new Date(query.created);
            const date2 =new Date(date.getTime() + 86400000);
            array.push({
                $and: [
                    {dateCreated: {$gte: date}},
                    {dateCreated: {$lte: date2}}
                ]

            }) 
        } catch (e) {
            console.log(e)
        }
    }
    if( query.title ) {
        try {
            array.push({
                title: {$regex : ".*"+query.title+".*"}
            })
        } catch (e) {
            console.log(e)
        }
    }

    if( query.address ) {
        try {
            data = query.address.split(',')
                .filter( address =>{ return web3.utils.isAddress(address) } ).map(address => {return address.toLowerCase()});
            if( data.length > 0 ) {
                array.push({ address: { $in: data} })
            }

        } catch (e) {
            console.log(e)
        }
    } else{
        if( query.exclude ) {
            try {
                data = query.exclude.split(',')
                    .filter( address =>{ return web3.utils.isAddress(address) } ).map(address => {return address.toLowerCase()});
                if( data.length > 0 ) {
                    array.push({ address: { $nin: data} })
                }

            } catch (e) {
                console.log(e)
            }
        }
    }
    return array;

}

controller.getAllAvailableContent = function(req, callback) {

    var limit = parseInt(req.query.limit || 100);
    var page = parseInt(req.query.page || 0);
  //check if user, then return what the user is privy to see

  //check block number or block age, then retrieve all content after that block. add more limitations/filters later

  if(web3.utils.isAddress(req.user) == false){
    if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
  } else {


      //address exclude created title
    //1. get score from address, then get standard deviation of score
    controller.retrieveAddress(req.user, function(err,result) {

      if(err){
        if(callback && typeof callback === "function") {
          callback(err);
        }
      } else {

        if(result == null){

          //this can happen if a new address is found which is not in the system yet. in reality it should be calculated beforehand, or upon initial auth

          if(callback && typeof callback === "function") { callback(null, [] ); }
        } else {
          //1b. get block height
          web3.eth.getBlock('latest')
            .then(function(res) {
              blockHeight = res.number;

              //2. get percentile

              //2a. get total rank where score > 0
              ParetoAddress.estimatedDocumentCount({ score : { $gte : 0 }}, async(err, count) => {
                var count = count;

                //and this is because we are using hardcoded ranks to begin with. fix by having proprietary high performance web3 server (parity in docker?), or by doing more efficient query which creates rank on the fly from group
                if(result.rank == null){
                  result.rank = count - 1;
                }

                var percentile = 1 - (result.rank / count); //this should be a decimal number

                var blockDelay = 0;

                if(percentile > .99) {

                  //then do multiplication times the rank to determine the block height delta.
                  if(result.rank < PARETO_RANK_GRANULARIZED_LIMIT){
                    blockDelay = result.rank * 10;
                  } else {
                    blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 10;
                  }
                  /*} else { //this would be a dynamic method where var factor = Math.pow(10, -1);
                         //would be used with var wholePercentile = percentile * 100;
                         //Math.round(wholePercentile * factor) / factor in order to get the percentile

                  var factor = Math.pow(10, -1);
                  var wholePercentile = percentile * 100;
                  var roundedToNearestPercentile = Math.round(wholePercentile * factor) / factor;
                  //var multiplier = 100 * Math.floor(percentile);
                  blockDelay = (100 - roundedToNearestPercentile)) * PARETO_RANK_GRANULARIZED_LIMIT;

                }*/

                } else if (percentile > .90) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 20;

                } else if (percentile > .80) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 30;

                } else if (percentile > .70) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 40;

                } else if (percentile > .60) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 50;

                } else if (percentile > .50) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 60;

                } else if (percentile > .40) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 70;

                } else if (percentile > .30) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 80;

                } else if (percentile > .20) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 90;

                } else if (percentile > .10) {

                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 100;

                } else {
                  blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 110;
                }

                var blockHeightDelta = blockHeight - blockDelay;

                //stop gap solution, more censored content can come down and be manipulated before posting client side
                var queryAboveCount = ParetoContent.estimatedDocumentCount({block : { $gt : blockHeightDelta}});

                try{
                    const queryFind = { $and:[
                            { $or:[
                                    {block : { $lte : blockHeightDelta*1 }, speed : 1,$or:[ {validated: true}, {block: { $gt: 0 }}]},
                                    {block : { $lte : blockHeightDelta*50 }, speed : 2, $or:[ {validated: true}, {block: { $gt: 0 }}]},
                                    {block : { $lte : blockHeightDelta*100 }, speed : 3, $or:[ {validated: true}, {block: { $gt: 0 }}]},
                                    {block : { $lte : blockHeightDelta*150 }, speed : 4, $or:[ {validated: true}, {block: { $gt: 0 }}]},
                                    {address : req.user, $or:[ {validated: true}, {block: { $gt: 0 }}]}
                                ]
                            } ]
                    };
                    queryFind.$and = queryFind.$and.concat( controller.validateQuery(req.query));
                    allResults = await ParetoContent.find(queryFind).sort({dateCreated : -1}).skip(page*limit).limit(limit).populate( 'createdBy' ).exec();
                    let newResults = [];
                    allResults.forEach(function(entry){
                        /*

                         currently: force use of limit to keep json response smaller.
                         limit isn't used earlier so that redis knows the full result,
                         and because the queries for each speed of content are separate

                         future: server should already have an idea of what content any user can see,
                         since it knows their latest scores and the current block height. therefore the full content response can be queried at once, perhaps, and pages can be done fictionally

                         */
                            let data = {
                                _id: entry._id,
                                blockAgo: Math.max(blockHeight - entry.block, 0),
                                block: entry.block,
                                title: entry.title,
                                address: entry.address,
                                body: entry.body,
                                expires: entry.expires,
                                dateCreated: entry.dateCreated,
                                txHash: entry.txHash,
                                totalReward:  entry.totalReward || 0,
                                reward:  entry.reward,
                                speed: entry.speed,
                                id:entry.id,
                                txHashDistribute: entry.txHashDistribute,
                                intelAddress: entry.intelAddress,
                                _v: entry._v,
                                distributed: entry.distributed,
                                createdBy: {
                                    address: entry.createdBy.address,
                                    alias: entry.createdBy.alias,
                                    biography: entry.createdBy.biography,
                                    profilePic: entry.createdBy.profilePic
                                }
                            };

                            newResults.push(data);
                    });
                  //console.log(allResults);

                  if(callback && typeof callback === "function") { callback(null, newResults ); }

                } catch (err) {
                  if(callback && typeof callback === "function") { callback(err); }
                }

              });
            }, function (error) {
                callback(error);
            }).catch(function (err) {
              callback(err);
          });//end web3

        }//end else

      }
    });
  } // end else for address validation

};

controller.retrieveAddress = function(address, callback){

  var address = address;
  address = address.toLowerCase();

  if(web3.utils.isAddress(address) == false){
    if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
  } else {
      controller.retrieveAddressRankWithRedis([address],true,function (error, results) {
          if(error) {callback(error)}
          else { callback(null, results[0])}
      });
  }

};

controller.retrieveAddresses = function(addresses, callback){
    controller.retrieveAddressRankWithRedis(addresses,true,function (error, results) {
        if(error) {callback(error)}
        else { callback(null, results)}
    });
};

controller.updateUser = function(address, userinfo ,callback){

    let fixaddress  = address.toLowerCase();

    if(web3.utils.isAddress(fixaddress) == false){
         callback(new Error('Invalid Address'));
    } else {
        const profile = {address: address};
        if(userinfo.alias) {profile.alias = userinfo.alias}
        if(userinfo.biography) {profile.biography = userinfo.biography}
        if(userinfo.profile_pic) {profile.profilePic = userinfo.profile_pic}
        controller.insertProfile(profile, function (error, result) {
          if(error){ callback(error)}
          else{
              controller.getUserInfo(address, callback)
          }
        })
    }

};

controller.getUserInfo = function(address ,callback){

    let fixaddress  = address.toLowerCase();

    if(web3.utils.isAddress(fixaddress) == false){
        callback(new Error('Invalid Address'));
    } else {
        controller.retrieveAddressRankWithRedis([address],true,function (error, rankings) {
            if(error){
                callback(error)
            }else{
                controller.retrieveProfileWithRedis(address, function (error, profile) {
                    if(error){ callback(error)}
                    let ranking = rankings[0];
                    callback( null, { 'address': address,   'rank': ranking.rank, 'score': ranking.score, 'tokens': ranking.tokens,
                        'alias': profile.alias, 'biography': profile.biography, "profile_pic" : profile.profilePic } );
                });
            }

        });


    }

};



controller.getContentByCurrentUser = function(req, callback){
    const address = req.query.user || req.user;
    var limit = parseInt(req.query.limit || 100);
    var page = parseInt(req.query.page || 0);

  if(web3.utils.isAddress(address) == false){
    if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
  } else {
    var query = ParetoContent.find({address : address, validated: true}).sort({dateCreated : -1}).skip(limit*page).limit(limit).populate( 'createdBy' );

    query.exec(function(err, results){
      if(err){
        if(callback && typeof callback === "function") {
          callback(err);
        }
      }
      else {
          web3.eth.getBlock('latest')
              .then(function(res) {
                  blockHeight = res.number;
                  let newResults = [];
                  results.forEach(function(entry){
                      let data = {
                          _id: entry._id,
                          id: entry.id,
                          blockAgo : Math.max(blockHeight - entry.block),
                          block : entry.block,
                          address: entry.address,
                          title: entry.title,
                          body: entry.body,
                          dateCreated: entry.dateCreated,
                          txHash: entry.txHash,
                          totalReward:  entry.totalReward || 0,
                          reward:  entry.reward,
                          speed: entry.speed,
                          txHashDistribute: entry.txHashDistribute,
                          expires: entry.expires,
                          validated: entry.validated,
                          intelAddress: entry.intelAddress,
                          distributed: entry.distributed,
                          _v: entry._v,
                          createdBy: {
                              address: entry.createdBy.address,
                              alias: entry.createdBy.alias,
                              biography: entry.createdBy.biography,
                              profilePic: entry.createdBy.profilePic
                          }
                      };
                      newResults.push(data);
                  });
                  callback(null, newResults );
              } , function (error) {
                callback(error);
            }).catch(function (err) {
                callback(err);
             });

      }
    });
  }

};


/**
 * Worker Services
 */
controller.updateScore = function(address, callback){
    try{
        const job = queue
            .create('controller-job', {
                type: 'update',
                address: address
            } )
            .removeOnComplete(true)
            .save((error) => {
                if (error) {
                    next(error);
                    return;
                }
                job.on('complete', result => {
                    callback(null, result)
                });
                job.on('failed', (err) => {
                    callback(err)
                });
            });

    }catch (e) {
        callback(e);
    }

};

controller.getScoreAndSaveRedis = function(callback){
    try{
        const job = queue
            .create('controller-job', {
                type: 'save-redis',
            })
            .removeOnComplete(true)
            .save((error) => {
                if (error) {
                    next(error);
                    return;
                }
                job.on('complete', result => {
                    callback(null, result)
                });
                job.on('failed', (err) => {
                    callback(err)
                });
            });

    }catch (e) {
        callback(e);
    }

};


/**
 * End Worker Services
 */

controller.sign = function(params, callback){

    if(!params.data || !params.data.length  || !params.data[0].value ){
        return callback(ErrorHandler.signatureFailedMessage)
    } else{


        let msgParams = {
            types: {
                EIP712Domain: [
                    { name: "name",    type: "string"  },
                    { name: "version", type: "string"  },
                    { name: "chainId", type: "uint256" },
                    { name: 'verifyingContract', type: 'address' }
                ],
                CustomType: [
                    { name: "message",   type: "string" }
                ],
            },
            primaryType: "CustomType",
            domain: {
                name:    "Pareto",
                version: PARETO_SIGN_VERSION,
                chainId: ETH_NETWORK,
                verifyingContract: PARETO_CONTRACT_ADDRESS
            },
            message: {
                message: params.data[0].value
            },
        };
        const owner = params.owner;
        let recovered2  = '';
        let  recovered = '';
        let  recovered3 = '';
        try {
            recovered2 = sigUtil.recoverPersonalSignature({ data: params.data[0].value, sig: params.result });
        }catch (e) { console.log(e) }
        try {
            recovered = sigUtil.recoverTypedSignature({data: msgParams, sig: params.result});
        }catch (e) {console.log(e) }
        try {
            recovered3= sigUtil.recoverTypedSignatureLegacy({data: params.data, sig: params.result});
        }catch (e) {console.log(e) }

        if (recovered === owner || recovered2 === owner || recovered3 === owner) {
            // If the signature matches the owner supplied, create a
            // JSON web token for the owner that expires in 24 hours.
            controller.getBalance(owner,0, function(err, count){
                if(!err){
                    callback(null,  {token:  jwt.sign({user: owner}, 'Pareto',  { expiresIn: "5y" })});
                }else{
                    callback(err);
                }
            });


        } else {
            if(callback && typeof callback === "function") { callback(ErrorHandler.signatureFailedMessage); }
        }
    }



};

controller.unsign = function(callback){

  var token = 'deleted';
  if(callback && typeof callback === "function") { callback(null, token ); }

};

/*
* Retrieves rank around address
*/
controller.retrieveRanksAtAddress = function(q, limit, page, callback){
    if(web3.utils.isAddress(q+"")){
        let address = q.indexOf("0x")<0? "0x"+q.toLowerCase():q.toLowerCase();
        controller.retrieveAddressRankWithRedis([address],true,function (error, rankings) {
            if(error){
                callback(error);
            }else{
                var {rank} = rankings[0];
                controller.retrieveRanksWithRedis(rank, limit, page, true, callback);
            }

        });

    } else {
        if (Number.isInteger(q) || ( typeof q === 'string' && q.indexOf(".")<0 &&  !isNaN(parseInt(q))) ){
            controller.retrieveRanksWithRedis(q, limit, page, true, callback);
        }else{
            if ( !isNaN(parseFloat(q)) ){
                ParetoAddress.aggregate([
                    {$match:{score: {$ne:null, $gt: 0}}},
                    {$project: {diff: {$abs: {$subtract: [parseFloat(q), '$score']}}, doc: '$$ROOT'}},
                    {$sort: {diff: 1}},
                    {$limit: 1}
                ]).exec(function(e, r){
                    if(e || r.length === 0 || !r[0].doc ||  !r[0].doc.address){
                        callback(e)
                    }else{
                        controller.retrieveAddressRankWithRedis([r[0].doc.address],true,function (error, rankings) {
                            if(error){
                                callback(error);
                            }else{
                                var {rank} = rankings[0];
                                controller.retrieveRanksWithRedis(rank, limit, page, true, callback);
                            }

                        });
                    }
                })
            }
        }

    }
};

/**
 *
 * *********** Functions with Redis ************
 *
 */


/**
 * insert user
 * @param callback Response when the process is finished
 */

controller.insertProfile = function(profile,callback){

    ParetoProfile.findOneAndUpdate({address: profile.address},profile, {upsert: true, new: true},
          function(err, r){
              if(err){
                  console.error('unable to write to db because: ', err);
              } else {
                  const multi = redisClient.multi();
                  let profile = {address: r.address, alias: r.alias, biography: r.biography, profilePic: r.profilePic};
                  multi.hmset("profile"+profile.address+ "", profile );
                  multi.exec(function(errors, results) {
                      if(errors){ console.log(errors); callback(errors)}
                      return callback(null, profile );
                  })
              }
          }
      );


};

/**
 * Validate if the user already exists in the database
 * @param callback Response when the process is finished
 */

controller.isNew = function(address, callback){
    ParetoAddress.find({address: address}, function(err, r){
            if (r && r.length>0){
                callback(null, false);
            }else{
                callback(null, true);
            }
        });
};


/**
 * Get Profile in MongoDB. The result data is saved in Redis. If no Profile exist for the address, a new register is created,
 * @param callback Response when the process is finished
 */

controller.getProfileAndSaveRedis = function(address,callback){

   ParetoProfile.findOne({  address : address } ,
       function(err, r){
           if(r){
               let profile = {address: address, alias: r.alias, biography: r.biography, profilePic: r.profilePic};
               const multi = redisClient.multi();
               multi.hmset("profile"+profile.address+ "", profile );
               multi.exec(function(errors, results) {
                   if(errors){ console.log(errors); callback(errors)}
                   return callback(null, profile );
               })
           } else{
              let profile = {address: address, alias: "", biography: "", profilePic: "" };
               controller.insertProfile(profile, callback)
           }
       }
   );


};


/**
 * Get profile from Redis.
 * @param address
 */
controller.retrieveProfileWithRedis = function(address , callback){

    const multi = redisClient.multi();
    multi.hgetall( "profile"+address+ "");
    multi.exec(function(err, results) {
        if(err){
             callback(err);
        }
        if((!results || results.length ===0 || !results[0])){
            controller.getProfileAndSaveRedis(address, function(err, result){
                if(err){
                     callback(err);
                } else {
                     callback(null, result)
                }
            });
        }else{
              callback(null, results[0]);
        }

    });

};


/**
 * Get ranking from Redis.
 * getScoreAndSaveRedis must be called at some time before
 * @param rank the rank around the search
 * @param limit The size of page
 * @param page The skipped page
 * @param callback Response when the process is finished
 * @param attempts when is true, try with mongodb if results is zero
 */
controller.retrieveRanksWithRedis = function(rank, limit, page, attempts, callback){

  let queryRank = rank - 3;

  if(queryRank <= 0){
    queryRank = 1;
  }
  const multi = redisClient.multi();
  for (let i =queryRank+page ; i<queryRank+limit+page; i=i+1){
    multi.hgetall(i+ "");
  }
  multi.exec(function(err, results) {

    if(err){
        return callback(err);
    }

    // if there's no ranking stored in redis, add it there.
    if((!results || results.length ===0 || !results[0]) && attempts){
      controller.getScoreAndSaveRedis(function(err, result){
        if(err){
            return callback(err);
        } else {
          controller.retrieveRanksWithRedis(rank, limit, page,false ,callback);
        }
      });
    }else{
      // return the cached ranking
      return  callback(null, results.filter(data => data));
    }


  });

};

/**
 * Get ranking from Redis.
 * getScoreAndSaveRedis must be called at some time before
 * @param callback Response when the process is finished
 * @param address addressTobeGet
 *  @param attempts when is true, try with mongodb if results is zero
 */
controller.retrieveAddressRankWithRedis = function(addressess, attempts, callback){

    const multi = redisClient.multi();
    for (let i = 0; i<addressess.length; i=i+1){
        multi.hgetall("address"+addressess[i]);
    }
    multi.exec(function(err, results) {
        if(err){
            return callback(err);
        }
        if((!results || results.length ===0 || (!results[0] && results.length ===1)) && attempts){
            controller.getScoreAndSaveRedis(function(err, result){
                if(err){
                    return callback(err);
                } else {
                    controller.retrieveAddressRankWithRedis(addressess ,false,callback);
                }
            });
        }else{
          if((!results || results.length ===0 || (!results[0] && results.length ===1))){
              // hopefully, users without pareto shouldn't get here now.
              callback(ErrorHandler.addressNotFound)
          }else{
              const multi = redisClient.multi();
              for (let i = 0; i<results.length; i=i+1){
                  if(results[i]){
                      multi.hgetall(results[i].rank+ "");
                  }
              }
              multi.exec(function(err, results) {
                  if(err){
                      return callback(err);
                  }
                  // return the cached ranking
                  return callback(null, results);
              });
          }

        }


    });

};


/**
 *
 * *********** End Functions with Redis ************
 *
 */



controller.getAllIntel = async function(callback){
    const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    try{
        const result = await IntelInstance.methods.getAllIntel().call();
        console.log(result)
        response = [];
        for(let i = 0; i< result.intelID.length; i++){
            const obj = {};
            obj.intelID = result.intelID[i];
            obj.intelProvider = result.intelProvider[i];
            obj.depositAmount = result.depositAmount[i];
            obj.balance = result.balance[i];
            obj.rewardAfter = result.rewardAfter[i];
            obj.rewarded = result.rewarded[i];
            response.push(obj);
        }
    callback(null, response)
    } catch (err){
        console.log(err,"errr");
        callback(err, null)
    }

}
controller.getIntelsByProvider = async function(providerAddress ,callback){
    const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    try{
        const result = await IntelInstance.methods.getIntelsByProvider(providerAddress).call();
        console.log(result)
        response = [];
        for(let i = 0; i< result.intelID.length; i++){
            const obj = {};
            obj.intelID = result.intelID[i];
            obj.intelProvider = result.intelProvider[i];
            obj.depositAmount = result.depositAmount[i];
            obj.balance = result.balance[i];
            obj.rewardAfter = result.rewardAfter[i];
            obj.rewarded = result.rewarded[i];
            response.push(obj);
        }
    callback(null, response)
    } catch (err){
        console.log(err,"errr");
        callback(err, null)
    }

}
controller.getAnIntel = async function(Id, callback){
    const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    const result = await IntelInstance.methods.getIntel(Id).call();
    console.log(result);
    callback(null, result);
}

controller.getContributorsByIntel = async function (Id, callback) {
    const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
   
    try{
        const result = await IntelInstance.methods.contributionsByIntel(Id).call();
        console.log(result.addresses);
        console.log(result.amounts);

        response = [];
        for(let i = 0; i< result.addresses.length; i++){
            const obj = {};
            obj.address = result.addresses[i];
            obj.amount = result.amounts[i];

            response.push(obj);
        }
        callback(null, response)
    } catch (err){
        console.log(err,"errr");
        callback(err, null)
    }

}