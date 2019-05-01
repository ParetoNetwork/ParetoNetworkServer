
const https = require('https');
const request = require('request');
const kue = require('kue');
var controller = module.exports = {};
const Decimal = require('decimal.js-light');
const fs = require('fs');
const path = require('path');
const ErrorHandler = require('./utils/error-handler.js');

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21
});

let constants = {};
const constantsPath = path.resolve(__dirname, 'backend-private-constants.json');

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
const PROVISIONAL_EMAIL = process.env.PROVISIONAL_EMAIL
const REDIS_URL = process.env.REDIS_URL || constants.REDIS_URL;
const queue = kue.createQueue({
  redis: REDIS_URL,
});
const modelsPath = path.resolve(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(file => {
  require(modelsPath + '/' + file);
});

let intelController =null;
let userController =null;

/**
 * Redis Initialization
 */
const redis = require("redis");
redisClient = redis.createClient(REDIS_URL, {no_ready_check: true});

redisClient.on("connect", function () {
  console.log("PARETO: Success connecting to Redis ")
});
redisClient.on("error", function (e) {
  const error = ErrorHandler.backendErrorList('b17');
  error.systemMessage = e.message ? e.message : e;
  console.log(JSON.stringify(error));
});

//stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || constants.STRIPE_SECRET_KEY;
const stripe = require("stripe")(STRIPE_SECRET_KEY);

/**
 * Web3 Initialization
 */
var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider("https://sealer.giveth.io:40404/"));
// var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"));
var web3 = new Web3(new Web3.providers.HttpProvider(WEB3_URL));
var web3_events_provider = null;
var web3_events = null;



/**
 *
 * Db Initialization
 */

const mongoose = require('mongoose');
/*db model initializations*/
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const ParetoAddress = mongoose.model('address');
const ParetoContent = mongoose.model('content');
const ParetoProfile = mongoose.model('profile');
const ParetoPayment = mongoose.model('payment');
const ParetoReward = mongoose.model('reward');
const ParetoAsset = mongoose.model('asset');
const ParetoTransaction = mongoose.model('transaction');
const Intel_Contract_Schema = require("../build/contracts/Intel.json");
var sigUtil = require('eth-sig-util');
var jwt = require('jsonwebtoken');


mongoose.connect(CONNECTION_URL, {useNewUrlParser: true}).then(tmp => {
  web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
  web3_events = new Web3(web3_events_provider);
  controller.startW3WebSocket();
  intelController = require('./db/intel')(
        mongoose,
        controller,
        web3,
        web3_events_provider,
        web3_events,
        Intel_Contract_Schema,
        ParetoAddress,
        ParetoContent,
        ParetoProfile,
        ParetoPayment,
        ParetoReward,
        ParetoAsset,
        ParetoTransaction,
        ErrorHandler,
        ETH_NETWORK,
        PARETO_CONTRACT_ADDRESS

    );
    userController = require('./db/user')(
        mongoose,
        controller,
        web3,
        web3_events_provider,
        web3_events,
        Intel_Contract_Schema,
        ParetoAddress,
        ParetoContent,
        ParetoProfile,
        ParetoPayment,
        ParetoReward,
        ParetoAsset,
        ParetoTransaction,
        ErrorHandler,
        ETH_NETWORK,
        PARETO_CONTRACT_ADDRESS

    );
  console.log("PARETO: Success connecting to Mongo ")
}).catch(err => {
  const error = ErrorHandler.backendErrorList('b15');
  error.systemMessage = err.message ? err.message : err;
  console.log(JSON.stringify(error));
});


controller.startW3WebSocket = function () {
    web3_events_provider.on('connect', function () {
        //console.log('WS web3 connected');
        const ethereumWatcher = require('./ethereum/ethereum-watcher')(
            controller,
            Web3,
            web3,
            web3_events_provider,
            web3_events,
            Intel_Contract_Schema,
            ParetoAddress,
            ParetoContent,
            ParetoProfile,
            ParetoPayment,
            ParetoReward,
            ParetoAsset,
            ParetoTransaction,
            ErrorHandler,
            ETH_NETWORK,
            PARETO_CONTRACT_ADDRESS,
            WEB3_WEBSOCKET_URL
        );
        ethereumWatcher.startwatchIntel();
    });

    web3_events_provider.on('end', e => {
        //console.log('WS web3 closed');
        //console.log('Attempting to reconnect...');
        const error = ErrorHandler.backendErrorList('b17');
        error.systemMessage = e.message ? e.message : e;
        console.log(JSON.stringify(error));
        web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
        web3_events = new Web3(web3_events_provider);
        controller.startW3WebSocket()
    });
};


