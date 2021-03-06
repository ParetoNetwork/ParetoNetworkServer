const https = require('https');
const request = require('request');
const kue  = require ('kue');
var workerController = module.exports = {};
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
/*ways of writing contract creation block height*/
//const CONTRACT_CREATION_BLOCK_HEX = '0x4B9696'; //need this in hex
const CONTRACT_CREATION_BLOCK_HEX = process.env.CONTRACT_CREATION_BLOCK_HEX;  //need this in hex
//const CONTRACT_CREATION_BLOCK_INT = 4953750;
const CONTRACT_CREATION_BLOCK_INT = process.env.CONTRACT_CREATION_BLOCK_INT;
const EXPONENT_BLOCK_AGO = process.env.EXPONENT_BLOCK_AGO;
const START_CLOCK = process.env.START_CLOCK || 1;
const MIN_DELTA_SCORE = process.env.MIN_DELTA_SCORE || 0.00001;
const REDIS_URL = process.env.REDIS_URL  || constants.REDIS_URL;
const SCORE_BLOCK_AGO = process.env.SCORE_BLOCK_AGO  || 200;
const modelsPath = path.resolve(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
    require(modelsPath + '/' + file);
});


/**
 * Redis Initialization
 */
const redis = require("redis");
redisClient = redis.createClient(
    REDIS_URL
);
redisClient.on("connect", function () {
    console.log("PARETO: Success connecting to Redis on worker");
});
redisClient.on("error", function (err) {
    console.log("PARETO: Problems connecting to Redis on worker"+ err );
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

workerController.startW3WebSocket = function () {
    web3_events_provider.on('connect', function () {
        //console.log('WS web3 connected on worker');
    });

    web3_events_provider.on('end', e => {
        //console.log('WS web3 closed on worker');
        //console.log('Attempting to reconnect... on worker');
        web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
        web3_events = new Web3(web3_events_provider);
        workerController.startW3WebSocket()
    });
};

/**
 *
 * Db Initialization
 */

const mongoose = require('mongoose');
//var models = require('./models/address');
mongoose.connect(CONNECTION_URL, {useUnifiedTopology: true, useNewUrlParser: true }).then(tmp=>{
    web3_events_provider =  new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
    web3_events  = new Web3(web3_events_provider);
    workerController.startW3WebSocket();
    console.log("PARETO: Success connecting to Mongo on worker ")
}).catch(err=>{
    console.log("PARETO: Problems connecting to Mongo on worker: "+err)
});


/*db model initializations*/
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const ParetoAddress = mongoose.model('address');
const ParetoIntel = mongoose.model('intel.js');
const ParetoReward = mongoose.model('reward');
const ParetoTransaction = mongoose.model('transaction');
const ParetoPayment = mongoose.model('payment');


// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require(process.env.ETH_NETWORK == 1 ? "../build/contracts/Intel-mainnet.json" : "../build/contracts/Intel-ropsten.json"); //1 is mainnet, 3 is ropsten

var sigUtil = require('eth-sig-util');
var jwt = require('jsonwebtoken');


module.exports.mongoose = mongoose;
module.exports.redisClient = redisClient;

workerController.endConnections= function(){
    mongoose.connection.close();
    redisClient.end(true);
}



const dbName = 'pareto';

/*system constants*/
const PARETO_SCORE_MINIMUM 					=			100000;  	//minimum score to get intel
const PARETO_RANK_GRANULARIZED_LIMIT 		= 			10; 		//how far down to go through ranks until separating by tiers

const ErrorHandler = require('./utils/error-handler.js');

workerController.calculateScore = async function(address, blockHeightFixed, callback){
    //Web3 can throw error
    try{
        address = address.toLowerCase();

        var blockHeight = 0;

        var rankCalculation = 0;

        if(web3.utils.isAddress(address) == false){
            if(callback && typeof callback === "function") {
                const error = ErrorHandler.backendErrorList('b7');
                error.address = address;
                callback(error);
            }
        } else {

            //ethereum servers suck, give them 5ms to breath
            await new Promise(r => setTimeout(() => r(), 5));
            //get current blocknumber too
            web3.eth.getBlock('latest')
                .then(function(res) {
                    blockHeight = res.number;

                    workerController.generateScore(blockHeight, address,blockHeightFixed, async function (err, result) {
                        if(err){return callback(err)}
                        else{

                            if(result.tokens!==0){
                                const desiredRewards = await ParetoIntel.find({block: {$gte: blockHeight - EXPONENT_BLOCK_AGO*2}});
                                workerController.addExponent([address],[result],blockHeight,desiredRewards, function (err, results){

                                    if(err){return callback(err)}
                                    else {
                                        const result = results[0];
                                        //write to db as well

                                        var dbQuery = {
                                            address: address
                                        };
                                        var dbValues = {
                                            $set: {
                                                score: result.score,
                                                block: result.block,
                                                bonus: result.bonus,
                                                tokens: result.tokens
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
                                            ParetoAddress.countDocuments({score: {$gt: 0}}, function (err, count) {
                                                if (err) {
                                                    console.error('unable to finish db operation because: ', err);
                                                    if (callback && typeof callback === "function") {
                                                        callback(err);
                                                    }
                                                }
                                                else {
                                                    if (r == null) {
                                                        if (callback && typeof callback === "function") {
                                                            callback(ErrorHandler.nullResponseMessage);
                                                        }
                                                    } else {
                                                        var resultJson = {
                                                            'address': r.address,
                                                            'score': r.score,
                                                            'block': result.block,
                                                            'bonus': result.bonus,
                                                            'rank': r.rank,
                                                            'totalRanks': count,
                                                            'tokens': r.tokens,
                                                        };
                                                        //console.log("here is db writing response : " + JSON.stringify(resultJson));

                                                        if (callback && typeof callback === "function") {
                                                            callback(null, resultJson);
                                                        }
                                                    }
                                                }
                                            }); //end count
                                        }).catch(function (err) {
                                            console.error('unable to finish db operation because: ', err);
                                            if (callback && typeof callback === "function") {
                                                callback(err);
                                            }
                                        });
                                    }
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
                                        bonus: 0,
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
                                        const error = ErrorHandler.backendErrorList('b7');
                                        error.address = address;
                                        callback(error);
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



/**
 *  addExponent using db instead of Ethereum network
 */

workerController.addExponent = async function(addresses, scores, blockHeight, desiredRewards,callback){

    let promises =[];
    let intelDesiredRewards = desiredRewards.reduce(function (data, it) {
         data[""+it.id] = it;
        return data;
    }, {});
    return ParetoIntel.find({'validated': true }).distinct('intelAddress').exec(function(err, results) {
        if (err) {
            callback(err);
        }
        else {
            let data = results.filter(item => item === Intel_Contract_Schema.networks[ETH_NETWORK].address);
            if (!data.length) {
                results = results.push(Intel_Contract_Schema.networks[ETH_NETWORK].address);
            }
            for (let i = 0; i < results.length; i = i + 1) {
                try{
                    const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, results[i]);
                    promises.push(intel.getPastEvents('Reward', {
                        fromBlock: "0x" + ((blockHeight-EXPONENT_BLOCK_AGO).toString(16)) ,
                        toBlock: 'latest'
                    }))
                }catch (e) { console.log(e) }
            }
            return Promise.all(promises).then(values => {
                let lessRewards={};
                let distincIntel = {};
                let total=0;
                for (let i = 0; i < values.length; i = i + 1) {
                    total=total+values[i].length;
                    for (let j = 0; j < values[i].length; j = j + 1) {
                        try{
                            const sender = values[i][j].returnValues.sender.toLowerCase();
                            const block =  parseFloat(values[i][j].blockNumber);
                            const amount = parseFloat(web3.utils.fromWei(values[i][j].returnValues.rewardAmount, 'ether'));
                            const intelIndex = values[i][j].returnValues.intelIndex+"";
                            distincIntel[intelIndex] = 1;
                            if(!lessRewards[sender]){
                                lessRewards[sender]  = {};
                                lessRewards[sender][intelIndex] = { block,amount };
                            }
                            if(!lessRewards[sender][intelIndex]){
                                lessRewards[sender][intelIndex] = { block,amount };
                            }
                            if(block < lessRewards[sender][intelIndex].block  ){
                                lessRewards[sender][intelIndex] = { block,amount };
                            }
                        }catch (e) { console.log(e) }
                    }
                }
                let totalDesired =Object.keys(distincIntel).length;
                for (let i = 0; i < addresses.length; i = i + 1) {
                    try{
                        const address = addresses[i].toLowerCase();
                        if (lessRewards[address] && scores[i].bonus > 0 && scores[i].tokens > 0) {
                            let intels = Object.keys(lessRewards[address]);
                            let rewards =   intels.reduce(function (reward, it) {
                                return reward +  Math.min(lessRewards[address][it].amount/intelDesiredRewards[it].reward,2 );
                            }, 0);

                            const V = (1 + (rewards / (2*totalDesired)) );
                            scores[i].score = parseFloat(Decimal(parseFloat(scores[i].tokens)).mul(Decimal(parseFloat(scores[i].bonus)).pow(V)));
                        }
                    }catch (e) { console.log(e) }

                }
                return callback(null, scores);

            }).catch(e=>{
                callback(e, null)
            });
        }
    })
};


/**
 * This function will calculate the score based in the address and the current block height. Will be used by realAllScoreRank and by calculateScore
 */
workerController.generateScore = async function (blockHeight, address, blockHeightFixed, callback) {
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
    }).then(async function(result) {
        var amount = 0;
        if (result) {
            var tokens = web3.utils.toBN(result).toString();
            amount = web3.utils.fromWei(tokens, 'ether');
            //console.log("amount: " + amount);
        }
        let deposit = null;
        let payment = null;
        try{
            deposit = await ParetoTransaction.findOne({address: address, event: 'deposited'}).exec();
            payment = await ParetoPayment.findOne({address: address, state: 2}).exec();
        }catch (e) { }

        if(amount > 0 || deposit || payment){
            return web3.eth.getPastLogs({
                fromBlock: CONTRACT_CREATION_BLOCK_HEX,
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
                    quantityEth = Decimal(quantityEth);

                    //basically pushes
                    if(blockNumber in incoming)
                    {
                        incoming[blockNumber] = incoming[blockNumber].add(quantityEth);
                    }
                    else {
                        incoming[blockNumber] =  quantityEth;
                    }
                }

                return web3.eth.getPastLogs({
                    fromBlock: CONTRACT_CREATION_BLOCK_HEX,
                    toBlock: 'latest',
                    address: PARETO_CONTRACT_ADDRESS,
                    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', addressPadded, null]
                }).then(async function (txObjects){
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
                        quantityEth = Decimal(quantityEth);
                        //basically pushes
                        if(blockNumber in outgoing)
                        {
                            outgoing[blockNumber] = outgoing[blockNumber].add(quantityEth);
                        }
                        else {
                            outgoing[blockNumber] = quantityEth;
                        }

                    }//end for
                    try{
                        const depositTransactions = await ParetoTransaction.find({address: address, event: 'deposited'});
                        if(depositTransactions.length){
                            txObjects = txObjects.filter(it=> !depositTransactions.includes( it.transactionHash) );
                        }
                    }catch (e) {
                        const error = ErrorHandler.backendErrorList('b27');
                        error.systemMessage = e;
                        error.address = address;
                        console.log(error);
                    }
                    try{
                        const transactionHash = txObjects.map(it=>{return it.transactionHash});
                        const rewardDeposit = Object.values( (await ParetoReward.find({sender: address, txHash: { $nin: transactionHash }}).exec()).reduce(
                            (data, item, index)=>{
                                data[item.txHash] =item;
                                return data;
                            }
                        ,{}));
                        for(i = 0; i < rewardDeposit.length; i++){
                            blockNumber = rewardDeposit[i].block+ "";
                            quantityEth = Decimal(rewardDeposit[i].amount + "");
                            if(blockNumber in outgoing)
                            {
                                outgoing[blockNumber] = outgoing[blockNumber].add(quantityEth);
                            }
                            else {
                                outgoing[blockNumber] = quantityEth;
                            }
                        }
                    }catch (e) {
                        const error = ErrorHandler.backendErrorList('b25');
                        error.systemMessage = e;
                        error.address = address;
                        console.log(error);
                    }

                    var transactions = Object.entries(incoming)
                        .concat(Object.entries(outgoing).map(([ts, val]) => ([ts, val.mul(Decimal(-1))])))
                        .map(([ts, val]) => ([Decimal(ts), val]));
                    try {
                        //sort by default sort string data, in string 10 < 20
                        transactions = transactions.sort(function (a, b) {
                            return parseFloat(b[0].sub(a[0]))  === 0 ?  parseFloat(b[1].sub( a[1]))  :  parseFloat(b[0].sub(a[0]));
                        });

                        try {
                            var i = 0;
                            var removableIndex = 0;
                            //sorts down to remaining transactions, since we already know the total and the system block height

                            let amountBn = Decimal(amount);
                            try{
                                const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
                                const intelBalance  = await intel.methods
                                    .getParetoBalance(address).call();
                                const intelBalanceEther = web3.utils.fromWei(intelBalance.toString(), 'ether');
                                amount = parseFloat(amount) + parseFloat(intelBalanceEther);
                                amountBn = Decimal(amount.toString());
                            }catch (e) {
                                const error = ErrorHandler.backendErrorList('b24');
                                error.systemMessage = e;
                                error.address = address;
                                console.log(error);
                            }

                            while(i < transactions.length){
                                // Should allow zero too
                                if(parseFloat(transactions[i][1] ) <= 0 && i+1 < transactions.length /*&& transactions[i+1] !== 'undefined'*/){
                                    transactions[i+1][1] = transactions[i+1][1].add(transactions[i][1]);
                                    //console.log("current transaction[i][1] value: " + transactions[i][1]);
                                    if(parseFloat(transactions[0][1] ) <= 0){
                                        transactions.shift(); //or remove index 0
                                    } else {
                                        //remove first negative index after processing
                                        transactions.splice(removableIndex, 1);
                                    }
                                    //console.log("after shift current transaction[i][1] value: " + transactions[i][1]);
                                } else {
                                    //console.log(transactions[i][1]);
                                    transactions[i][2] = transactions[i][1].div(amountBn); //adds decimal to the tuple
                                    transactions[i][3] = transactions[i][0].mul(transactions[i][2]); //weight of block
                                    if(i == 0){ //cumulative weight of block, so last index already has the value instead of needing to loop through again
                                        transactions[i][4] = transactions[i][3];
                                    } else {
                                        transactions[i][4] = transactions[i][3].add(transactions[i-1][4]) ;
                                    }
                                    i++;
                                    removableIndex = i;

                                }
                            } // end while
                            //console.log(transactions);
                            if(blockHeightFixed > 0){
                                blockHeight = blockHeightFixed;
                            }

                            const blockHeightBn = Decimal(blockHeight);
                            const hBn = Decimal(100);
                            const oneBn = Decimal(1);
                            const contractBn = Decimal(CONTRACT_CREATION_BLOCK_INT);
                            //the transactions array generates: [block, remaining eligible amount, weight of block, cumulative weight of block, and cumulative weight + preior cumulative weight?

                            //console.log(transactions); //final transactions array state

                            //now find weighted average block number
                            var weightAverageBlockHeight = transactions[transactions.length-1][4];
                            var blockHeightDifference = blockHeightBn.sub(weightAverageBlockHeight);
                            //console.log("weighted avg block height: " + weightAverageBlockHeight);
                            //console.log("weighted avg block height difference: " + blockHeightDifference);

                            //do final calculations for this stage.

                            //the problem with this is that this always increases and makes it hard for people to get a positive boost
                            //which is okay if the decimal is added to the total as well, but for everyone

                            //but multiple and divisor are both counting linearly, so some newcoming people will never get a boost, fix that.
                            var divisor = Decimal( Math.max(parseFloat(blockHeightBn.sub(contractBn)),1)).div(hBn);

                            var multiple =  (blockHeightDifference.div(divisor));

                            //need to understand what multiple is, or can be
                            console.log("multiple = (blockHeightDifference.div(divisor)): " + multiple + "for address: " + address);

                            if(multiple < 1 && multiple >= 0){
                                multiple = multiple.add(1);
                            }
                            else if(multiple > -1 && multiple <= 0){
                                multiple = multiple.sub(1);
                            }



                            var score = parseFloat(amountBn.mul(multiple)); //if multiple is less than 1, make it at least 1. ie 0.4 = 1.4



                            var bonus = parseFloat(blockHeightDifference.div(divisor)) ;


                            return  callback(null,{
                                score : score,
                                block: blockHeight,
                                tokens : amount,
                                bonus: bonus
                            } );


                        } catch (e) {
                            //console.log(e);
                            if(callback && typeof callback === "function")
                            {
                                const error = ErrorHandler.backendErrorList('b8');
                                error.systemMessage = e;
                                error.address = address;
                                callback(error);
                            }
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
                const err = ErrorHandler.backendErrorList('b8');
                err.systemMessage = error;
                err.address = address;

                callback(err);
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

workerController.getBalance = async function(address, blockHeightFixed, callback){

    address = address.toLowerCase();

    var blockHeight = 0;

    if(web3.utils.isAddress(address) == false){
        if(callback && typeof callback === "function") {
            const error = ErrorHandler.backendErrorList('b6');
            error.address = address;
            callback(error);
        }
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

                        const error = ErrorHandler.backendErrorList('b7');
                        error.address = address;
                        callback(error);

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

workerController.retrieveAddress = function(address, callback){

    var address = address;
    address = address.toLowerCase();

    if(web3.utils.isAddress(address) == false){
        if(callback && typeof callback === "function") {
            const error = ErrorHandler.backendErrorList('b6');
            error.address = address;
            callback(error);
        }
    } else {
        workerController.retrieveAddressRankWithRedis([address],true,function (error, results) {
            if(error) {callback(error)}
            else { callback(null, results[0])}
        });
    }

};

workerController.retrieveAddresses = function(addresses, callback){
    workerController.retrieveAddressRankWithRedis(addresses,true,function (error, results) {
        if(error) {callback(error)}
        else { callback(null, results)}
    });
};

/**
 * This function will calculate the weightedBlock and then recalculate the new score for all address.
 * @param callback
 */
workerController.aproxAllScoreRanking = async function(callback){
    web3.eth.getBlock('latest')
        .then(function(res) {
            const blockHeight = res.number;
            //Find all Address
            ParetoAddress.find({tokens: {$gt: 0}, block: {$gt: CONTRACT_CREATION_BLOCK_INT}}, 'address score tokens block bonus', function(err, results){
                if(err){
                    callback(null, {} );
                }
                else {
                    const bulkop=[];
                    let len = results.length;
                    const contractBn = Decimal(CONTRACT_CREATION_BLOCK_INT);
                    const hBn = Decimal(100);
                    const oneBn = Decimal(1);
                    const blockHeightBn = Decimal(blockHeight);
                    while (len--) {
                        const item=  {
                            block:  Decimal(results[len].block),
                            score:  Decimal(Math.abs(results[len].score) || 0),
                            bonus:  Decimal(Math.abs(results[len].bonus) || ((results[len].tokens === 0)? 0:(Math.abs(results[len].score)/results[len].tokens)) ),
                            tokens:  Decimal(results[len].tokens || 0),
                        } ;
                        if(parseFloat(item.tokens)>0 && parseFloat(item.bonus.logarithm()) !=0) {
                            var divisor = Decimal( Math.max(parseFloat(item.block.sub(contractBn)),1)).div(hBn);

                            const w = item.block.sub(item.bonus.mul(divisor));
                            const new_numerator =   (blockHeightBn.sub(w));
                            const new_divisor =    Decimal( Math.max(parseFloat(blockHeightBn.sub(contractBn)),1)).div(hBn);
                            const new_V = item.score.div(item.tokens).logarithm().div(item.bonus.logarithm());
                            var dbValues = {
                                bonus: parseFloat(new_numerator.div(new_divisor)),
                                score : parseFloat(item.tokens.mul( (new_numerator.div(new_divisor)).pow(new_V) )),
                                block: blockHeight };
                            bulkop.push({updateOne:{ filter: {_id : results[len]._id}, update: dbValues}});
                        }
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
                    }else{
                        callback(null, {} );
                    }


                }

            });
            ParetoTransaction.find({ $or: [ {status: 0}, {status: 2} ]}, function (err, results) {
                results.forEach( data =>{
                    if(data.status == 0){
                        web3.eth.getTransactionReceipt(data.txHash, function (err, receipt) {
                            if(receipt){
                                ParetoTransaction.findOneAndUpdate({ txHash: data.txHash, status: 0}, {status: (data.event == 'distribute')? 3:1 }, { multi: false }, function (err, r) {
                                    if(data.event != 'distribute' && r){
                                        ParetoAddress.findOneAndUpdate({address: r.address}, {lastApprovedAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address}, function (err, r) {});
                                    }else{

                                        if(data.event == 'distribute' && r){
                                            ParetoIntel.findOneAndUpdate({id: r.intel}, { distributed: true, txHashDistribute: data.txHash}, function (err, r) {})
                                        }

                                    }
                                });
                            }
                        });
                    } else{
                        if (data.txRewardHash && data.status ==2){
                            web3.eth.getTransactionReceipt(data.txRewardHash, function (err, receipt) {
                                if(receipt){
                                    ParetoTransaction.findOneAndUpdate({ txRewardHash: data.txRewardHash, status: 2}, {status: 3}, { multi: false }, function (err, data) {
                                    });
                                }

                            });
                            web3.eth.getTransactionReceipt(data.txHash, function (err, receipt) {
                                if(receipt){
                                    ParetoTransaction.findOneAndUpdate({ txRewardHash: data.txRewardHash, status: 2}, {status: 3}, { multi: false }, function (err, data) {
                                    });
                                }

                            });
                        }
                    }
                })


            })

        }, function (error) {
            console.log(error);
            callback(null, {} );
        }).catch(function (err) {
        console.log(err);
        callback(null, {} );
    });

}


workerController.processData = async function (txObjects, address, blockHeight, callback) {
    const bulkop=[];
    const scores=[];
    const addressesExponent=[];
    let arrayAddress = [];
    if(!address){
        const addresses = {};
        for(let i = 0; i < txObjects.length; i++){
            addresses["0x" + txObjects[i].topics[1].substring(26)]=1;
            addresses["0x" + txObjects[i].topics[2].substring(26)]=1;
        }
        arrayAddress = Object.keys(addresses);

    }else{
        arrayAddress = [address];
    }
    console.log("address count here: " + arrayAddress.length);
    let errors = null;
    for (let i=0; i< arrayAddress.length; i++){
        const address = arrayAddress[i];
        await workerController.generateScore(blockHeight,address,0,function (err, result) {
            if(!err ){
                if (result.tokens == 0) {
                    result.score = 0;
                }
                scores.push(result);
                addressesExponent.push(address);
            }else{
                errors = err;
            }
        })
    }
    const desiredRewards = await ParetoIntel.find({block: {$gte: blockHeight - EXPONENT_BLOCK_AGO*2}});
    await workerController.addExponent(addressesExponent, scores, blockHeight,desiredRewards, function (err, results) {
        if(!err ){

            for (let t=0; t<results.length; t=t+1){
                let result = results[t];
                var dbValues = {
                    bonus : result.bonus,
                    tokens : result.tokens,
                    score : result.score,
                    block: result.block };
                if(!isNaN(dbValues.score)){
                    bulkop.push({updateOne:{ filter: {address : addressesExponent[t]}, update: dbValues}});
                }
            }
            console.log("bulk count here: " + bulkop.length);
            if (bulkop.length> 0){
                ParetoAddress.bulkWrite(bulkop).then(
                    function (r) {

                        callback(null, {lastBlock: blockHeight} );
                    }
                ).catch(function (err) {
                    callback({message: "Could not write"}, {} );
                });
            }else{
                callback(errors, {lastBlock: blockHeight} );
            }
        }else{
            callback(err, {} );
        }

    });


};

/**
 * This function will calculate the real socre based in the last 7200 blocks (10 minuts aprox)
 * @param callback
 */
workerController.realAllScoreRanking = async function(callback){
    const multi = redisClient.multi();
    multi.hgetall("lastBlock");
    multi.exec((err, data)=>{
        web3.eth.getBlock('latest')
            .then(function(res) {
                const blockHeight = res.number;
                let CURRENT_SCORE_BLOCK_AGO = (data && data.length && data[0] && data[0].block && !isNaN(parseInt(data[0].block)))? data[0].block : (blockHeight-SCORE_BLOCK_AGO);
                try{
                    workerController.updateFromLastIntel(CURRENT_SCORE_BLOCK_AGO);
                }catch (e) {
                    const error = ErrorHandler.backendErrorList('b21');
                    error.systemMessage = e.message? e.message: e;
                    console.log(JSON.stringify(error));
                }
                return web3.eth.getPastLogs({
                    fromBlock: web3.utils.toHex(CURRENT_SCORE_BLOCK_AGO),//'0x501331', //CONTRACT_CREATION_BLOCK_HEX,
                    toBlock: 'latest',
                    address: PARETO_CONTRACT_ADDRESS,
                    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
                }).then(function (txObjects){
                    workerController.processData(txObjects, null,blockHeight, callback);
                }, function (error) {
                    callback(error, {} );
                }).catch(function (err) {
                    callback(err, {} );
                });

            }, function (error) {
                callback(error, {} );
            }).catch(function (err) {
            callback(err, {} );
        });
    });

}


workerController.updateScore = function(address, callback){
    //var results = { token: token };
    workerController.calculateScore(address, 0, function(err, result){
        if(err){
            if(callback && typeof callback === "function") {
                callback(err);
            }
        } else {
            workerController.getScoreAndSaveRedis(callback);

        }
    });
};

/**
 * Get the sorted score from MongoDB and indexing with rank. The result data is saved in historical mongo document
 * @param callback Response when the process is finished
 */

workerController.getScoreAndSaveSnapshot = function(callback){

    const date = new Date();
    date.setHours(0,0,0,0);
    console.log('Snapshot at '+date.toISOString());
           const query = ParetoAddress.aggregate().sort({score : -1}).group(
               { "_id": false,
                   "addresses": {
                       "$push": {
                           "address" : "$address",
                           "score" : "$score"
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

                   let COUNT = 25.0;
                   const avr = parseFloat(results.length)/COUNT;
                   let ini = 0.0;
                   let promises = [];

                   while (ini < results.length-1){
                       try{
                           const bulkop = [];
                           for (let j = parseInt(ini); j< parseInt((ini + avr)); j=j+1){
                               let data =  {} ;
                               data.lastRank =  results[j].rank + 1;
                               data.lastScore =  results[j].addresses.score;

                               bulkop.push({updateOne:{ filter: {address : results[j].addresses.address}, update: data}});

                           }
                           promises.add(ParetoAddress.bulkWrite(bulkop));
                       }catch (e) {

                       }
                       ini = ini + avr;
                   }

                   Promise.all(promises).then(values => {
                       callback(null, 'snapshot' );
                   }).catch(err=>{
                       console.log(err);
                       callback(null, 'snapshot' );
                   });

               }
           });

};


/*
* Retrieves rank around address
*/
workerController.retrieveRanksAtAddress = function(rank, limit, page, callback){
    workerController.retrieveRanksWithRedis(rank, limit, page, true,callback)
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

workerController.getScoreAndSaveRedis = function(callback){
    //get all address sorted by score, then grouping all by self and retrieve with ranking index
    Promise.all([ParetoAddress.find({score: { $lte: 0}}) ,ParetoAddress.aggregate().match({score: { $gt: 0}}).sort({score : -1}).group(
        { "_id": false,
            "addresses": {
                "$push": {
                    "address" : "$address",
                    "score" : "$score",
                    "block" : "$block",
                    "lastScore" : "$lastScore",
                    "lastRank" : "$lastRank",
                    "lastApprovedAddress" : "$lastApprovedAddress",
                    "tokens" : "$tokens"
                }
            }}).unwind({
        "path": "$addresses",
        "includeArrayIndex": "rank"
    }).exec()]).then(values => {
        let results =  values[1];
        let deleteAddress =  [];
        if(values[0].length > 0){
            deleteAddress =  values[0].map( d=> {return d.address});
        }
        let COUNT = 20.0;
        let maxRank =(results[results.length-1].rank? results[results.length-1].rank : 0)+2;
        const avr = parseFloat(results.length)/COUNT;
        const total = (avr<=1)?results.length:results.length-1;
        let ini = 0.0;
        let promises = [];
        while (ini < total){
            const multi = redisClient.multi();
            for (let j = parseInt(ini); j< parseInt((ini + avr)); j=j+1){
                let result = results[j];
                const data = {
                    address : result.addresses.address,
                    score : result.addresses.score,
                    block : result.addresses.block? result.addresses.block: 0,
                    tokens : result.addresses.tokens
                };
                if(result.addresses.lastApprovedAddress){
                    data.approved = result.addresses.lastApprovedAddress;
                }else{
                    data.approved = '';
                }
                data.rank = result.rank + 1;
                data.lscore = '=';
                data.lrank = '=';
                if(result.addresses.lastRank > 0 && result.addresses.lastScore > 0){
                    const lrank = (data.rank - result.addresses.lastRank);
                    const lscore = (result.addresses.score - result.addresses.lastScore);
                    data.lrank = (lrank > 0)? '+':((lrank < 0)? '-': '=');
                    let min_delta = MIN_DELTA_SCORE;
                    if(!isNaN(parseFloat(result.addresses.lastScore))){
                        min_delta = parseFloat(Decimal(parseFloat(MIN_DELTA_SCORE)).mul(Decimal(parseFloat(result.addresses.lastScore))));
                    }

                    data.lscore = (lscore > 0 && lscore > min_delta)? '+':((lscore < 0)? '-': '=');
                }
                multi.hmset(data.rank+ "",  data);
                const rank = { rank: data.rank + ""};
                multi.hmset("address"+data.address+ "", rank );
            }
            multi.hmset("maxRank", {rank: maxRank} );
            multi.hmset("minScore", {score: results[ Math.max(Math.floor(maxRank*0.15),0)].addresses.score} );
            promises.push(new Promise( (resolve, reject)=>{
                multi.exec(function(errors, results) {
                    if(errors){
                        return reject(errors)
                    }else{
                        return resolve(results)
                    }
                })
            } ));

            ini = ini + avr;
        }

        let delkeys =[];
        if(deleteAddress.length > 0){
            for (let i=maxRank;i<maxRank+deleteAddress.length;i=i+1){
                delkeys.push(""+i);
            }
        }
        delkeys.concat(deleteAddress);
        redisClient.del( delkeys,function (err, succeeded) {
            Promise.all(promises).then(values => {
                if(callback && typeof callback === "function") { callback(null, {} ); }
            }).catch(err=>{
                console.log(err);
                if(callback && typeof callback === "function") { callback(null, {} ); }
            });

        });

    }).catch(err=>{
        console.log(err);
        if(callback && typeof callback === "function") { callback(null, {} ); }
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
workerController.retrieveRanksWithRedis = function(rank, limit, page, attempts, callback){

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
            workerController.getScoreAndSaveRedis(function(err, result){
                if(err){
                    return callback(err);
                } else {
                    workerController.retrieveRanksWithRedis(rank, limit, page,false ,callback);
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
workerController.retrieveAddressRankWithRedis = function(addressess, attempts, callback){

    const multi = redisClient.multi();
    for (let i = 0; i<addressess.length; i=i+1){
        multi.hgetall("address"+addressess[i]);
    }
    multi.exec(function(err, results) {
        if(err){
            return callback(err);
        }
        if((!results || results.length ===0 || (!results[0] && results.length ===1)) && attempts){
            workerController.getScoreAndSaveRedis(function(err, result){
                if(err){
                    return callback(err);
                } else {
                    workerController.retrieveAddressRankWithRedis(addressess ,false,callback);
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

workerController.updateTransactionByNonce = function (txHash, sender, status, event, intel,amount, block){
    web3.eth.getTransaction(txHash).then(function (txObject){
        const nonce = txObject.nonce;
        const toUpdate = {
            status: status,
            txRewardHash: txHash,
            address: sender,
            nonce: nonce,
            amount: amount,
            block: block,
            txHash: txHash,
            event: event,
        }
        if(intel){ toUpdate.intel= intel; }
        ParetoTransaction.findOneAndUpdate(
            {  $or: [{txHash: txHash},
                    { address: sender, nonce: nonce}]}, toUpdate,{upsert: true, new: true}).then(values => {
        }).catch(e => {
            const error = ErrorHandler.backendErrorList('b23');
            error.systemMessage = e.message? e.message: e;
            console.log(JSON.stringify(error));
        });
    }).catch(function (err) {console.log(err)  });
};

workerController.updateFromLastIntel =  function(lastBlock){
    const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
    intel.getPastEvents('NewIntel',{fromBlock: lastBlock-1, toBlock: 'latest'}, function (err, events) {
        // console.log(events);
        if(err){ console.log(err); return;}
        for (let i=0;i<events.length;i=i+1){
            try{
                const event = events[i];
                const initialBalance =  web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
                const expiry_time = event.returnValues.ttl;
                ParetoIntel.findOneAndUpdate({ id: event.returnValues.intelID, validated: false }, {intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address, validated: true, reward: initialBalance, expires: expiry_time, block: event.blockNumber, txHash: event.transactionHash }, { multi: false }, function (err, data) {
                });
                const txHash = event.transactionHash;
                const block = event.blockNumber;
                const sender = event.returnValues.intelProvider.toLowerCase();
                workerController.updateTransactionByNonce(txHash, sender,3, 'create',parseInt(event.returnValues.intelID),initialBalance, block);
            }catch (e) {
                const error = ErrorHandler.backendErrorList('b18');
                error.systemMessage = e.message? e.message: e;
                console.log(JSON.stringify(error));
            }
        }

    });
    intel.getPastEvents('Reward',{fromBlock: lastBlock-1, toBlock: 'latest'}, function (err, events) {
        // console.log(events);
        if(err){ console.log(err); return;}
        for (let i=0;i<events.length;i=i+1){
            try{
                const event = events[i];
                const txHash = event.transactionHash;
                const amount =  parseFloat(web3.utils.fromWei(event.returnValues.rewardAmount, 'ether'));
                const sender = event.returnValues.sender.toLowerCase();
                const block = event.blockNumber;
                workerController.updateTransactionByNonce(txHash, sender,3, 'reward',parseInt(event.returnValues.intelIndex),amount, block);
            }catch (e) {
                const error = ErrorHandler.backendErrorList('b19');
                error.systemMessage = e.message? e.message: e;
                console.log(JSON.stringify(error));
            }
        }

    });
    intel.getPastEvents('RewardDistributed',{fromBlock: lastBlock-1, toBlock: 'latest'}, function (err, events) {
        // console.log(events);
        if(err){ console.log(err); return;}
        for (let i=0;i<events.length;i=i+1){
            try{
                const event = events[i];
                const txHash = event.transactionHash;
                const sender = event.returnValues.distributor.toLowerCase();
                const amount =  parseFloat(web3.utils.fromWei(event.returnValues.provider_amount, 'ether'));
                const block = event.blockNumber;
                workerController.updateTransactionByNonce(txHash, sender,3,'distribute',parseInt(event.returnValues.intelIndex),amount, block);
            }catch (e) {
                const error = ErrorHandler.backendErrorList('b21');
                error.systemMessage = e.message? e.message: e;
                console.log(JSON.stringify(error));
            }
        }

    });
    intel.getPastEvents('Deposited',{fromBlock: lastBlock-1, toBlock: 'latest'},async function (err, events) {
        // console.log(events);
        if(err){ console.log(err); return;}
        for (let i=0;i<events.length;i=i+1){
            try{
                const event = events[i];
                const txHash = event.transactionHash;
                const sender = event.returnValues.from.toLowerCase();
                const amount =  parseFloat(web3.utils.fromWei(event.returnValues.amount, 'ether'));
                const block = event.blockNumber;
                workerController.updateTransactionByNonce(txHash, sender,3,'deposited',0,amount, block);
                try{
                    const payment =  await ParetoPayment.findOneAndUpdate({address: sender, processed: false, txHash: txHash, state: 2},{processed: true}).exec();
                } catch (e) { console.log(e)}
            }catch (e) {
                const error = ErrorHandler.backendErrorList('b21');
                error.systemMessage = e.message? e.message: e;
                console.log(JSON.stringify(error));
            }
        }

    });


};


const start = async () => {
    try {
        const queue = kue.createQueue({
            redis: REDIS_URL,
        });
        queue.process('clock-job-aprox', (job, done) => {
            workerController.aproxAllScoreRanking(function(err, result){
                if(err){
                    done(err );
                }else{
                    workerController.getScoreAndSaveRedis(function(err, result){
                        if(err){
                            done(err);
                        }else{
                            done(null, 'Sucessfully updated aprox');
                        }

                    });
                }

            });
        });

        queue.process('clock-job-score', 4, (job, done) => {
            workerController.realAllScoreRanking(function(err, resultScore){
                if(err){
                    done(err );
                }else{
                    workerController.getScoreAndSaveRedis(function(err, result){
                        if(err){
                            done(err );
                        }else{
                            if (resultScore.lastBlock){
                                const multi = redisClient.multi();
                                multi.hmset("lastBlock", {block: resultScore.lastBlock} );
                                multi.exec(function(e, r) {});
                            }
                            done(null, 'Sucessfully updated');
                        }

                    });
                }

            });
        });


        queue.process('clock-job-snapshot',  (job, done) => {
            workerController.getScoreAndSaveSnapshot(done);
        });

        queue.process('controller-job-save', 3, (job, done) => {
            if(job.data.address){
                console.log('force calculate real score ' + job.data.address);
                web3.eth.getBlock('latest')
                    .then(function (res) {
                        workerController.processData(null, job.data.address, res.number, function (err, result) {
                            workerController.getScoreAndSaveRedis (function(err, result){
                                if(err){
                                    done(err );
                                }else{
                                    done(null, result);
                                }

                            });
                        })
                    })
                    .catch(e =>{
                        done(e );
                    });
            } else{
                workerController.getScoreAndSaveRedis (function(err, result){
                    if(err){
                        done(err );
                    }else{
                        done(null, result);
                    }

                });
            }

        });

        queue.process('controller-job-score', 2, (job, done) => {
            workerController.updateScore(job.data.address, function (err, result) {
                if (err) {
                    done(err);
                } else {
                    done(null, result);
                }

            });
        });

        if(START_CLOCK==1){
            const clock = require('./clock.js');
            //require("./schedule_distribute");

            clock.start(queue);
        }
    } catch (error) {
        console.log(error);
    }
};
start();