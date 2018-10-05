const https = require('https');
const request = require('request');

var controller = module.exports = {};

const fs = require('fs');
const path = require('path');


let constants = {};
const constantsPath = path.resolve(__dirname,'backend-private-constants.json');

if (fs.existsSync(constantsPath)) {
  constants = require(constantsPath);
}
console.log(constants);
/*constants*/
var CONNECTION_URL = process.env.MONGODB_URI || constants.MONGODB_URI;
var PARETO_CONTRACT_ADDRESS = process.env.CRED_PARETOCONTRACT || constants.CRED_PARETOCONTRACT;
var WEB3_URL = process.env.WEB3_URL;
var WEB3_WEBSOCKET_URL = process.env.WEB3_WEBSOCKET_URL;
var ETH_NETWORK = process.env.ETH_NETWORK;
var PARETO_SIGN_VERSION = process.env.PARETO_SIGN_VERSION;
var COIN_MARKET_API_KEY = process.env.COIN_MARKET_API_KEY;

const modelsPath = path.resolve(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
  require(modelsPath + '/' + file);
});


/**
 * Redis Initialization
 */
const redis = require("redis");
redisClient = redis.createClient(
  process.env.REDIS_URL  || constants.REDIS_URL
);
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
var web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
var web3_events = new Web3(web3_events_provider);

