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
var connectionUrl = process.env.MONGODB_URI || constants.MONGODB_URI;
var paretoContractAddress = process.env.CRED_PARETOCONTRACT || constants.CRED_PARETOCONTRACT;



const modelsPath = path.resolve(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
  require(modelsPath + '/' + file);
});

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


/*db initialization*/
const mongoose = require('mongoose');
//var models = require('./models/address');
mongoose.connect(connectionUrl).then(tmp=>{
  console.log("PARETO: Success connecting to Mongo ")
}).catch(err=>{
  console.log("PARETO: Problems connecting to Mongo: "+err)
});





/*db model initializations*/
const ParetoAddress = mongoose.model('address');
const ParetoContent = mongoose.model('content');
const ParetoProfile = mongoose.model('profile');

var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("https://internally-settling-racer.quiknode.io/b5d97fc4-1946-4411-87e1-c7d961fb0e8d/X2kLtRMEBbjEkSJCCK8hFA==/")); //"https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i"

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
const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightInt = 4953750;

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

            //ethereum servers suck, give them 5ms to breath
            await new Promise(r => setTimeout(() => r(), 5));
            //get current blocknumber too
            web3.eth.getBlock('latest')
                .then(function(res) {

                    blockHeight = res.number;
                    //console.log("blockheight: " + blockHeight);

                    //then re-tally total
                    return web3.eth.call({
                        to: paretoContractAddress,
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
                                address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
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
                                    address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
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

                                                if(transactions[i][1] < 0 && i+1 < transactions.length /*&& transactions[i+1] !== 'undefined'*/){
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
                                            var divisor = (blockHeight - contractCreationBlockHeightInt)/100;

                                            //console.log("divisor: " + divisor);

                                            var multiple = 1 + (blockHeightDifference / divisor);

                                            var score = amount * multiple;
                                            var bonus = blockHeightDifference / divisor;

                                            //write to db as well

                                            var dbQuery = {
                                                address : address
                                            };
                                            var dbValues = {
                                                $set: {
                                                    score : score,
                                                    block: blockHeight,
                                                    tokens : amount
                                                }
                                            };
                                            var dbOptions = {
                                                upsert : true,
                                                new: true //mongo uses returnNewDocument, mongo uses new
                                            };

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
                                                                'block' : blockHeight,
                                                                'bonus' : bonus,
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

                            //update entry in database if it exists, do not put additional entry invar
                            dbQuery = {
                                address : address
                            };
                            var dbValues = {
                                $set: {
                                    score : 0.0,
                                    rank : -1,
                                    block: blockHeight,
                                    tokens: amount
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

                        } //end


                    }, function (error) {
                        callback(error);
                    }).catch(function (err) {
                        callback(err);
                    });//end promise related to balance
                }, function (error) {
                    callback(error);
                }).catch(function (err) {
                callback(err);
            }); //end promise related to block height
        } //end address validation
    }catch (e) {
        console.log(e);
        callback(e);
    }

};