module.exports.mongoose = mongoose;
module.exports.redisClient = redisClient;

controller.endConnections = function () {
  mongoose.connection.close();
  redisClient.end(true);
}



controller.getParetoCoinMarket = function (callback) {
  let url = 'https://pro-api.coinmarketcap.com/v1';

  request(url + '/cryptocurrency/quotes/latest?symbol=PARETO&convert=USD',
    {
        headers: {'x-cmc_pro_api_key': COIN_MARKET_API_KEY }
    },
    (error, res, body) => {
      callback(error, JSON.parse(body));
    });
};



/**
 * For now is a dummy purchase
 * @param address the new Created address front enfd.
 * @param callback
 */
controller.transactionFlow= async function(address, order_id, callback){
    const ETH_DEPOSIT = parseFloat(process.env.ETH_DEPOSIT);
    ParetoPayment.findOne({order_id: order_id, processed: false}).exec().then(function (payment) {
        if(payment){
            if(payment.state > 0){
                controller.getParetoCoinMarket((err, result)=>{
                    const paretoAmount = payment.amount/result.data.PARETO.quote.USD.price;
                    callback(null,{amount: paretoAmount, eth: ETH_DEPOSIT});
                })
            }else{
                 ParetoPayment.findOneAndUpdate({order_id: order_id, processed: false}, {address: address, state: 1}).exec().then(function (r) {
                     controller.getParetoCoinMarket((err, result)=>{
                         if(err){
                             ParetoPayment.findOneAndUpdate({order_id: order_id, processed: false}, {state: 0}).exec().then((r)=>{});
                           return  callback(err);
                         }
                         const paretoAmount = payment.amount/result.data.PARETO.quote.USD.price;
                         const ethereumWallet = require('./ethereum/ethereum-wallet')(
                             Web3,
                             WEB3_WEBSOCKET_URL,
                             web3,
                             ParetoPayment,
                             ETH_NETWORK);
                         ethereumWallet.makeTransaction(address, paretoAmount, ETH_DEPOSIT,(err, result)=>{
                             if(err){
                                 ParetoPayment.findOneAndUpdate({order_id: order_id, processed: false}, {state: 0}).exec().then((r)=>{});
                               return   callback(err);
                             }
                             ParetoPayment.findOneAndUpdate({order_id: order_id, processed: false}, {state: 2, oracleTxHash: result.hash, paretoAmount: result.amount}).exec().then((r)=>{});
                             callback(null, result);
                         });
                     })
                }).catch(function (e) {
                    callback(e)
                });

            }

        }else{
            callback(null,{amount: 0, eth: 0})
        }

    }).catch(function (e) {
        callback(e)
    });

}


controller.updateTransaction = function (body, callback) {

    const data = {
        txHash: body.txHash
    };
    const find = {
        $or: [{order_id: body.order_id}, {address: body.address}],
        processed: false
    };
    if (body.processed) {
        data.processed = true;
    }
    ParetoPayment.findOneAndUpdate(find, data).exec().then((r) => {
        callback(null, r);
    }).catch(err => {
        callback(null, err);
    });
}


controller.getOrder = async function (order_id, callback){
    try{
        const order  = await ParetoPayment.findOne({order_id: order_id, processed: false}).exec();
        if(order){
            callback(null, order);
        }else{
            callback({});
        }
    }catch (e) {
        callback(e);
    }

}

