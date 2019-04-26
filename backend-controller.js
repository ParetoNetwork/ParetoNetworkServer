
const https = require('https');
const request = require('request');
const kue = require('kue');
var controller = module.exports = {};
const Decimal = require('decimal.js-light');
const fs = require('fs');
const path = require('path');
const ErrorHandler = require('./error-handler.js');

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

controller.startW3WebSocket = function () {
  web3_events_provider.on('connect', function () {
    //console.log('WS web3 connected');
    controller.startwatchIntel()
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

/**
 *
 * Db Initialization
 */

const mongoose = require('mongoose');
//var models = require('./models/address');
mongoose.connect(CONNECTION_URL, {useNewUrlParser: true}).then(tmp => {
  web3_events_provider = new Web3.providers.WebsocketProvider(WEB3_WEBSOCKET_URL);
  web3_events = new Web3(web3_events_provider);
  controller.startW3WebSocket();
  console.log("PARETO: Success connecting to Mongo ")
}).catch(err => {
  const error = ErrorHandler.backendErrorList('b15');
  error.systemMessage = err.message ? err.message : err;
  console.log(JSON.stringify(error));
});


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

function updateWithMongo() {
  //ParetoProfile.
}

// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require("./build/contracts/Intel.json");

var sigUtil = require('eth-sig-util');
var jwt = require('jsonwebtoken');

/*project files*/
var utils = require('./backend-utils.js');

module.exports.mongoose = mongoose;
module.exports.redisClient = redisClient;

controller.endConnections = function () {
  mongoose.connection.close();
  redisClient.end(true);
}


const dbName = 'pareto';

/*system constants*/
const PARETO_SCORE_MINIMUM = 100000; 	//minimum score to get intel
const PARETO_RANK_GRANULARIZED_LIMIT = 10; 		//how far down to go through ranks until separating by tiers

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
 *
 *  Functions to Transfer pareto and Eth
 *
 */

/**
 * Get a wallet provider to make transactions
 * @return {{engine: Web3ProviderEngine, web3: Web3}}
 */
controller.getParetoWalletProvider = function () {
    const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
    const ProviderEngine = require('web3-provider-engine');
    const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
    const Wallet = require('ethereumjs-wallet');
    const myWallet =  Wallet.fromPrivateKey(new Buffer(Buffer.from(process.env.DP_ORACLE_SYS, "base64").toString("ascii"), "hex"));
    const engine = new ProviderEngine();
    engine.addProvider(new HookedWalletSubprovider({
        getAccounts: function(cb){
            cb(null, [ myWallet.getAddressString()]);
        },
        getPrivateKey: function(address, cb){
            if (address !== myWallet.getAddressString()) {
                cb(new Error('Account not found'))
            } else {
                cb(null, myWallet.getPrivateKey())
            }
        }
    }));
    engine.addProvider(new WsSubprovider({rpcUrl:  WEB3_WEBSOCKET_URL}));
    engine.start();
    return   { engine: engine, web3 : new Web3(engine), wallet: myWallet }
};


/**
 * Get a wallet provider to make transactions
 * @return {{engine: Web3ProviderEngine, web3: Web3}}
 */
controller.getEthereumWalletProvider = function () {
    const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
    const ProviderEngine = require('web3-provider-engine');
    const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
    const Wallet = require('ethereumjs-wallet');
    const myWallet =  Wallet.fromPrivateKey(new Buffer(Buffer.from(process.env.DE_ORACLE_SYS, "base64").toString("ascii"), "hex"));
    const engine = new ProviderEngine();
    engine.addProvider(new HookedWalletSubprovider({
        getAccounts: function(cb){
            cb(null, [ myWallet.getAddressString()]);
        },
        getPrivateKey: function(address, cb){
            if (address !== myWallet.getAddressString()) {
                cb(new Error('Account not found'))
            } else {
                cb(null, myWallet.getPrivateKey())
            }
        }
    }));
    engine.addProvider(new WsSubprovider({rpcUrl:  WEB3_WEBSOCKET_URL}));
    engine.start();
    return   { engine: engine, web3 : new Web3(engine), wallet: myWallet }
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
                         controller.makeTransaction(address, paretoAmount, ETH_DEPOSIT,(err, result)=>{
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

controller.generateAddress = function (charge_id, timestamp){
    const bip39 = require('bip39');
    const hdkey = require('ethereumjs-wallet/hdkey');
    const  toHex = function(str) {
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    }
    const seed = bip39.mnemonicToSeed(bip39.entropyToMnemonic(toHex(charge_id.slice(-8)+timestamp.slice(-8))));
    const hdwallet = hdkey.fromMasterSeed(seed);
    return  hdwallet.derivePath(`m/44'/60'/0'/0` ).deriveChild(0).getWallet().getAddressString();
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

/**
 *
 * @param address ToAddress
 * @param amount  amount of pareto that will send to address
 * @param callback
 * @return {Promise<void>}
 */
controller.makeParetoTransaction = async function(address, amount){
    return new Promise(async function(resolve, reject) {
        const  walletProvider = controller.getParetoWalletProvider();
        try{

            const Pareto_Token_Schema = require("./build/contracts/ParetoNetworkToken.json");
            const Pareto_Address = process.env.CRED_PARETOCONTRACT;
            const web3 = walletProvider.web3;
            const wallet = walletProvider.wallet;
            const ParetoTokenInstance  = new web3.eth.Contract( Pareto_Token_Schema.abi, Pareto_Address);
            let gasPrice = await web3.eth.getGasPrice();
            let amountPareto = web3.utils.toWei(amount.toString(), "ether");
            let gasApprove = await ParetoTokenInstance.methods
                .transfer(address, amountPareto)
                .estimateGas({from: wallet.getAddressString()});
            ParetoTokenInstance.methods
                .transfer(address, amountPareto)
                .send({
                    from: wallet.getAddressString(),
                    gas: gasApprove,
                    gasPrice: gasPrice  * 1.3
                })
                .once('transactionHash', function(hash){
                    controller.waitForReceipt(hash,async  (err, receipt)=> {
                        if(err){
                            if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                            return  reject(err);
                        }
                        if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                        resolve({amount,  hash});
                    })
                })
                .once('error', (err)=>{
                    if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                    reject(err);
                });
        }catch (e) {
            if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
            reject(e);
        }
    });

};


/**
 *
 * @param address ToAddress
 * @param amount  amount of eth that will send to address
 * @param callback
 * @return {Promise<void>}
 */
controller.makeEthTransaction = async function(address, eth){
    return new Promise(async function(resolve, reject) {
        const  walletProvider = controller.getEthereumWalletProvider();
        try{

            const web3 = walletProvider.web3;
            const wallet = walletProvider.wallet;
            let amountEther = web3.utils.toWei(eth.toString(), "ether");
            let gasPrice = await web3.eth.getGasPrice();
            let gasApprove = await web3.eth.estimateGas({
                to:address,
                from: wallet.getAddressString(),
                value: amountEther});
            web3.eth.sendTransaction({
                to:address,
                from: wallet.getAddressString(),
                value: amountEther,
                gas: gasApprove,
                gasPrice: gasPrice  * 1.3
            }).once('transactionHash', function(hash){
                controller.waitForReceipt(hash,async  (err, receipt)=>{
                    if(err){
                        if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                        return  reject(err);
                    }
                    resolve(receipt);

                })
            })
                .once('error', function(err){
                    if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                    reject(err);
                });

        }catch (e) {
            if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
            reject(e);
        }
    });


};


/**
 *
 * @param address ToAddress
 * @param amount  amount of pareto that will send to address
 * @param eth  amount of eth that will send to address
 * @param callback
 * @return {Promise<void>}
 */
controller.makeTransaction = async function(address, amount, eth, callback){
    console.log(address);
    Promise.all([controller.makeParetoTransaction(address,amount),
        controller.makeEthTransaction(address,eth)]).then( (r)=>{
        callback(null, r[0]);
    }).catch((e)=>{
        callback(e);
    })
};

controller.waitForReceipt = function (hash, cb) {
    web3.eth.getTransactionReceipt(hash, function (err, receipt) {
        if (err) {
            cb(err);
        }

        if (receipt !== null) {
            // Transaction went through
            if (cb) {
                cb(null, receipt);
            }
        } else {
            // Try again in 1 second
            setTimeout(function () {
                controller.waitForReceipt(hash, cb);
            }, 1000);
        }
    });
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

controller.postContent = function (req, callback) {

  var body = req.body;

  //exposed endpoint to write content to database
  if (web3.utils.isAddress(req.user) == false) {
    if (callback && typeof callback === "function") {
      const error = ErrorHandler.backendErrorList('b6');
      error.address = address;
      callback(error);
    }
  } else {

    let Intel = new ParetoContent({
      address: req.body.address || req.user,
      title: req.body.title,
      body: req.body.body,
      text: req.bodytext,
      dateCreated: Date.now(),
      block: req.body.number || 0,
      txHash: req.body.txHash || '0x0', //this is done client side to cause an internal invocation
      speed: process.env.DEFAULT_SPEED || 1 , //1 is very fast speed, 2 is fast, 3 is normal, medium speed, 4 is very slow speed for long applicable swing trades
      reward: req.body.reward || 1

    });
    if(req.body.assets && req.body.assets.length){
        Intel.assets = req.body.assets.map(it=>{return{ asset: mongoose.Types.ObjectId(it)}});
    }
    Intel.save((err, savedIntel) => {

      if (err) {
        if (callback && typeof callback === "function") {
          callback(err);
        }
      } else {

        if (callback && typeof callback === "function") {
          callback(null, {Intel_ID: savedIntel.id});
        }

      }
    })

  } // end else

};


controller.getTransaction = function (data, callback) {
  const query = {address: data.user};

  if (data.query.q) {
    switch (data.query.q) {
      case 'complete': {
        query.status = {$gte: 3};
        break;
      }
      case 'pending': {
        query.status = {$lt: 3};
        break;
      }
      case 'nd' : {
        query.event = {$nin: ['distribute']};
        break;
      }
      case 'all': {
        break;
      }
      default:
        data.status = {$lt: 3}
    }
  }

  const limit = parseInt(data.query.limit) || 100;
  const skip = limit * (data.query.page || 0);

  ParetoTransaction.find(query).sort({dateCreated: -1}).skip(skip).limit(limit).populate({
    path: 'intelData',
    populate: {
      path: 'createdBy'
      , select: 'address alias aliasSlug profilePic'
    }
    , select: 'id block address title reward'
  }).exec(callback);
};

controller.watchTransaction = function (data, callback) {
  if (data.address) {
    data.address = data.address.toLowerCase();
  }

  var dbQuery = {
    txHash: data.txHash
  };

  if (data.txRewardHash) {
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
  }).catch(function (e) {
    callback(e)
  });
}


controller.startwatchNewIntel = function () {
  const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
  console.log('startWatch');
  intel.events.NewIntel().on('data', event => {
    try {
      const initialBalance = web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
      const expiry_time = event.returnValues.ttl;
      ParetoContent.findOneAndUpdate({
        id: event.returnValues.intelID,
        validated: false
      }, {
        intelAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address,
        validated: true,
        reward: initialBalance,
        expires: expiry_time,
        block: event.blockNumber,
        txHash: event.transactionHash
      }, {multi: false}, function (err, data) {
        if (!err && data) {
          try {
            controller.getBalance(data.address, 0, function (err, count) {
              if (!err) {
                let promises = [ParetoAddress.findOneAndUpdate({address: data.address}, {tokens: count})
                  , ParetoTransaction.findOneAndUpdate(
                    {
                      intel: event.returnValues.intelID,
                      event: 'create'
                    }, {status: 3,
                            txHash: event.transactionHash,
                            event: 'create',
                            block: event.blockNumber,
                            amount:  initialBalance,
                            intel: parseInt(event.returnValues.intelID),
                            address: data.address
                        },{upsert: true, new: true})];
                Promise.all(promises).then(values => {
                  if (values.length > 1) {
                    controller.getScoreAndSaveRedis(null, (err, result) => {
                      controller.SendInfoWebsocket({
                        address: data.address,
                        transaction: values[1]
                      });
                    })
                  }
                })
                  .catch(e => {
                    const error = ErrorHandler.backendErrorList('b22');
                    error.systemMessage = e.message ? e.message : e;
                    console.log(JSON.stringify(error));
                  });

              }
            });

          } catch (e) {
            const error = ErrorHandler.backendErrorList('b18');
            error.systemMessage = e.message ? e.message : e;
            console.log(JSON.stringify(error));
          }
        }
      });
    } catch (e) {
      const error = ErrorHandler.backendErrorList('b18');
      error.systemMessage = e.message ? e.message : e;
      console.log(JSON.stringify(error));
    }

  }).on('error', err => {
    console.log(err);
  });
}


controller.startwatchReward = function (intel, intelAddress) {
  intel.events.Reward().on('data', event => {
    try {
      const intelIndex = parseInt(event.returnValues.intelIndex);
      const rewardData = {
        sender: event.returnValues.sender.toLowerCase(),
        receiver: '',
        intelAddress: intelAddress,
        intelId: intelIndex,
        txHash: event.transactionHash,
        dateCreated: Date.now(),
        block: event.blockNumber,
        amount: web3.utils.fromWei(event.returnValues.rewardAmount, 'ether')
      };
      ParetoReward.findOneAndUpdate({txHash: event.transactionHash}, rewardData, {upsert: true, new: true},
        function (err, r) {
          if (err) {
            const error = ErrorHandler.backendErrorList('b19');
            error.systemMessage = err.message ? err.message : err;
          } else {
            ParetoContent.findOne({id: intelIndex}, (err, intel) => {
              if (intel) {
                const {address} = intel;
                ParetoReward.findOneAndUpdate({txHash: event.transactionHash}, {receiver: address}, {},
                  function (err, r) {
                  }
                );
              }
            });

            controller.getBalance(event.returnValues.sender.toLowerCase(), 0, function (err, count) {
              if (!err) {
                controller.updateAddressReward(event, count);
              } else {
                  console.log(err)
              }
            });
            web3.eth.getTransaction(event.transactionHash).then(function (txObject) {
              const nonce = txObject.nonce;
              controller.updateIntelReward(intelIndex, event.transactionHash, nonce, event.returnValues.sender.toLowerCase(), rewardData.block, rewardData.amount);
            }).catch(function (err) {
              console.log(err)
            });

          }
        }
      );

    } catch (e) {
      const error = ErrorHandler.backendErrorList('b19');
      error.systemMessage = e.message ? e.message : e;
      console.log(JSON.stringify(error));
    }

  }).on('error', err => {
    console.log(err);
  });
}

controller.startwatchDistribute = function (intel, intelAddress) {
  intel.events.RewardDistributed().on('data', event => {
    try {
      const intelIndex = parseInt(event.returnValues.intelIndex);
      web3.eth.getTransaction(event.transactionHash).then(function (txObject) {
        const nonce = txObject.nonce;
        const txHash = event.transactionHash;
        const sender = event.returnValues.distributor.toLowerCase();
        let promises = [ParetoContent.findOneAndUpdate({id: intelIndex}, {
          distributed: true,
          txHashDistribute: event.transactionHash
        })
          , ParetoTransaction.findOneAndUpdate(
            {
              $or: [{txHash: txHash},
                {address: sender, nonce: nonce}]
            }, {
              status: 3,
              txRewardHash: txHash,
              txHash: txHash,
              address: sender,
              block: event.blockNumber,
              amount:  parseFloat(web3.utils.fromWei(event.returnValues.provider_amount, 'ether')),
              nonce: nonce,
              event: 'distribute',
              intel: intelIndex,
            },{upsert: true, new: true})];
        Promise.all(promises).then(values => {
          if (controller.wss && values.length > 1) {
            controller.SendInfoWebsocket({address: values[0].address, transaction: values[1]});
          } else {
            console.log('no wss');
          }
        })
          .catch(e => {
            const error = ErrorHandler.backendErrorList('b21');
            error.systemMessage = e.message ? e.message : e;
            console.log(JSON.stringify(error));
          });


      }).catch(function (err) {
        console.log(err)
      });

    } catch (e) {
      const error = ErrorHandler.backendErrorList('b21');
      error.systemMessage = e.message ? e.message : e;
      console.log(JSON.stringify(error));
    }

  }).on('error', err => {
    console.log(err);
  });
};

controller.startwatchDeposit= function (intel) {
  try{
      intel.events.Deposited().on('data', event => {
          try {

              web3.eth.getTransaction(event.transactionHash).then(function (txObject) {
                  const nonce = txObject.nonce;
                  const txHash = event.transactionHash;
                  const sender = event.returnValues.from.toLowerCase();
                  try{
                      ParetoPayment.findOneAndUpdate(
                          {txHash: txHash}
                          , {processed: true}).then(value => {}).catch(err=>{});
                  }catch (e) {  }
                  ParetoTransaction.findOneAndUpdate(
                      {
                          $or: [{txHash: txHash},
                              {address: sender, nonce: nonce}]
                      }, {
                          status: 3,
                          txRewardHash: txHash,
                          txHash: txHash,
                          block: event.blockNumber,
                          amount:  parseFloat(web3.utils.fromWei(event.returnValues.amount, 'ether')),
                          address: sender,
                          nonce: nonce,
                          event: 'deposited',
                      },{upsert: true, new: true}).then(value => {
                      if (controller.wss && value) {
                          controller.SendInfoWebsocket({address: value.address, transaction: value});
                      } else {
                          console.log('no wss');
                      }
                  }).catch(e => {
                      const error = ErrorHandler.backendErrorList('b26');
                      error.systemMessage = e.message ? e.message : e;
                      console.log(JSON.stringify(error));
                  });
              }).catch(function (e) {
                  const error = ErrorHandler.backendErrorList('b26');
                  error.systemMessage = e.message ? e.message : e;
                  console.log(JSON.stringify(error));
              });

          } catch (e) {
              const error = ErrorHandler.backendErrorList('b26');
              error.systemMessage = e.message ? e.message : e;
              console.log(JSON.stringify(error));
          }

      }).on('error', err => {
          console.log(err);
      });
  }catch (e) {
      //only new intel contract has Deposited events.
  }

};

controller.startWatchApprove = function () {
  web3_events.eth.subscribe('logs',
    {
      fromBlock: 'latest',
      address: PARETO_CONTRACT_ADDRESS,
      topics: ['0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', null, null]
    }).on('data', async function (log) {

    const blockNumber = log.blockNumber;
    const sender = "0x" + log.topics[1].substring(26);
    const txHash = log.transactionHash;

    if (blockNumber != null) {
      web3.eth.getTransaction(txHash).then(function (txObject) {
        const nonce = txObject.nonce;
        ParetoTransaction.findOneAndUpdate(
          {
            $or: [{txHash: txHash},
              {address: sender, nonce: nonce}]
          }
          , {status: 1, address: sender, block: blockNumber, txHash: txHash}, function (err, r) {
            if (!err && r) {
              ParetoAddress.findOneAndUpdate({address: r.address}, {lastApprovedAddress: Intel_Contract_Schema.networks[ETH_NETWORK].address}, function (err, r) {
                controller.getScoreAndSaveRedis(null, function (err, r) {
                })
              });
              controller.SendInfoWebsocket({address: r.address, transaction: r});
            } else {
              if (err) {
                const error = ErrorHandler.backendErrorList('b21');
                error.systemMessage = err.message ? err.message : err;
                console.log(JSON.stringify(error));
              }
            }

          })


      }).catch(function (err) {
        console.log(err)
      });

      try{
          const payment =  await ParetoPayment.findOne({address: sender, processed: false}).exec();
          const  walletProvider = controller.getEthereumWalletProvider();

          const Intel_Schema = require("./build/contracts/Intel.json");
          const web3 = walletProvider.web3;
          const wallet = walletProvider.wallet;
          const Intel  = new web3.eth.Contract( Intel_Schema.abi, Intel_Schema.networks[ETH_NETWORK].address);
          if(payment){
              const paretoAmount = payment.paretoAmount;
              console.log('ini deposit');
              let amountPareto = web3.utils.toWei(paretoAmount.toString(), "ether");
              let gasPrice = await web3.eth.getGasPrice();
              let gasApprove = await Intel.methods
                  .makeDeposit(sender, amountPareto)
                  .estimateGas({from: wallet.getAddressString()});
              await Intel.methods
                  .makeDeposit(sender, amountPareto)
                  .send({
                      from: wallet.getAddressString(),
                      gas: gasApprove,
                      gasPrice: gasPrice * 1.3
                  })
                  .once("transactionHash", async (hash) => {
                      console.log("deposit hash "+hash);
                      try{
                          const payment =  await ParetoPayment.findOneAndUpdate({address: sender, processed: false},{txHash: hash}).exec();
                      } catch (e) { console.log(e)}
                  })
                  .once("error", err => {
                      if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                      return callback(err);
                  });
          }
      }catch (e) {
          console.log(e);
      }
    }
  });
}


/**
 * Watch Intel events. Support watch rewards for old Intel address
 */
controller.startwatchIntel = function () {
  controller.startwatchNewIntel()
  ParetoContent.find({'validated': true}).distinct('intelAddress').exec(function (err, results) {
    if (err) {
      callback(err);
    } else {
      let data = results.filter(item => item === Intel_Contract_Schema.networks[ETH_NETWORK].address);
      if (!data.length) {
        results.push(Intel_Contract_Schema.networks[ETH_NETWORK].address);
      }
      for (let i = 0; i < results.length; i = i + 1) {
        const intelAddress = results[i];
        const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, intelAddress);
        controller.startwatchReward(intel, intelAddress);
        controller.startwatchDistribute(intel, intelAddress);
        controller.startwatchDeposit(intel);
      }

    }
  });
  controller.startWatchApprove();

};


/**
 * update Address score when reward an intel
 * @param event
 */
controller.updateAddressReward = function (event, token) {
  let addressToUpdate = event.returnValues.sender.toLowerCase();
  ParetoAddress.findOneAndUpdate({address: addressToUpdate}, {tokens: token}, {new: true}, (err, data) => {
    let dbValues = {
      bonus: data.bonus,
      tokens: data.tokens,
      score: data.score,
      block: data.block
    };
    controller.addExponentAprox([addressToUpdate], [dbValues], event.blockNumber, function (err, res) {
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
        controller.getScoreAndSaveRedis(null, function (err, result) {
          if (!err) {
            controller.SendInfoWebsocket({address: addressToUpdate});
          } else {
            console.log(err);
          }
        })
      })
    });
  })
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

/**
 * Update totalreward count in Intel document
 * @param intelIndex
 * @param txHash
 */
controller.updateIntelReward = function (intelIndex, txHash, nonce, sender, block, amount) {
  let agg = [{$match: {'intelId': intelIndex}},
    {
      $group: {
        _id: null,
        rewards: {
          "$addToSet": {
            "txHash": "$txHash",
            "amount": "$amount"
          }
        }
      }
    },
    {$unwind: "$rewards"},
    {
      $group: {
        _id: null,
        reward: {$sum: "$rewards.amount"}
      }
    }

  ];
  ParetoReward.aggregate(agg).exec(function (err, r) {
    if (r.length > 0) {
      const reward = r[0].reward;
      let promises = [ParetoContent.findOneAndUpdate({id: intelIndex}, {totalReward: reward})
        , ParetoTransaction.findOneAndUpdate({
          $or: [{txRewardHash: txHash}, {txHash: txHash},
            {address: sender, intel: intelIndex, event: 'reward', nonce: nonce}]
        }, {status: 3,
              txRewardHash: txHash,
              txHash: txHash,
              nonce: nonce,
              block: block,
              amount:  amount,
              event: 'reward',
              address: sender,
              intel: intelIndex
        },{upsert: true, new: true})];
      Promise.all(promises).then(values => {
        if (values.length > 1 && controller.wss) {
          controller.SendInfoWebsocket({address: values[1].address, transaction: values[1]});
        }
      })
        .catch(e => {
          const error = ErrorHandler.backendErrorList('b19');
          error.systemMessage = e.message ? e.message : e;
          console.log(JSON.stringify(error));
        });
    }
  })
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

controller.getAddressesWithSlug = async function (aliasArray) {
  let profiles = await ParetoProfile.find({aliasSlug: {$in: aliasArray}}).exec();
  if (profiles.length > 0) {
    return profiles.map(profile => profile.address);
  }
  return [];
};

controller.validateQuery = async function (query) {
  const array = [];
  if (query.created && !isNaN(Date.parse(query.created))) {
    try {
      const date = new Date(query.created);
      const date2 = new Date(date.getTime() + 86400000);
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
  if (query.title) {
    try {
      array.push({
        title: {$regex: ".*" + query.title + ".*"}
      })
    } catch (e) {
      console.log(e)
    }
  }

  if (query.address) {
    try {
      data = query.address.split(',')
        .filter(address => {
          return web3.utils.isAddress(address)
        }).map(address => {
          return address.toLowerCase()
        });

      let data2 = query.address.split(',')
        .filter(address => {
          return !web3.utils.isAddress(address);
        });

      let addresses = await controller.getAddressesWithSlug(data2);

      let allAddresses = [...data, ...addresses];
      if (allAddresses.length > 0) {
        array.push({address: {$in: allAddresses}});
      }

    } catch (e) {
      console.log(e)
    }
  } else if (query.alias) {
    try {
      data = query.alias.split(',');

      let addresses = await controller.getAddressesWithSlug(data);
      if (addresses.length > 0) {
        array.push({address: {$in: addresses}});
      }
    } catch (e) {
      console.log(e);
    }

  } else if (query.exclude) {
    try {
      data = query.exclude.split(',')
        .filter(address => {
          return web3.utils.isAddress(address)
        }).map(address => {
          return address.toLowerCase()
        });

      let data2 = query.exclude.split(',')
        .filter(address => {
          return !web3.utils.isAddress(address);
        });

      let addresses = await controller.getAddressesWithSlug(data2);

      let allAddresses = [...data, ...addresses];
      if (allAddresses.length > 0) {
        array.push({address: {$nin: allAddresses}});
      }

    } catch (e) {
      console.log(e)
    }

  }
  return array;
};

controller.slugify = function (string) {
  const a = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;';
  const b = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

controller.getQueryContentByUser = function (address, intel, callback) {

  if (web3.utils.isAddress(address) == false) {
    if (callback && typeof callback === "function") {
      const error = ErrorHandler.backendErrorList('b6');
      error.address = address;
      callback(error);
    }
  } else {


    //address exclude created title
    //1. get score from address, then get standard deviation of score
    controller.retrieveAddress(address, function (err, result) {

      if (err) {
        if (callback && typeof callback === "function") {
          callback(err);
        }
      } else {

        if (result == null) {

          //this can happen if a new address is found which is not in the system yet. in reality it should be calculated beforehand, or upon initial auth

          if (callback && typeof callback === "function") {
            callback(null, []);
          }
        } else {
          //1b. get block height
          web3.eth.getBlock('latest')
            .then(function (res) {
              blockHeight = res.number;

              //2. get percentile

                            //2a. get total rank where score > 0
                            ParetoAddress.countDocuments({score: {$gt: 0}}, async (err, count) => {

                //and this is because we are using hardcoded ranks to begin with. fix by having proprietary high performance web3 server (parity in docker?), or by doing more efficient query which creates rank on the fly from group
                if (result.rank == null) {
                  result.rank = count - 1;
                }

                var percentile = 1 - (result.rank / count); //this should be a decimal number

                var blockDelay = 0;

                if (percentile > .99) {

                  //then do multiplication times the rank to determine the block height delta.
                  if (result.rank < PARETO_RANK_GRANULARIZED_LIMIT) {
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
                const CONTENT_DELAY = {
                  blockDelay: [1,blockDelay,blockDelay*50,blockDelay*100,blockDelay*150],
                  blockHeight: blockHeight
                };
                      let returnQuery = {
                          $and: [
                              {
                                  $or: [
                                      {
                                          block: {$lte: (blockHeight - blockDelay * 1)},
                                          speed: 1,
                                          $or: [{validated: true}, {block: {$gt: 0}}]
                                      },
                                      {
                                          block: {$lte: (blockHeight - blockDelay * 50)},
                                          speed: 2,
                                          $or: [{validated: true}, {block: {$gt: 0}}]
                                      },
                                      {
                                          block: {$lte: (blockHeight - blockDelay * 100)},
                                          speed: 3,
                                          $or: [{validated: true}, {block: {$gt: 0}}]
                                      },
                                      {
                                          block: {$lte: (blockHeight - blockDelay * 150)},
                                          speed: 4,
                                          $or: [{validated: true}, {block: {$gt: 0}}]
                                      },
                                      {address: address, $or: [{validated: true}, {block: {$gt: 0}}]}
                                  ]
                              }]
                      };

                                // if(percentile<0.85){
                                //     returnQuery.$and.push({expires: {$lte : ((new Date()).getTime()/1000)+86400}, validated: true});
                                // }

                                return callback(null, CONTENT_DELAY, returnQuery,percentile);
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

controller.getAssets = async function (callback){
    try{
        callback(null, await ParetoAsset.find({}).exec())
    } catch (e) {
        callback(e);
    }
};

controller.getAllAvailableContent = async function (req, callback) {

  var limit = parseInt(req.query.limit || 100);
  var page = parseInt(req.query.page || 0);
  controller.getQueryContentByUser(req.user, null, async function (error, contentDelay, queryFind, percentile) {

    if (error) return callback(error);
    try {
      let newQuery = await controller.validateQuery(req.query);
      queryFind.$and = queryFind.$and.concat(newQuery);

      const allResults = await ParetoContent.find(queryFind).sort({dateCreated: -1}).skip(page * limit).limit(limit).populate([{ path: 'assets.asset'}, {path: 'createdBy'}]).exec();
      let newResults = [];

      allResults.forEach(function (entry) {
        /*

         currently: force use of limit to keep json response smaller.
         limit isn't used earlier so that redis knows the full result,
         and because the queries for each speed of content are separate

         future: server should already have an idea of what content any user can see,
         since it knows their latest scores and the current block height. therefore the full content response can be queried at once, perhaps, and pages can be done fictionally

         */
        try {
          let delayAgo = contentDelay.blockHeight - (contentDelay.blockDelay[entry.speed] + entry.block);
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
            totalReward: entry.totalReward || 0,
            reward: entry.reward,
            speed: entry.speed,
            id: entry.id,
            txHashDistribute: entry.txHashDistribute,
            intelAddress: entry.intelAddress,
            _v: entry._v,
            distributed: entry.distributed,
            assets: entry.assets,
            createdBy: {
              address: entry.createdBy.address,
              alias: entry.createdBy.alias,
              aliasSlug: entry.createdBy.aliasSlug,
              biography: entry.createdBy.biography,
              profilePic: entry.createdBy.profilePic
            },
            contentDelay: contentDelay
          };

          if(percentile < 0 ){ //eventually it may be < 0.85
               if(data.expires > ((new Date()).getTime()/1000)+86400){
                   data.title = "Classified" + controller.decodeData(data.title);
                   data.body =  controller.decodeData(data.body);
               }
          }

          newResults.push(data);

        } catch (e) {
        }
      });
      //console.log(allResults);

      if (callback && typeof callback === "function") {
        callback(null, newResults);
      }

    } catch (err) {
      if (callback && typeof callback === "function") {
        callback(err);
      }
    }
  });
};

controller.decodeData = function (data){
  const TOKEN = "@7a8b9c";
  const words = data.split(" ");
  const shuffle = function (array) {

        var currentIndex = array.length;
        var temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;

    };
  const randomWord =  function (length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };
  const permutations = shuffle(Array.from(Array(words.length), (x, index)=>index+1)).slice(0,(words.length*0.5).toFixed());
  return  words.map((it, index)=>{
        if(permutations.includes(index)){
          return TOKEN + randomWord(it.length) + TOKEN
        }else{
          return it;
        }

  }).join(' ');
}

controller.getContentByIntel = function (req, intel, callback) {
  controller.getQueryContentByUser(req.user, intel, async function (error, contentDelay, queryFind, percentile) {
    if (error) return callback(error);
    try {
      if (mongoose.Types.ObjectId.isValid(intel)) {
        queryFind.$and = queryFind.$and.concat({_id: mongoose.Types.ObjectId(intel)})
      } else {
        queryFind.$and = queryFind.$and.concat({txHash: intel})
      }
      const allResults = await ParetoContent.find(queryFind).sort({dateCreated: -1}).populate([{ path: 'assets.asset'}, {path: 'createdBy'}]).exec();
      if (allResults && allResults.length > 0) {
        const entry = allResults[0];
        let delayAgo = contentDelay.blockHeight - (contentDelay.blockDelay[entry.speed] + entry.block);
        const data  = {
            _id: entry._id,
            blockAgo: Math.max(blockHeight - entry.block, 0),
            block: entry.block,
            title: entry.title,
            address: entry.address,
            body: entry.body,
            expires: entry.expires,
            dateCreated: entry.dateCreated,
            txHash: entry.txHash,
            totalReward: entry.totalReward || 0,
            reward: entry.reward,
            speed: entry.speed,
            id: entry.id,
            txHashDistribute: entry.txHashDistribute,
            intelAddress: entry.intelAddress,
            _v: entry._v,
            distributed: entry.distributed,
            assets: entry.assets,
            createdBy: {
                address: entry.createdBy.address,
                alias: entry.createdBy.alias,
                aliasSlug: entry.createdBy.aliasSlug,
                biography: entry.createdBy.biography,
                profilePic: entry.createdBy.profilePic
            },
            contentDelay: contentDelay
        };


          if(percentile < 0){
              if(data.expires > ((new Date()).getTime()/1000)+86400){
                  data.title = "Classified" + controller.decodeData(data.title);
                  data.body =  controller.decodeData(data.body);
              }
          }

          return callback(null, data)
      } else {
        callback(null, {})
      }

    } catch (err) {
      if (callback && typeof callback === "function") {
        callback(err);
      }
    }
  });
};

controller.retrieveProfileWithAlias = function (alias) {
  return ParetoProfile.findOne({alias: alias}).exec();
};

controller.retrieveProfileWithAliasSlug = function (alias) {
  return ParetoProfile.findOne({aliasSlug: alias}).exec();
};

controller.retrieveAddress = function (address, callback) {

  var address = address;
  address = address.toLowerCase();

  if (web3.utils.isAddress(address) == false) {
    if (callback && typeof callback === "function") {
      const error = ErrorHandler.backendErrorList('b6');
      error.address = address;
      callback(error);
    }
  } else {
    controller.retrieveAddressRankWithRedis([address], true, function (error, results) {
      if (error) {
        callback(error)
      } else {
        callback(null, results[0])
      }
    });
  }

};

controller.retrieveAddresses = function (addresses, callback) {
  controller.retrieveAddressRankWithRedis(addresses, true, function (error, results) {
    if (error) {
      callback(error)
    } else {
      callback(null, results)
    }
  });
};

controller.updateUser = async function (address, userinfo, callback) {
  let fixaddress = address.toLowerCase();

  if (web3.utils.isAddress(fixaddress) == false) {
    callback(new Error('Invalid Address'));
  } else {
    const profile = {address: address};

    if (userinfo.alias) {
      profile.alias = userinfo.alias;
      profile.aliasSlug = controller.slugify(userinfo.alias);

      let existingAlias = await controller.retrieveProfileWithAlias(profile.alias);
      let existingAliasSlug = false;

      if (existingAlias && existingAlias.address !== address) {
        callback(new Error("An user with that alias already exist"));
        return;
      } else {
        existingAliasSlug = await controller.retrieveProfileWithAliasSlug(profile.aliasSlug);

        let counter = 0;
        while (existingAliasSlug && counter < 10) {
          if (existingAliasSlug.address !== address) {
            let positionDash = profile.aliasSlug.indexOf('-');
            if (positionDash >= 0 && profile.aliasSlug.substring(profile.aliasSlug.length - 1) !== '-') {
              profile.aliasSlug = profile.aliasSlug.replace('-', '');
            } else {
              profile.aliasSlug = profile.aliasSlug + '-';
            }
            existingAliasSlug = await controller.retrieveProfileWithAliasSlug(profile.aliasSlug);
          } else {
            existingAliasSlug = null;
          }
          counter++;
        }
      }
    }

    if (userinfo.biography) {
      profile.biography = userinfo.biography;
    }
    if (userinfo.profile_pic) {
      profile.profilePic = userinfo.profile_pic;
    }
    controller.insertProfile(profile, function (error, result) {
      if (error) {
        callback(error)
      } else {
        controller.getUserInfo(address, callback)
      }
    })
  }
};

controller.getUserInfo = async function (address, callback) {
  let fixaddress = address.toLowerCase();

  if (web3.utils.isAddress(fixaddress) == false) {
    let profile = await ParetoProfile.findOne({aliasSlug: address}).exec();
    if (!profile) profile = await ParetoProfile.findOne({alias: address}).exec();

        if (profile) {
            controller.retrieveAddressRankWithRedis([profile.address], true, function (error, rankings) {
                if (error) {
                    callback(error)
                } else {
                    let ranking = rankings[0];
                    callback(null, {
                        'address': profile.address,
                        'rank': ranking.rank,
                        'score': ranking.score,
                        'tokens': ranking.tokens,
                        'block': ranking.block,
                        'lastApprovedAddress': ranking.approved,
                        'maxRank': ranking.maxRank,
                        'minScore': ranking.minScore,
                        'alias': profile.alias,
                        'aliasSlug': profile.aliasSlug,
                        'biography': profile.biography,
                        "profile_pic": profile.profilePic
                    });
                }
            });
        } else {
            callback(new Error('Invalid Address or alias'));
        }
    } else {

        controller.retrieveAddressRankWithRedis([address], true, function (error, rankings) {
            if (error) {
                callback(error)
            } else {
                controller.retrieveProfileWithRedis(address, function (error, profile) {
                    if (error) {
                        callback(error)
                    }
                    let ranking = rankings[0];
                    callback(null, {
                        'address': address,
                        'rank': ranking.rank,
                        'score': ranking.score,
                        'tokens': ranking.tokens,
                        'block': ranking.block,
                        'lastApprovedAddress': ranking.approved,
                        'maxRank': ranking.maxRank,
                        'minScore': ranking.minScore,
                        'alias': profile.alias,
                        'aliasSlug': profile.aliasSlug,
                        'biography': profile.biography,
                        "profile_pic": profile.profilePic
                    });
                });
            }
        });
    }

};


controller.getContentByCurrentUser = async function (req, callback) {
  let address = req.query.user || req.user;
  let isAddress = web3.utils.isAddress(address) === true;

  var limit = parseInt(req.query.limit || 100);
  var page = parseInt(req.query.page || 0);

  if (!isAddress) {
    let profileFound = await ParetoProfile.findOne({aliasSlug: address}).exec();
    if (!profileFound) profileFound = await ParetoProfile.findOne({alias: address}).exec();
    if (profileFound) address = profileFound.address;
    isAddress = web3.utils.isAddress(address) === true;
  }

  if (!isAddress) {
    if (callback && typeof callback === "function") {
      callback(new Error('Invalid Address'));
    }
  } else {
    var query = ParetoContent.find({
      address: address,
      validated: true
    }).sort({dateCreated: -1}).skip(limit * page).limit(limit).populate([{ path: 'assets.asset'}, {path: 'createdBy'}]);

    query.exec(function (err, results) {
      if (err) {
        if (callback && typeof callback === "function") {
          callback(err);
        }
      } else {
        web3.eth.getBlock('latest')
          .then(function (res) {
            blockHeight = res.number;
            let newResults = [];
            results.forEach(function (entry) {
              let data = {
                _id: entry._id,
                id: entry.id,
                blockAgo: Math.max(blockHeight - entry.block),
                block: entry.block,
                address: entry.address,
                title: entry.title,
                body: entry.body,
                dateCreated: entry.dateCreated,
                txHash: entry.txHash,
                totalReward: entry.totalReward || 0,
                reward: entry.reward,
                speed: entry.speed,
                txHashDistribute: entry.txHashDistribute,
                expires: entry.expires,
                validated: entry.validated,
                intelAddress: entry.intelAddress,
                distributed: entry.distributed,
                assets: entry.assets,
                _v: entry._v,
                createdBy: {
                  address: entry.createdBy.address,
                  alias: entry.createdBy.alias,
                  aliasSlug: entry.createdBy.aliasSlug,
                  biography: entry.createdBy.biography,
                  profilePic: entry.createdBy.profilePic
                }
              };
              newResults.push(data);
            });
            callback(null, newResults);
          }, function (error) {
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
                    //Charge ID, charge.id?
                 controller.transactionFlow(controller.generateAddress(event.data.object.client_secret ,timestamp) ,event.data.object.id, function (error, result){
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