controller.getBalance = async function(address, blockHeightFixed, callback){

    address = address.toLowerCase();

    var blockHeight = 0;

    var rankCalculation = 0;

    if(web3.utils.isAddress(address) == false){
        if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
    } else {

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

        //ethereum servers suck, give them 5ms to breath
        await new Promise(r => setTimeout(() => r(), 5));
        //get current blocknumber too
        web3.eth.getBlock('latest')
            .then(function(res) {
                blockHeight = res.number;
                //console.log("blockheight: " + blockHeight);

                //then re-tally total
                return web3.eth.call({
                    to: paretoContractAddress,
                    data: contractData
                }).then(function(result) {
                    var amount = 0;
                    if (result) {
                        var tokens = web3.utils.toBN(result).toString();
                        amount = web3.utils.fromWei(tokens, 'ether');
                        //console.log("amount: " + amount);
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

controller.postContent = function(req, callback){

  var body = req.body;

  //exposed endpoint to write content to database
  if(web3.utils.isAddress(req.user) == false){
    if(callback && typeof callback === "function") { callback(ErrorHandler.invalidAddressMessage); }
  } else {

    web3.eth.getBlock('latest')
      .then(function(res) {

        body.address = req.user;
        body.dateCreated = Date.now();
        body.block = res.number;
        body.txHash = req.body.txHash || '0x0'; //this is done client side to cause an internal invocation
        body.speed = 3; //1 is very fast speed, 2 is fast, 3 is normal, medium speed, 4 is very slow speed for long applicable swing trades
        body.reward =  req.body.reward || 1;

        /*

        * This may actually need a placeholder of txhash beforehand, and update the entry, needs state of tx like txconfirmed. or the system can just check when trying to access content?

        */

        const paretoContentObj = new ParetoContent(body);
        paretoContentObj.save(function(err, obj){
          if(err){
            if(callback && typeof callback === "function") { callback(err); }
          }
          else {
            if(callback && typeof callback === "function") { callback(null, obj); }
          }
        });

      }, function (error) {
          callback(error);
      }).catch(function (err) {
        callback(err);
    }); //end web3
  } // end else

};


controller.getAllAvailableContent = function(req, callback) {

    var limit = parseInt(req.query.limit);
    var page = parseInt(req.query.page);

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

                var queryVeryFast = ParetoContent.find({block : { $lte : blockHeightDelta*1 }, speed : 1}).sort({block : -1}).populate( 'createdBy' );
                var queryFast = ParetoContent.find({block : { $lte : blockHeightDelta*50 }, speed : 2}).sort({block : -1}).populate( 'createdBy' );
                var queryNormal = ParetoContent.find({block : { $lte : blockHeightDelta*100 }, speed : 3}).sort({block : -1}).populate( 'createdBy' );
                var querySlow = ParetoContent.find({block : { $lte : blockHeightDelta*150 }, speed : 4}).sort({block : -1}).populate( 'createdBy' );

                //stop gap solution, more censored content can come down and be manipulated before posting client side
                var queryAboveCount = ParetoContent.count({block : { $gt : blockHeightDelta}});

                try{
                  let resultsVeryFast = await queryVeryFast.exec();
                  let resultsFast = await queryFast.exec();
                  let resultsNormal = await queryNormal.exec();
                  let resultsSlow = await querySlow.exec();

                  let allResults = [];

                  resultsVeryFast.forEach(function(entry){
                    allResults.push(entry);
                  });

                  resultsFast.forEach(function(entry){
                    allResults.push(entry);
                  });

                  resultsNormal.forEach(function(entry){
                    allResults.push(entry);
                  });

                  resultsSlow.forEach(function(entry){
                    allResults.push(entry);
                  });

                  //inline function to sort results by newest block
                  function compare(a, b) {
                    const blockA = a.block;
                    const blockB = b.block;

                    let comparison = 0;
                    if (blockB > blockA) {
                      comparison = 1;
                    } else if (blockB < blockA) {
                      comparison = -1;
                    }
                    return comparison;
                  }

                  //sort results
                  allResults = allResults.sort(compare);
                    let newResults = [];
                    let i = 0;
                    allResults.forEach(function(entry){
                        /*

                         currently: force use of limit to keep json response smaller.
                         limit isn't used earlier so that redis knows the full result,
                         and because the queries for each speed of content are separate

                         future: server should already have an idea of what content any user can see,
                         since it knows their latest scores and the current block height. therefore the full content response can be queried at once, perhaps, and pages can be done fictionally

                         */
                        if(i < limit) {
                            let data = {
                                _id: entry._id,
                                blockAgo: blockHeight - entry.block,
                                title: entry.title,
                                address: entry.address,
                                body: entry.body,
                                dateCreated: entry.dateCreated,
                                txHash: entry.txHash,
                                reward: entry.reward,
                                speed: entry.speed,
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
                            i++;
                        } // end if
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
      controller.retrieveAddressRankWithRedis(address,true,callback);
  }

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
        controller.retrieveAddressRankWithRedis(address,true,function (error, ranking) {
            if(error){ callback(error)}
            controller.retrieveProfileWithRedis(address, function (error, profile) {
                if(error){ callback(error)}
                callback( null, { 'address': address,   'rank': ranking.rank, 'score': ranking.score, 'tokens': ranking.tokens,
                    'first_name': profile.firstName, "last_name": profile.lastName,
                    'biography': profile.biography, "profile_pic" : profile.profilePic } );
            });
        });


    }

};

controller.getContentById = function(){

  //check if user, then check if the user is privy to see it



};

controller.getContentByCurrentUser = function(address, callback){

  if(web3.utils.isAddress(address) == false){
    if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
  } else {
    var query = ParetoContent.find({address : address}).sort({block : -1}).populate( 'createdBy' );

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

  const owner = params.owner;
    const recovered2 = sigUtil.recoverPersonalSignature({ data: params.data[0].value, sig: params.result });
  const recovered = sigUtil.recoverTypedSignature({ data: params.data, sig: params.result });

  if (recovered === owner || recovered2 === owner ) {
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
                  let profile = {address: r.address, firstName: r.firstName, lastName: r.lastName, biography: r.biography, profilePic: r.profilePic};
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
              let profile = {address: address, firstName: "", lastName: "", biography: "", profilePic: "" };
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
controller.retrieveAddressRankWithRedis = function(address, attempts, callback){

    const multi = redisClient.multi();
    multi.hgetall("address"+address);
    multi.exec(function(err, results) {
        if(err){
            return callback(err);
        }
        if((!results || results.length ===0 || !results[0]) && attempts){
            controller.getScoreAndSaveRedis(function(err, result){
                if(err){
                    return callback(err);
                } else {
                    controller.retrieveAddressRankWithRedis(address ,false,callback);
                }
            });
        }else{
          if((!results || results.length ===0 || !results[0])){
              // hopefully, users without pareto shouldn't get here now.
              callback("We are sorry, you will need Pareto balance in order to be able to Sign In.")
          }else{
              const multi = redisClient.multi();
              multi.hgetall(results[0].rank+ "");
              multi.exec(function(err, results) {
                  if(err){
                      return callback(err);
                  }
                  // return the cached ranking
                  return callback(null, results[0]);
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
controller.seedLatestEvents = function(fres){

  var blockHeight = 0;

  //get current blocknumber too
  web3.eth.getBlock('latest')
    .then(function(res) {
      blockHeight = res.number;
      //console.log("blockheight: " + blockHeight);

      return web3.eth.getPastLogs({
        fromBlock: contractCreationBlockHeightHexString,//'0x501331', //contractCreationBlockHeightHexString,
        toBlock: 'latest',
        address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
      }).then(function (txObjects){

        //console.log("tx count here: " + txObjects.length);

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
        //console.log("writing all events now");
        bulk.execute(function (err) {

          controller.calculateAllScores(function(err, result){

            if(err){}

            //controller.calculateAllRanks();

          });

        });

        fres.status(200).json({status:"success"});

      }); // end events
    }); // end block height

};

controller.calculateAllScores = function(callback){

  //console.log('addresses retrieval started');

  web3.eth.getBlock('latest')
    .then(function(res) {
      blockHeight = res.number;
      //console.log("blockheight: " + blockHeight);


      ParetoAddress.find({ score : {$eq: 0} }, 'address score', { /*limit : 10000*/ }, function(err, results){
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
              await controller.calculateScore(item.address, blockHeight);
            }

            if(callback && typeof callback === "function") { callback(null, {} ); }
          }

          processArray(results);

          //console.log('addresses updating method finished');
        }

      });
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