controller.startW3WebSocket = function () {
    web3_events_provider.on('connect', function () {
        console.log('WS web3 connected');
        controller.startwatchNewIntel()
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
mongoose.connect(CONNECTION_URL).then(tmp=>{
    controller.startW3WebSocket();
  console.log("PARETO: Success connecting to Mongo ")
}).catch(err=>{
  console.log("PARETO: Problems connecting to Mongo: "+err)
});


/*db model initializations*/
const ParetoAddress = mongoose.model('address');
const ParetoContent = mongoose.model('content');
const ParetoProfile = mongoose.model('profile');



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

/*ways of writing contract creation block height*/
//const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightHexString = '0x39CA84'; //need this in hex
//const contractCreationBlockHeightInt = 4953750;
const contractCreationBlockHeightInt = 3787396;

const dbName = 'pareto';

/*system constants*/
const PARETO_SCORE_MINIMUM 					=			100000; 	//minimum score to get intel
const PARETO_RANK_GRANULARIZED_LIMIT 		= 			10; 		//how far down to go through ranks until separating by tiers

const ErrorHandler = require('./error-handler.js');

controller.calculateScore = async function(address, blockHeightFixed, callback){
    //Web3 can throw error
    try{
        address = address.toLowerCase();

        var blockHeight = 0;

        var rankCalculation = 0;

        if(web3.utils.isAddress(address) == false){
            if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
        } else {

            //ethereum servers suck, give them 5ms to breath
            await new Promise(r => setTimeout(() => r(), 5));
            //get current blocknumber too
            web3.eth.getBlock('latest')
                .then(function(res) {
                    blockHeight = res.number;

            controller.generateScore(blockHeight, address,blockHeightFixed, function (err, result) {
                if(err){return callback(err)}
                else{

                    if(result.tokens!==0){
                        //write to db as well

                        var dbQuery = {
                            address : address
                        };
                        var dbValues = {
                            $set: {
                                score : result.score,
                                block: result.block,
                                tokens : result.tokens
                            }
                        };
                        var dbOptions = {
                            upsert : true,
                            new: true //mongo uses returnNewDocument, mongo uses new
                        };
                        // console.log({
                        //     addrees: dbQuery.address,
                        //     dbValues: dbValues
                        // });
                        //should queue for writing later
                        var updateQuery = ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions);
                        //var countQuery = ParetoAddress.count({ score : { $gt : 0 } });

                        updateQuery.exec().then(function(r){
                            ParetoAddress.count({ score : { $gt : 0 } }, function(err, count){
                                if(err){
                                    console.error('unable to finish db operation because: ', err);
                                    if(callback && typeof callback === "function") { callback(err); }
                                }
                                else {
                                    if(r == null){
                                        if(callback && typeof callback === "function") { callback(ErrorHandler.nullResponseMessage); }
                                    } else {
                                        var resultJson = {
                                            'address' : r.address,
                                            'score' : r.score,
                                            'block' : result.block,
                                            'bonus' : result.bonus,
                                            'rank'  : r.rank,
                                            'totalRanks' : count,
                                            'tokens': r.tokens,
                                        };
                                        //console.log("here is db writing response : " + JSON.stringify(resultJson));

                                        if(callback && typeof callback === "function") { callback(null,resultJson); }
                                    }
                                }
                            }); //end count
                        }).catch(function(err){
                            console.error('unable to finish db operation because: ', err);
                            if(callback && typeof callback === "function") { callback(err); }
                        });
                    }else{
                        //update entry in database if it exists, do not put additional entry invar
                        dbQuery = {
                            address : address
                        };
                        var dbValues = {
                            $set: {
                                score : 0.0,
                                rank : -1,
                                block: result.block,
                                tokens: result.tokens
                            }
                        };
                        var dbOptions = {
                            upsert : false,
                            returnNewDocument: true
                        };



                        //User never has Pareto or User spent all pareto (if it is last one, update)
                        ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions,
                            function(err, r){
                                //c
                                callback(ErrorHandler.zeroParetoBalanceMessage)
                            } //end function
                        );
                    }

                }
            });
                }, function (error) {
                    callback(error);
                }).catch(function (err) {
                callback(err);
            }); //end promise related to block height
        } //end address validation
    }catch (e) {
        callback(e);
    }

};

controller.getParetoCoinMarket = function(callback){
    let url = 'https://pro-api.coinmarketcap.com/v1';

    request(url + '/cryptocurrency/quotes/latest?symbol=PARETO&convert=USD',
        {headers: {'x-cmc_pro_api_key': COIN_MARKET_API_KEY }},
        (error, res, body) => {
            console.log(COIN_MARKET_API_KEY);
            callback(error, JSON.parse(body));
        });
};

/**
 * This function will calculate the score based in the address and the current block height. Will be used by realAllScoreRank and by calculateScore
 */
controller.generateScore = async function (blockHeight, address, blockHeightFixed, callback) {
    //pad address +32 bits for web3 API
    var padding=66;
    var n = address.length;
    if(n!==padding)
    {
        var paddingLength = 66 - (n)
        var zeroes = "0";
        for (var i = 0; i < paddingLength-1; i++)
        {
            zeroes += "0";
        }
        var addressPadded = "0x" + zeroes + address.substring(2,n);
    }

    var txs = [];
    var incoming = {};
    var outgoing = {};

    //console.log(address);

    //this call doesn't use the padded address
    var tknAddress = (address).substring(2);
    var contractData = ('0x70a08231000000000000000000000000' + tknAddress);
    //then re-tally total
    return web3.eth.call({
        to: PARETO_CONTRACT_ADDRESS,
        data: contractData
    }).then(function(result) {
        var amount = 0;
        if (result) {
            var tokens = web3.utils.toBN(result).toString();
            amount = web3.utils.fromWei(tokens, 'ether');
            //console.log("amount: " + amount);
        }

        if(amount > 0){
            return web3.eth.getPastLogs({
                fromBlock: contractCreationBlockHeightHexString,
                toBlock: 'latest',
                address: PARETO_CONTRACT_ADDRESS,
                topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, addressPadded]
            }).then(function (txObjects){
                //console.log(txObjects);
                for(i = 0; i < txObjects.length; i++){

                    //these are hex values
                    //get data field, to hex, then from wei to ether
                    var data = txObjects[i].data;
                    var blockHex = txObjects[i].blockNumber;

                    var quantityWei = web3.utils.toBN(data, 16).toString();
                    var blockNumber = web3.utils.toBN(blockHex, 16).toString();
                    var quantityEth = web3.utils.fromWei(quantityWei, 'ether'); //takes a string.
                    //can be float
                    quantityEth = parseFloat(quantityEth);

                    //basically pushes
                    if(blockNumber in incoming)
                    {
                        incoming[blockNumber] = incoming[blockNumber] + quantityEth;
                    }
                    else {
                        incoming[blockNumber] = quantityEth;
                    }
                }

                return web3.eth.getPastLogs({
                    fromBlock: contractCreationBlockHeightHexString,
                    toBlock: 'latest',
                    address: PARETO_CONTRACT_ADDRESS,
                    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', addressPadded, null]
                }).then(function (txObjects){
                    //console.log(txObjects);
                    for(i = 0; i < txObjects.length; i++){

                        //these are hex values
                        //get data field, to hex, then from wei to ether
                        var data = txObjects[i].data;

                        var blockHex = txObjects[i].blockNumber;

                        var quantityWei = web3.utils.toBN(data, 16).toString();
                        var blockNumber = web3.utils.toBN(blockHex, 16).toString();

                        var quantityEth = web3.utils.fromWei(quantityWei, 'ether'); //takes a string.
                        //can be float
                        quantityEth = parseFloat(quantityEth);

                        //basically pushes
                        if(blockNumber in outgoing)
                        {
                            outgoing[blockNumber] = outgoing[blockNumber] + quantityEth;
                        }
                        else {
                            outgoing[blockNumber] = quantityEth;
                        }

                    }//end for

                    var transactions = Object.entries(incoming)
                        .concat(Object.entries(outgoing).map(([ts, val]) => ([ts, -val])))
                        .map(([ts, val]) => ([parseInt(ts), val]));
                    try {
                        //sort by default sort string data, in string 10 < 20
                        transactions = transactions.sort(function (a, b) {
                            return b[0]- a[0] === 0 ? b[1]- a[1] : b[0] - a[0];
                        });

                        try {
                            var i = 0;
                            var removableIndex = 0;
                            //sorts down to remaining transactions, since we already know the total and the system block height
                            while(i < transactions.length){
                                // Should allow zero too
                                if(transactions[i][1] <= 0 && i+1 < transactions.length /*&& transactions[i+1] !== 'undefined'*/){
                                    transactions[i+1][1] = transactions[i+1][1] + transactions[i][1];
                                    //console.log("current transaction[i][1] value: " + transactions[i][1]);
                                    if(transactions[0][1] <= 0){
                                        transactions.shift(); //or remove index 0
                                    } else {
                                        //remove first negative index after processing
                                        transactions.splice(removableIndex, 1);
                                    }
                                    //console.log("after shift current transaction[i][1] value: " + transactions[i][1]);
                                } else {
                                    //console.log(transactions[i][1]);
                                    transactions[i][2] = transactions[i][1]/amount; //adds decimal to the tuple
                                    transactions[i][3] = parseInt(transactions[i][0]) * transactions[i][2]; //weight of block
                                    if(i == 0){ //cumulative weight of block, so last index already has the value instead of needing to loop through again
                                        transactions[i][4] = transactions[i][3];
                                    } else {
                                        transactions[i][4] = transactions[i][3] + transactions[i-1][4];
                                    }
                                    i++;
                                    removableIndex = i;

                                }
                            } // end while
                            //console.log(transactions);
                            if(blockHeightFixed > 0){
                                blockHeight = blockHeightFixed;
                            }

                            //the transactions array generates: [block, remaining eligible amount, weight of block, cumulative weight of block, and cumulative weight + preior cumulative weight?

                            //console.log(transactions); //final transactions array state

                            //now find weighted average block number
                            var weightAverageBlockHeight = transactions[transactions.length-1][4];
                            var blockHeightDifference = blockHeight - weightAverageBlockHeight;
                            //console.log("weighted avg block height: " + weightAverageBlockHeight);
                            //console.log("weighted avg block height difference: " + blockHeightDifference);

                            //do final calculations for this stage.

                            //the problem with this is that this always increases and makes it hard for people to get a positive boost
                            //which is okay if the decimal is added to the total as well, but for everyone

                            //but multiple and divisor are both counting linearly, so some newcoming people will never get a boost, fix that.
                            var divisor =  Math.max((blockHeight - contractCreationBlockHeightInt),1)/100;

                            //console.log("divisor: " + divisor);

                            var multiple = 1 + (blockHeightDifference / divisor);
                            var score = amount * multiple;
                            var bonus = blockHeightDifference / divisor;


                         return  callback(null,{
                              score : score,
                              block: blockHeight,
                              tokens : amount,
                              bonus: bonus
                          } );


                        } catch (e) {
                            //console.log(e);
                            if(callback && typeof callback === "function") { callback(e); }
                        }


                    } catch (e) {
                        //console.log(e);
                        if(callback && typeof callback === "function") { callback(e); }
                    }

                }, function (error) {
                    callback(error);
                })//end second then promise
                    .catch(function (err) {
                        // API call failed...
                        //console.log(err);
                        if(callback && typeof callback === "function") { callback(err); }
                    });
            }, function (error) {
                callback(error);
            }).catch(function (err) {
                callback(err);
            });
            //end first then promise
        } else {

            callback(null,{
                score : 0.0,
                rank : -1,
                block: blockHeight,
                tokens: amount,
                bonus: 0
            } );

        } //end


    }, function (error) {
        callback(error);
    }).catch(function (err) {
        callback(err);
    });//end promise related to balance
}

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