controller.SendInfoWebsocket = function (data) {
    if (controller.wss) {
        controller.wss.clients.forEach(function each(client) {
            try {
                if (client.isAlive === false) return client.terminate();
                if (client.readyState === controller.WebSocket.OPEN) {
                    // Validate if the user is subscribed a set of information
                    client.send(JSON.stringify(ErrorHandler.getSuccess({action: 'updateContent'})));
                    if (client.user && client.user.user == data.address) {
                        controller.retrieveAddress(client.user.user, function (err, result) {
                            if (!err) {
                                if (client.readyState === controller.WebSocket.OPEN && client.isAlive) {
                                    client.send(JSON.stringify(ErrorHandler.getSuccess(result)));
                                }
                            }
                        });

                        if (data.transaction) {
                            client.send(JSON.stringify(ErrorHandler.getSuccess({
                                action: 'updateHash',
                                data: data.transaction
                            })));
                        } else {

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
                                    if (client.readyState === controller.WebSocket.OPEN && client.isAlive) {
                                        client.send(JSON.stringify(ErrorHandler.getSuccess(result)));
                                    }
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                const error = ErrorHandler.backendErrorList('b14');
                error.systemMessage = e.message ? e.message : e;
                console.log(JSON.stringify(error));
            }
        });
    }

}

controller.getBalance = async function (address, blockHeightFixed, callback) {

  address = address.toLowerCase();

  var blockHeight = 0;

  if (web3.utils.isAddress(address) == false) {
    if (callback && typeof callback === "function") {
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
      .then(function (res) {
        blockHeight = res.number;
        //console.log("blockheight: " + blockHeight);

        //then re-tally total
        return web3.eth.call({
          to: PARETO_CONTRACT_ADDRESS,
          data: contractData
        }).then(async function (result) {
          var amount = 0;
          if (result) {
            var tokens = web3.utils.toBN(result).toString();
            amount = web3.utils.fromWei(tokens, 'ether');
            // console.log("amount: " + amount);
          }
         let deposit = null;
         let payment = null;
         try{
            deposit = await ParetoTransaction.findOne({address: address, event: 'deposited'}).exec();
             payment = await ParetoPayment.findOne({address: address, state: 2}).exec();
         }catch (e) { }
          if (amount > 0 || deposit || payment) {
            callback(null, amount)
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




/**
 *  addExponent using db instead of Ethereum network
 */
controller.addExponentAprox =  function (addresses, scores, blockHeight, callback) {
  return ParetoReward.find({'block': {'$gte': (blockHeight - EXPONENT_BLOCK_AGO)}}).exec(async function (err, values) {
      const desiredRewards = await ParetoContent.find({block: {$gte: blockHeight - EXPONENT_BLOCK_AGO*2}});
      let intelDesiredRewards = desiredRewards.reduce(function (data, it) {
          data[""+it.id] = it;
          return data;
      }, {});
    if (err) {
      callback(err);
    } else {
      let lessRewards = {};
      let distincIntel = {};
      for (let j = 0; j < values.length; j = j + 1) {
        try {
          const sender = values[j].sender.toLowerCase();
          const block =  parseFloat(values[j].block);
          const amount = parseFloat(values[j].amount);
          const intelIndex = values[j].intelId;
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
        } catch (e) {
          console.log(e)
        }
      }
        let totalDesired =Object.keys(distincIntel).length;
    for (let i = 0; i < addresses.length; i = i + 1) {
        try {
            const address = addresses[i].toLowerCase();
            if (lessRewards[address] && scores[i].bonus > 0 && scores[i].tokens > 0) {
                let intels = Object.keys(lessRewards[address]);
                let rewards =   intels.reduce(function (reward, it) {
                    return reward +  Math.min(lessRewards[address][it].amount/intelDesiredRewards[it].reward,2 );
                }, 0);

                const V = (1 + (rewards / (2*totalDesired)));
                scores[i].score = parseFloat(Decimal(parseFloat(scores[i].tokens)).mul(Decimal(parseFloat(scores[i].bonus)).pow(V)));
              } else {
                scores[i].score = 0;
              }
        } catch (e) {
          console.log(e)
        }

      }
      return callback(null, scores);
    }
  })
};


/**
 *
 *  User Services
 */


controller.retrieveAddress = function (address, callback) {
    userController.retrieveAddress(address, callback);
};

controller.retrieveAddresses = function (addresses, callback) {
    userController.retrieveAddresses(addresses, callback);
};

controller.updateUser = async function (address, userinfo, callback) {
    userController.updateUser(address,userinfo , callback);
};

controller.getUserInfo = async function (address, callback) {
    userController.getUserInfo(address, callback);
};


/**
 * Intel Services
 */


controller.getAssets = async function (callback){
     intelController.getAssets(callback);
};

controller.getAllAvailableContent = async function (req, callback) {
   await intelController.getAllAvailableContent(req, callback);
};

controller.getContentByIntel = function (req, intel, callback) {
      intelController.getContentByIntel (req, intel, callback);
};

controller.getContentByCurrentUser = async function (req, callback) {
    intelController.getContentByCurrentUser (req, callback);
};

controller.postContent = function (req, callback) {
    intelController.postContent(req, callback);
};

controller.getTransaction = function (data, callback) {
    intelController.getTransaction(data, callback);
};

controller.watchTransaction = function (data, callback) {
    intelController.watchTransaction(data, callback);
}


/**
 * Worker Services
 */
controller.updateScore = function (address, callback) {
  try {
    const job = queue
      .create('controller-job-score', {
        type: 'update',
        address: address
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

  } catch (e) {
    callback(e);
  }

};

controller.getScoreAndSaveRedis = function (address, callback) {
  try {
    const job = queue
      .create('controller-job-save', {
        type: 'save-redis',
        address: address
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
          const error = ErrorHandler.backendErrorList('b5');
          error.systemMessage = err.message ? err.message : err;
          callback(error);
        });
      });

  } catch (err) {
    const error = ErrorHandler.backendErrorList('b5');
    error.systemMessage = err.message ? err.message : err;
    return callback(error);
  }

};


/**
 * End Worker Services
 */

controller.sign = function (params, callback) {

  if (!params.data || !params.data.length || !params.data[0].value) {
    return callback(ErrorHandler.backendErrorList('b1'))
  } else {


    let msgParams = {
      types: {
        EIP712Domain: [
          {name: "name", type: "string"},
          {name: "version", type: "string"},
          {name: "chainId", type: "uint256"},
          {name: 'verifyingContract', type: 'address'}
        ],
        CustomType: [
          {name: "message", type: "string"}
        ],
      },
      primaryType: "CustomType",
      domain: {
        name: "Pareto",
        version: PARETO_SIGN_VERSION,
        chainId: ETH_NETWORK,
        verifyingContract: PARETO_CONTRACT_ADDRESS
      },
      message: {
        message: params.data[0].value
      },
    };
    const owner = params.owner;
    let recovered2 = '';
    let recovered = '';
    let recovered3 = '';
    try {
      recovered2 = sigUtil.recoverPersonalSignature({data: params.data[0].value, sig: params.result});
    } catch (e) {
      console.log(e)
    }
    try {
      recovered = sigUtil.recoverTypedSignature({data: msgParams, sig: params.result});
    } catch (e) {
      console.log(e)
    }
    try {
      recovered3 = sigUtil.recoverTypedSignatureLegacy({data: params.data, sig: params.result});
    } catch (e) {
      console.log(e)
    }

    if (recovered === owner || recovered2 === owner || recovered3 === owner) {
      // If the signature matches the owner supplied, create a
      // JSON web token for the owner that expires in 24 hours.
      controller.getBalance(owner, 0, function (err, count) {
        if (!err) {
          controller.getScoreAndSaveRedis(owner, (e, r) => {
          });
          callback(null, {token: jwt.sign({user: owner}, 'Pareto', {expiresIn: "5y"})});
        } else {
          callback(err);
        }
      });


    } else {
      if (callback && typeof callback === "function") {
        callback(ErrorHandler.backendErrorList('b2'));
      }
    }
  }


};

controller.unsign = function (callback) {

  var token = 'deleted';
  if (callback && typeof callback === "function") {
    callback(null, token);
  }

};

/*
* Retrieves rank around address
*/
controller.retrieveRanksAtAddress = function (q, limit, page, callback) {
  if (web3.utils.isAddress(q + "")) {
    let address = q.indexOf("0x") < 0 ? "0x" + q.toLowerCase() : q.toLowerCase();
    controller.retrieveAddressRankWithRedis([address], true, function (error, rankings) {
      if (error) {
        callback(error);
      } else {
        var {rank} = rankings[0];
        controller.retrieveRanksWithRedis(rank, limit, page, true, callback);
      }
    });

  } else {
    if (Number.isInteger(q) || (typeof q === 'string' && q.indexOf(".") < 0 && !isNaN(parseInt(q)))) {
      controller.retrieveRanksWithRedis(q, limit, page, true, callback);
    } else {
      if (!isNaN(parseFloat(q))) {
        ParetoAddress.aggregate([
          {$match: {score: {$ne: null, $gt: 0}}},
          {$project: {diff: {$abs: {$subtract: [parseFloat(q), '$score']}}, doc: '$$ROOT'}},
          {$sort: {diff: 1}},
          {$limit: 1}
        ]).exec(function (err, r) {
          if (err || r.length === 0 || !r[0].doc || !r[0].doc.address) {
            const error = ErrorHandler.backendErrorList('b4');
            error.systemMessage = err.message ? err.message : err;
            return callback(err);
          } else {
            controller.retrieveAddressRankWithRedis([r[0].doc.address], true, function (error, rankings) {
              if (error) {
                callback(error);
              } else {
                var {rank} = rankings[0];
                controller.retrieveRanksWithRedis(rank, limit, page, true, callback);
              }

            });
          }
        })
      } else {
        // controller.retrieveRanksWithRedis(1, limit, page, true, callback);
          callback(null,[]);
      }
    }

  }
};

controller.event_payment = async function (event, callback) {

    if(event.type === "payment_intent.succeeded"){
        const timestamp  = ((new Date()).getTime() + "");
        await ParetoPayment.create({ email: event.data.object.metadata.email_customer, order_id: event.data.object.id , timestamp: timestamp, amount: event.data.object.amount/100},
             function (err, payment) {
                 const ethereumWallet = require('./ethereum/ethereum-wallet')(
                     Web3,
                     WEB3_WEBSOCKET_URL,
                     web3,
                     ParetoPayment,
                     ETH_NETWORK);
                 controller.transactionFlow(
                     ethereumWallet.generateAddress(event.data.object.client_secret ,timestamp)
                     ,event.data.object.id, function (error, result){
                     if(error){console.log(error)}
                     if(result){console.log(result)}
                 });

                 callback(err, payment);
            });

    }
}

controller.listProducts = async function (callback) {

    let skus;
    await stripe.skus.list(
        {active: true},
        function(err, response) {

            if(err){
                callback(err, null);
                return;
            }
            skus = response.data;

            callback(null, skus);

            //once i have the skus, i need the products

        }
    );


}

controller.createOrder = function (orderdetails, callback) {

    this.create_customer(orderdetails, function (customerObj) {
        let products_ar = [];
        for(var product of orderdetails.order) {
            products_ar.push(
                {
                    type: 'sku',
                    parent: product.id,
                    quantity: product.quantity
                }
            )
        }

        const order = stripe.orders.create({
            currency: 'usd',
            email: orderdetails.customer.email,
            items: products_ar,
            customer: customerObj.id

        });

        let order_amount;
        order.then(function (result) {

            order_amount = result.amount;
            let matadata_pi = {
                order_id:  result.id,
                email_customer: orderdetails.customer.email,
            };
            const paymentIntent =  stripe.paymentIntents.create({
                amount: order_amount,
                currency: 'usd',
                payment_method_types: ['card'],
                metadata: matadata_pi,
                customer: customerObj.id
            });

            paymentIntent.then(function (resultint){

                let response = {order: result, intent: resultint}
                callback(response, resultint);

            });

        });
    });

}

controller.create_customer = async function(orderdetails, callback){
    await stripe.customers.list(
        { limit: 1, email: orderdetails.customer.email },
        function(err, customers) {
            if(err || customers.data.length === 0){
                stripe.customers.create({
                    email: orderdetails.customer.email,
                }, function (err, customer) {
                    callback(customer);
                });


            }else{
                callback(customers.data[0]);
            }

        }
    );
}


/**
 *
 * *********** Functions with Redis ************
 *
 */


/**
 * insert user
 * @param callback Response when the process is finished
 */

controller.insertProfile = function (profile, callback) {

  ParetoProfile.findOneAndUpdate({address: profile.address}, profile, {upsert: true, new: true},
    function (err, r) {
      if (err) {
        console.error('unable to write to db because: ', err);
      } else {
        const multi = redisClient.multi();
        let profile = {
          address: r.address,
          alias: r.alias ? r.alias : "",
          aliasSlug: r.aliasSlug ? r.aliasSlug : "",
          biography: r.biography ? r.biography : "",
          profilePic: r.profilePic ? r.profilePic : ""
        };
        multi.hmset("profile" + profile.address + "", profile);
        multi.exec(function (errors, results) {
          if (errors) {
            console.log(errors);
            callback(errors)
          }
          return callback(null, profile);
        })
      }
    }
  );


};

/**
 * Validate if the user already exists in the database
 * @param callback Response when the process is finished
 */

controller.isNew = function (address, callback) {
  ParetoAddress.find({address: address}, function (err, r) {
    if (r && r.length > 0) {
      callback(null, false);
    } else {
      callback(null, true);
    }
  });
};


/**
 * Get Profile in MongoDB. The result data is saved in Redis. If no Profile exist for the address, a new register is created,
 * @param callback Response when the process is finished
 */

controller.getProfileAndSaveRedis = function (address, callback) {

  ParetoProfile.findOne({address: address},
    function (err, r) {
      if (r) {
        let profile = {
          address: address,
          alias: r.alias ? r.alias : "",
          aliasSlug: r.aliasSlug ? r.aliasSlug : "",
          biography: r.biography ? r.biography : "",
          profilePic: r.profilePic ? r.profilePic : ""
        };
        const multi = redisClient.multi();
        multi.hmset("profile" + profile.address + "", profile);
        multi.exec(function (errors, results) {
          if (errors) {
            console.log(errors);
            callback(errors)
          }
          return callback(null, profile);
        })
      } else {
        let profile = {address: address, alias: "", aliasSlug: "", biography: "", profilePic: ""};
        controller.insertProfile(profile, callback)
      }
    }
  );


};


/**
 * Get profile from Redis.
 * @param address
 */
controller.retrieveProfileWithRedis = function (address, callback) {

  const multi = redisClient.multi();
  multi.hgetall("profile" + address + "");
  multi.exec(function (err, results) {
    if (err) {
      callback(err);
    }
    if ((!results || results.length === 0 || !results[0])) {
      controller.getProfileAndSaveRedis(address, function (err, result) {
        if (err) {
          callback(err);
        } else {
          callback(null, result)
        }
      });
    } else {
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
controller.retrieveRanksWithRedis = function (rank, limit, page, attempts, callback) {

  let queryRank = rank - 3;

  if (queryRank <= 0) {
    queryRank = 1;
  }

  const multi = redisClient.multi();
  for (let i = queryRank + (page * limit); i < queryRank + (page * limit) + limit; i = i + 1) {
    multi.hgetall(i + "");
  }
  multi.hgetall("maxRank");
  multi.exec(function (err, results) {

    if (err) {
      const error = ErrorHandler.backendErrorList('b4');
      error.systemMessage = err.message ? err.message : err;
      return callback(err);
    }

    // if there's no ranking stored in redis, add it there.
    if ((!results || results.length === 0 || !results[0]) && attempts) {
      if (results && results[results.length - 1] && !isNaN(results[results.length - 1].rank) && results[results.length - 1].rank < queryRank + (page * limit)) {
        return callback(null, []);
      }
      controller.getScoreAndSaveRedis(null, function (err, result) {
        if (err) {
          return callback(err);
        } else {
          controller.retrieveRanksWithRedis(rank, limit, page, false, callback);
        }
      });

    } else {
      // return the cached ranking
      return callback(null, results.filter(data => {
        return (data && data.address)
      }));
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
controller.retrieveAddressRankWithRedis = function (addressess, attempts, callback) {

  const multi = redisClient.multi();
  for (let i = 0; i < addressess.length; i = i + 1) {
    multi.hgetall("address" + addressess[i]);
  }
  multi.exec(function (err, results) {
    if (err) {
      return callback(err);
    }
    if ((!results || results.length === 0 || (!results[0] && results.length === 1)) && attempts) {
      ParetoAddress.find({address: {$in: addressess}}, function (err, result) {
        if (!err && (!result || (result && !result.length))) {
          const error = ErrorHandler.backendErrorList('b3');
          error.systemMessage = (err && err.message) ? err.message : err;
          error.address = addressess;
          callback(error);
        } else {
          controller.getScoreAndSaveRedis(null, function (err, result) {
            if (err) {
              return callback(err);
            } else {
              controller.retrieveAddressRankWithRedis(addressess, false, callback);
            }
          });
        }
      });

        } else {
            if ((!results || results.length === 0 || (!results[0] && results.length === 1))) {
                // hopefully, users without pareto shouldn't get here now.
                const error = ErrorHandler.backendErrorList('b3');
                error.address = addressess;
                callback(error);
            } else {
                const multi = redisClient.multi();
                for (let i = 0; i < results.length; i = i + 1) {
                    if (results[i]) {
                        multi.hgetall(results[i].rank + "");
                    }
                }
                multi.hgetall("maxRank");
                multi.hgetall("minScore");
                multi.exec(function (err, results) {
                    if (err) {
                        const error = ErrorHandler.backendErrorList('b4');
                        error.systemMessage = err.message? err.message: err;
                        error.address = addressess;
                        return callback(error);
                    }
                    // return the cached ranking
                    const maxRank = results[results.length-2];
                    const minScore = results[results.length-1];

                    results = results.slice(0,-2);
                    if(maxRank && minScore){
                        results = results.map(it =>{it.maxRank = maxRank.rank; it.minScore = minScore.score; return it });
                    }

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



controller.getAllIntel = async function (callback) {
  const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
  try {
    const result = await IntelInstance.methods.getAllIntel().call();

    response = [];
    for (let i = 0; i < result.intelID.length; i++) {
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
  } catch (err) {
    console.log(err, "errr");
    callback(err, null)
  }

}
controller.getIntelsByProvider = async function (providerAddress, callback) {
  const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
  try {
    const result = await IntelInstance.methods.getIntelsByProvider(providerAddress).call();
    response = [];
    for (let i = 0; i < result.intelID.length; i++) {
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
  } catch (err) {
    console.log(err, "errr");
    callback(err, null)
  }
}

controller.getAnIntel = async function (Id, callback) {
  const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
  const result = await IntelInstance.methods.getIntel(Id).call();
  callback(null, result);
}

controller.getContributorsByIntel = async function (Id, callback) {
  const IntelInstance = new web3.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);

  try {
    const result = await IntelInstance.methods.contributionsByIntel(Id).call();

    response = [];
    for (let i = 0; i < result.addresses.length; i++) {
      const obj = {};
      obj.address = result.addresses[i];
      obj.amount = result.amounts[i];

      response.push(obj);
    }
    callback(null, response)
  } catch (err) {
    console.log(err, "errr");
    callback(err, null)
  }

}

controller.getRewardFromDesiredScore = function (address,  desiredScore, tokens, callback) {
    web3.eth.getBlock('latest')
        .then(function (res) {
            const blockHeight = res.number;

            const promises=[ParetoAddress.find({address: address}),
                ParetoReward.find({'block': {'$gte': (blockHeight - EXPONENT_BLOCK_AGO)}, 'sender': address}),
                ParetoContent.find({block: {$gte: blockHeight - EXPONENT_BLOCK_AGO*2}}).sort({'reward': 1})
            ];
            Promise.all(promises).then( (allData) => {
                let userData = allData[0][0];
                const values = allData[1];
                const desiredRewards = allData[2];
                let intelDesiredRewards = desiredRewards.reduce(function (data, it) {
                    data["" + it.id] = it;
                    return data;
                }, {});
                let lessRewards = {};
                let distincIntel = {};
                for (let j = 0; j < values.length; j = j + 1) {
                    try {
                        const block = parseFloat(values[j].block);
                        const amount = parseFloat(values[j].amount);
                        const intelIndex = values[j].intelId;
                        distincIntel[intelIndex] = 1;
                        if (!lessRewards [intelIndex]) {
                            lessRewards [intelIndex] = {block, amount};
                        }
                        if (block < lessRewards [intelIndex].block) {
                            lessRewards [intelIndex] = {block, amount};
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
                try {
                    let summrewards = 0;

                    let M = Object.keys(distincIntel).length;
                    if ( userData.bonus > 0 && userData.tokens > 0) {
                        let intels = Object.keys(lessRewards);
                        summrewards = intels.reduce(function (reward, it) {
                            return reward + Math.min(lessRewards[it].amount / intelDesiredRewards[it].reward, 2);
                        }, 0);
                    }
                    let H = Math.log(desiredScore) / Math.log((tokens + userData.tokens) * userData.bonus) - 1;
                    let X =  Math.ceil ((2 * H * M - summrewards) / (1 - 2 * H));
                    let response = [];
                    let i=0;
                    let j=0;
                    while(i<X && j < desiredRewards.length-1){
                        if(desiredRewards[j].address != address){
                            if(desiredRewards[j].reward <= 2*desiredRewards[j+1].reward){
                                    i=i+2;
                                    response.push({
                                        intel: desiredRewards[j].id,
                                        reward:2 * desiredRewards[j].reward,
                                        title: desiredRewards[j].title,
                                     })
                            }else{
                                i=i+1;
                                response.push({
                                    intel: desiredRewards[j].id,
                                    reward: desiredRewards[j].reward,
                                    title:  desiredRewards[j].title,
                                })
                            }
                        }
                        j=j+1;
                    }

                    callback(null, {rewardsNeeded: X, proposedReward: response});



                } catch (e) {
                    callback(e)
                }



            })
        })
}