/**
 * Watch Intel events. Support watch rewards for old Intel address
 */
controller.startwatchNewIntel = function(){
    const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    intel.events.NewIntel().on('data',  event => {
        try{
            const initialBalance = web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
            const expiry_time = event.returnValues.ttl;
            ParetoContent.update({ id: event.returnValues.intelID, validated: false }, {intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address, validated: true, reward: initialBalance, expires: expiry_time, block: event.blockNumber, txHash: event.transactionHash }, { multi: false }, function (err, data) {
                    if(controller.wss){
                        try{
                            controller.wss.clients.forEach(function each(client) {
                                if (client.isAlive === false) return client.terminate();
                                if (client.readyState === controller.WebSocket.OPEN ) {
                                    // Validate if the user is subscribed a set of information
                                    if(client.user){
                                        //console.log('updateContent');
                                        client.send(JSON.stringify(ErrorHandler.getSuccess({ action: 'updateContent'})) );
                                    }
                                }
                            });
                        }catch (e) {
                            console.log(e);
                        }
                    }else{
                        console.log('no wss')
                    }
            });
        }catch (e) {
            console.log(e);
        }

    }).on('error', err=>{
        console.log(err);
    });
    ParetoContent.find({ 'expires':{ $gt : Math.round(new Date().getTime() / 1000)}, 'validated': true }).distinct('intelAddress').exec(function(err, results) {
        if (err) {
            callback(err);
        }
        else {
            let data = results.filter(item => item.intelAddress === Intel_Contract_Schema.networks[ETH_NETWORK].address);
            if(!data.length){
                results = [{intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address}];
            }
            for (let i=0;i<results.length;i=i+1) {
                const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, results[i].intelAddress);
                intel.events.Reward({ fromBlock: 'latest' }).on('data',  event => {
                    try{
                        const rewardAmount = web3.utils.fromWei(event.returnValues.rewardAmount, 'ether');
                        const intelIndex = event.returnValues.intelIndex;
                        const sender = event.returnValues.sender;
                        console.log("Reward event listener", rewardAmount, intelIndex);
                        //Update rewardAmount on Content
                        ParetoContent.findOneAndUpdate({ id: intelIndex }, { $inc: { reward: rewardAmount } }, function (err, response) {if (err)console.log(err);});
                        //Update rewardReceived on Profile
                        ParetoContent.findOne({id:intelIndex}, (err, intel) => {
                            const {address} = intel;

                            ParetoProfile.findOne({address,'rewardsReceived.IntelID':intelIndex}, (err, profile) => {
                                if(profile == null){
                                    ParetoProfile.update({address},{$push:{ rewardsReceived: { IntelID:intelIndex, reward:rewardAmount }}}, (err, profile) => {
                                        // console.log("saved 1");
                                    })
                                    return;
                                }
                                ParetoProfile.update({address,'rewardsReceived.IntelID':intelIndex},{ $inc: {'rewardsReceived.$.reward': rewardAmount}}, (err, profle ) => {
                                    // console.log("update 1");
                                } )
                            })
                        })
                        //Update rewardGiven on Profile
                        ParetoProfile.findOne({address:sender.toLowerCase(),'rewardsGiven.IntelID':intelIndex}, (err, profile) => {
                            //console.log(err, profile);
                            if(profile == null){
                                ParetoProfile.update({address:sender.toLowerCase()},{$push:{ rewardsGiven: { IntelID:intelIndex, reward:rewardAmount }}}, (err, profile) => {
                                    // console.log("saved");
                                })
                                return;
                            }
                            ParetoProfile.update({address:sender.toLowerCase(),'rewardsGiven.IntelID':intelIndex},{ $inc: {'rewardsGiven.$.reward': rewardAmount}}, (err, profle ) => {
                                // console.log("update");
                            } )
                        })
                    }catch (e) {
                        console.log(e);
                    }

                }).on('error', err=>{
                    console.log(err);
                });

                intel.events.RewardDistributed({ fromBlock: 'latest' }).on('data',  event => {
                    try{
                        const intelIndex = event.returnValues.intelIndex;
                        ParetoContent.update({ id: intelIndex }, { distributed: true }, { multi: false }, function (err, response) { if (err)console.log(err);});
                    }catch (e) {
                        console.log(e);
                    }

                }).on('error', err=>{
                    console.log(err);
                });
            }

        }
    });

};

controller.updateFromLastIntel = function(){
    ParetoContent.aggregate([
        {
            $group: {
                _id: null,
                lastBlock: {$max: "$block"}
            }
        }
    ]).exec(function(err, results) {
        if (err) {
            callback(err);
        }
        else {
            if(results.length > 0){
                const lastBlock = results[0].lastBlock;
                const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
                intel.getPastEvents('NewIntel',{fromBlock: lastBlock-1, toBlock: 'latest'}, function (err, events) {
                    if(err){ console.log(err); return;}
                    for (let i=0;i<events.length;i=i+1){
                        try{
                            const event = events[i];
                            const initialBalance =  web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
                            const expiry_time = event.returnValues.ttl;
                            ParetoContent.update({ id: event.returnValues.intelID, validated: false }, {intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address, validated: true, reward: initialBalance, expires: expiry_time, block: event.blockNumber, txHash: event.transactionHash }, { multi: false }, function (err, data) {
                            });
                        }catch (e) {
                            console.log(e);
                        }
                    }

                })
            }
           
        }
    });
};

controller.getAllAvailableContent = function(req, callback) {

    var limit = parseInt(req.query.limit || 100);
    var page = parseInt(req.query.page || 0);

  //check if user, then return what the user is privy to see

  //check block number or block age, then retrieve all content after that block. add more limitations/filters later

  if(web3.utils.isAddress(req.user) == false){
    if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
  } else {
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
              ParetoAddress.count({ score : { $gte : 0 }}, async(count) => {
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
                var queryAboveCount = ParetoContent.count({block : { $gt : blockHeightDelta}});

                try{

                    allResults =    await ParetoContent.find(
                        { $or:[
                                {block : { $lte : blockHeightDelta*1 }, speed : 1,$or:[ {validated: true}, {intelAddress: { $exists: false }}]},
                                {block : { $lte : blockHeightDelta*50 }, speed : 2, $or:[ {validated: true}, {intelAddress: { $exists: false }}]},
                                {block : { $lte : blockHeightDelta*100 }, speed : 3, $or:[ {validated: true}, {intelAddress: { $exists: false }}]},
                                {block : { $lte : blockHeightDelta*150 }, speed : 4, $or:[ {validated: true}, {intelAddress: { $exists: false }}]},
                                {address : req.user, $or:[ {validated: true}, {intelAddress: { $exists: false }}] }
                            ]
                        }
                    ).sort({dateCreated : -1}).skip(page*limit).limit(limit).populate( 'createdBy' ).exec();
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
                                blockAgo: blockHeight - entry.block,
                                block: entry.block,
                                title: entry.title,
                                address: entry.address,
                                body: entry.body,
                                expires: entry.expires,
                                dateCreated: entry.dateCreated,
                                txHash: entry.txHash,
                                reward: entry.reward,
                                speed: entry.speed,
                                id:entry.id,
                                intelAddress: entry.intelAddress,
                                _v: entry._v,
                                createdBy: {
                                    address: entry.createdBy.address,
                                    firstName: entry.createdBy.firstName,
                                    lastName: entry.createdBy.lastName,
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
        if(userinfo.first_name) {profile.firstName = userinfo.first_name}
        if(userinfo.last_name) {profile.lastName = userinfo.last_name}
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
                controller.retrieveProfileWithRedis([address], function (error, profile) {
                    if(error){ callback(error)}
                    let ranking = rankings[0];
                    callback( null, { 'address': address,   'rank': ranking.rank, 'score': ranking.score, 'tokens': ranking.tokens,
                        'first_name': profile.firstName, "last_name": profile.lastName,
                        'biography': profile.biography, "profile_pic" : profile.profilePic } );
                });
            }

        });


    }

};


/**
 *  Based in the Address and the score equations, this function will calculate the weightedBlock and then recalculate the new score for a given delta.
 * @param delta how many blocks are passed from the last block
 * @param callback
 */
controller.getAproxScoreAddress = function(address, delta ,callback){
    controller.retrieveAddressRankWithRedis([address],true,function (error, rankings) {
        if(error){ callback(error)} else {
            //wieghtedBlock
            let ranking = rankings[0];
            const w = ranking.block - (ranking.score/ranking.tokens -1)*(ranking.block - contractCreationBlockHeightInt)/100;
            ranking.block = ranking.block + delta;
            const newScore = ranking.tokens*(1+((ranking.block - w)*100)/(ranking.block-contractCreationBlockHeightInt));
            ranking.score = newScore;
            callback(ranking);

        }
    });
}
/**
 * Based in a set of ranks (rank, limit, page) and the score equations, this function will calculate the weightedBlock and then recalculate the new score for a given delta.
 * @param delta how many blocks are passed from the last block
 * @param callback
 */
controller.getAproxScoreRanking = function(rank, limit, page, delta ,callback){
    controller.retrieveRanksAtAddress(rank, limit, page, function (err, result) {
        if (err) {
            callback(err)
        }  else {
            result = result.map( ranking => {
                //wieghtedBlock
                const w = ranking.block - (ranking.score/ranking.tokens -1)*(ranking.block - contractCreationBlockHeightInt)/100;
                ranking.block = ranking.block + delta;
                const newScore = ranking.tokens*(1+((ranking.block - w)*100)/(ranking.block-contractCreationBlockHeightInt));
                ranking.score = newScore;
                return ranking;
            });
            callback(result);
        }
    });
};

/**
 * This function will calculate the weightedBlock and then recalculate the new score for all address.
 * @param callback
 */
controller.aproxAllScoreRanking = async function(callback){

        web3.eth.getBlock('latest')
            .then(function(res) {
                const blockHeight = res.number;

                //Find all Address
                ParetoAddress.find({tokens: {$gt: 0}, block: {$gt: contractCreationBlockHeightInt}}, 'address score tokens block', { }, function(err, results){
                    if(err){
                        callback(err);
                    }
                    else {
                        const bulkop=[];
                        let len = results.length;
                        while (len--) {
                            const item= results[len];
                            const w = item.block - (item.score / item.tokens - 1) * (item.block - contractCreationBlockHeightInt) / 100;
                            var dbValues = {
                                    score : item.tokens * (1 + ((blockHeight - w) * 100) / (blockHeight - contractCreationBlockHeightInt)),
                                    block: blockHeight };
                                bulkop.push({updateOne:{ filter: {_id : item._id}, update: dbValues}});

                        }
                        if (bulkop.length > 0){
                            ParetoAddress.bulkWrite(bulkop).then(
                                function (r) {
                                    callback(null, {} );
                                }
                            ).catch(function (err) {
                                console.log(err);
                                callback(null, {} );
                            });
                        }


                    }

                });
            }, function (error) {
                console.log(error)
            }).catch(function (err) {
            console.log(err)
        });

}


/**
 * This function will calculate the real socre based in the last 7200 blocks (10 minuts aprox)
 * @param callback
 */
controller.realAllScoreRanking = async function(callback){

    web3.eth.getBlock('latest')
        .then(function(res) {
            const blockHeight = res.number;

            return web3.eth.getPastLogs({
                fromBlock: "0x" + ((blockHeight-7200).toString(16)),//'0x501331', //contractCreationBlockHeightHexString,
                toBlock: 'latest',
                address: PARETO_CONTRACT_ADDRESS,
                topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
            }).then(function (txObjects){


                const processData = async function () {
                    const addresses = {};

                    for(let i = 0; i < txObjects.length; i++){
                        addresses["0x" + txObjects[i].topics[1].substring(26)]=1;
                        addresses["0x" + txObjects[i].topics[2].substring(26)]=1;
                    }
                    const bulkop=[];
                    const arrayAddress = Object.keys(addresses);
                    console.log("address count here: " + arrayAddress.length);
                    for (let i=0; i< arrayAddress.length; i++){
                        const address = arrayAddress[i];
                        await controller.generateScore(blockHeight,address,0,function (err, result) {
                            if(!err && result.tokens > 0){
                                var dbValues = {
                                    bonus : result.bonus,
                                    tokens : result.tokens,
                                    score : result.score,
                                    block: result.block };
                                if(!isNaN(dbValues.score)){
                                    bulkop.push({updateOne:{ filter: {address : address}, update: dbValues}});
                                }
                            }
                        })
                    }
                    console.log("bulk count here: " + bulkop.length);
                    if (bulkop.length> 0){
                        ParetoAddress.bulkWrite(bulkop).then(
                            function (r) {
                                callback(null, {} );
                            }
                        ).catch(function (err) {
                            console.log(err);
                            callback(null, {} );
                        });
                    }

                }

                processData();

            }, function (error) {
                console.log(error)
            }).catch(function (err) {
                console.log(err)
            });

        }, function (error) {
            console.log(error)
        }).catch(function (err) {
        console.log(err)
    });

}

controller.getContentById = function(){

  //check if user, then check if the user is privy to see it



};

controller.getContentByCurrentUser = function(req, callback){
    const address = req.user;
    var limit = parseInt(req.query.limit || 100);
    var page = parseInt(req.query.page || 0);

  if(web3.utils.isAddress(address) == false){
    if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
  } else {
    var query = ParetoContent.find({address : address}).sort({dateCreated : -1}).skip(limit*page).limit(limit).populate( 'createdBy' );

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
                          blockAgo : blockHeight - entry.block,
                          block : entry.block,
                          address: entry.address,
                          title: entry.title,
                          body: entry.body,
                          dateCreated: entry.dateCreated,
                          txHash: entry.txHash,
                          reward: entry.reward,
                          speed: entry.speed,
                          expires: entry.expires,
                          validated: entry.validated,
                          intelAddress: entry.intelAddress,
                          _v: entry._v,
                          createdBy: {
                              address: entry.createdBy.address,
                              firstName: entry.createdBy.firstName,
                              lastName: entry.createdBy.lastName,
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


controller.updateScore = function(address, callback){
    //var results = { token: token };
    controller.calculateScore(address, 0, function(err, result){
        if(err){
            if(callback && typeof callback === "function") {
                callback(err);
            }
        } else {
            controller.getScoreAndSaveRedis(callback);

        }
    });
};

controller.sign = function(params, callback){

    if(!params.data || !params.data.length  || !params.data[0].value ){
        return callback(ErrorHandler.signatureFailedMessage)
    } else{


        let msgParams = {
            types: {
                EIP712Domain: [
                    { name: "Pareto",    type: "string"  },
                    { name: "version", type: "string"  },
                    { name: "chainId", type: "uint256" },
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
controller.retrieveRanksAtAddress = function(rank, limit, page, callback){
  controller.retrieveRanksWithRedis(rank, limit, page, true,callback)
};

/**
 *
 * *********** Functions with Redis ************
 *
 */


/**
 * Get the sorted score from MongoDB and indexing with rank. The result data is saved in Redis.
 * The function supposes that the address and the score is updated in MongoDB
 * @param callback Response when the process is finished
 */

controller.getScoreAndSaveRedis = function(callback){

  //get all address sorted by score, then grouping all by self and retrieve with ranking index
  const query = ParetoAddress.aggregate().sort({score : -1}).group(
    { "_id": false,
      "addresses": {
        "$push": {
          "address" : "$address",
          "score" : "$score",
            "block" : "$block",
            "tokens" : "$tokens"
        }
      }}).unwind({
    "path": "$addresses",
    "includeArrayIndex": "rank"
  });

  query.exec(function(err, results){
    if(err){
      callback(err);
    }
    else {
      // Put the data in  Redis hashing by rank
      const multi = redisClient.multi();
      results.forEach(function(result){
        result.addresses.rank = result.rank + 1;
        multi.hmset(result.addresses.rank+ "",  result.addresses);
        const rank = { rank: result.addresses.rank + ""};
        multi.hmset("address"+result.addresses.address+ "", rank );

      });

      multi.exec(function(errors, results) {
          if(errors){ console.log(errors)}
        if(callback && typeof callback === "function") { callback(null, {} ); }
      })




    }
  });
};



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
                  let profile = {address: r.address, firstName: r.firstName, lastName: r.lastName, biography: r.biography, profilePic: r.profilePic, rewardsGiven:[]};
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
               let profile = {address: address, firstName: r.firstName, lastName: r.lastName, biography: r.biography, profilePic: r.profilePic};
               const multi = redisClient.multi();
               multi.hmset("profile"+profile.address+ "", profile );
               multi.exec(function(errors, results) {
                   if(errors){ console.log(errors); callback(errors)}
                   return callback(null, profile );
               })
           } else{
              let profile = {address: address, firstName: "", lastName: "", biography: "", profilePic: "", rewardsGiven:[] };
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
      return  callback(null, results);
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

/*  Way to do all the ranking calculations
	1. cycle through each erc20 transfer eventget receiving address,
	2. check if its in the database (or pull all addresses from db first, and check for existence in array)
	3. optional - check that addresses' block height (for when it was last calculated), if it wasn't long ago then don't update it and let that user do it on their own volition, to save some processing
	4. run entire score promises chain
*/
controller.seedLatestEvents = function(){

  var blockHeight = 0;

  //get current blocknumber too
  web3.eth.getBlock('latest')
    .then(function(res) {
      blockHeight = res.number;
      console.log("blockheight: " + blockHeight);
      return web3.eth.getPastLogs({
        fromBlock: contractCreationBlockHeightHexString,//'0x501331', //contractCreationBlockHeightHexString,
        toBlock: 'latest',
        address: PARETO_CONTRACT_ADDRESS,
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
      }).then(function (txObjects){

        console.log("tx count here: " + txObjects.length);

        var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();

        for(i = 0; i < txObjects.length; i++){

          var dataA = "0x" + txObjects[i].topics[1].substring(26);
          var dataB = "0x" + txObjects[i].topics[2].substring(26); //destination, most likely current holder
          var score = 0.0;

          //get all addresses first and add to the collection where necessary

          bulk.find({address : dataB}).upsert().updateOne({
            $set : {
              address : dataB,
              score : score,
              block : blockHeight,
              tokens: 0.0,
              rank : -1
            }
          });

        }
        console.log("writing all events now");
        bulk.execute(function (err) {
            if(err){
                console.log(err);
            }else{
                controller.calculateAllScores(function(err, result){
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
            }

        });

      }, function (error) {
          console.log(error)
      }).catch(function (err) {
          console.log(err)
      });
    }, function (error) {
        console.log(error)
    }).catch(function (err) {
      console.log(err)
  });

};

controller.calculateAllScores = function(callback){

  console.log('addresses retrieval started');
    web3.eth.getBlock('latest')
        .then(function(res) {
            blockHeight = res.number;
              ParetoAddress.find({ score : {$eq: 0} }, 'address score', { /*limit : 10000*/ }, function(err, results){

            //Find all Address
             // ParetoAddress.find({}, 'address score', { /*limit : 10000*/ }, function(err, results){

                //ParetoAddress.find({ score : {$eq: 0} }, 'address score', { limit : 10000 }, function(err, results){
                if(err){
                  callback(err);
                }
                else {
                  //loop through and calculate scores and save them

                  async function processArray(results){

                    //console.log("processing addresses asynchronously");
                    for (const item of results) {
                      //console.log("item : " + item.address);
                      //possible optimization: initialize bulk here, push function into this, queue all results and bulk write later
                      await controller.calculateScore(item.address, blockHeight, function (err, result) {
                      });
                    }

                    if(callback && typeof callback === "function") { callback(null, {} ); }
                  }

                  processArray(results);

                  //console.log('addresses updating method finished');
                }

              });
        }, function (error) {
            console.log(error)
        }).catch(function (err) {
        console.log(err)
    });

};



/* Given the complete set of scores,
   rank them from highest to lowest
   (just the sort() command and looping through all, adding the current i to each object's rank)
   get db.address.find().sort()
*/
controller.calculateAllRanks = function(callback){
  //console.log("updating ranks begun");
  //-1 desc where greatest number to smallest number, 1 asc for smallest number to greatest number, limit just for testing
  var query = ParetoAddress.find().sort({score : -1});

  query.exec(function(err, results){
    if(err){
      callback(err);
    }
    else {
      //console.log("updating ranks finished querying with results.length : " + results.length);
      if(callback && typeof callback === "function") { callback(null, {} ); }

      //console.log(results);

      var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();
      var i = 1;
      results.forEach(function(result){
        bulk.find({ address : result.address }).updateOne({
          $set : { rank : i }
        });
        //console.log("updating : " + result.address);

        i++;
      });
      bulk.execute(function (err) {
        //optional logic here
        //console.log("updating ranks finished");
      });
    }
  });
};

/*
* Set all rank to -1, nullifying them
*/

controller.resetRanks = function(callback){
  //console.log("resetting ranks begun");
  ParetoAddress.find({}, function(err, results) {
    if(err){
      callback(err);
    }
    else {
      //console.log("resetting ranks finished querying");
      if(callback && typeof callback === "function") { callback(null, {} ); }

      var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();
      var i = 1;
      results.forEach(function(result){
        bulk.find({ address : result.address }).updateOne({
          $set : { rank : -1 }
        });

        i++;
      });
      bulk.execute(function (err) {
        //optional logic here
        //console.log("resetting ranks finished");
      });


    }
  });
};


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