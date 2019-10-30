module.exports = function (
    controller,
    Web3,
    web3,
    web3_events_provider,
    web3_events,
    Intel_Contract_Schema,
    ParetoAddress,
    ParetoIntel,
    ParetoProfile,
    ParetoPayment,
    ParetoReward,
    ParetoAsset,
    ParetoTransaction,
    ErrorHandler,
    ETH_NETWORK,
    PARETO_CONTRACT_ADDRESS,
    WEB3_WEBSOCKET_URL
) {
     let ethereum  = {};
     ethereum.startwatchNewIntel = function () {
         const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, Intel_Contract_Schema.networks[ETH_NETWORK].address);
         console.log('startWatch');
         intel.events.NewIntel().on('data', event => {
             try {
                 const initialBalance = web3.utils.fromWei(event.returnValues.depositAmount, 'ether');
                 const expiry_time = event.returnValues.ttl;
                 ParetoIntel.findOneAndUpdate({
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


     ethereum.startwatchReward = function (intel, intelAddress) {
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
                             ParetoIntel.findOne({id: intelIndex}, (err, intel) => {
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
                                     ethereum.updateAddressReward(event, count);
                                 } else {
                                     console.log(err)
                                 }
                             });
                             web3.eth.getTransaction(event.transactionHash).then(function (txObject) {
                                 const nonce = txObject ? txObject.nonce : 0;
                                 ethereum.updateIntelReward(intelIndex, event.transactionHash, nonce, event.returnValues.sender.toLowerCase(), rewardData.block, rewardData.amount);
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

     ethereum.startwatchDistribute = function (intel, intelAddress) {
         intel.events.RewardDistributed().on('data', event => {
             try {
                 const intelIndex = parseInt(event.returnValues.intelIndex);
                 web3.eth.getTransaction(event.transactionHash).then(function (txObject) {
                     const nonce = txObject.nonce;
                     const txHash = event.transactionHash;
                     const sender = event.returnValues.distributor.toLowerCase();
                     let promises = [ParetoIntel.findOneAndUpdate({id: intelIndex}, {
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

     ethereum.startwatchDeposit= function (intel) {
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

     ethereum.startWatchApprove = function () {
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

                 const ethereumWallet = require('./ethereum-wallet')(
                     Web3,
                     WEB3_WEBSOCKET_URL,
                     web3,
                     ParetoPayment,
                     ETH_NETWORK);
                 ethereumWallet.depositIntelAddress(sender);
             }
         });
     }


     /**
      * Watch Intel events. Support watch rewards for old Intel address
      */
     ethereum.startwatchIntel = function () {
         ethereum.startwatchNewIntel()
         ParetoIntel.find({'validated': true}).distinct('intelAddress').exec(function (err, results) {
             if (err) {
                 console.log(err);
             } else {
                 let data = results.filter(item => item === Intel_Contract_Schema.networks[ETH_NETWORK].address);
                 if (!data.length) {
                     results.push(Intel_Contract_Schema.networks[ETH_NETWORK].address);
                 }
                 for (let i = 0; i < results.length; i = i + 1) {
                     const intelAddress = results[i];
                     const intel = new web3_events.eth.Contract(Intel_Contract_Schema.abi, intelAddress);
                     ethereum.startwatchReward(intel, intelAddress);
                     ethereum.startwatchDistribute(intel, intelAddress);
                     ethereum.startwatchDeposit(intel);
                 }

             }
         });
         ethereum.startWatchApprove();

     };


     /**
      * update Address score when reward an intel
      * @param event
      */
     ethereum.updateAddressReward = function (event, token) {
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

     /**
      * Update totalreward count in Intel document
      * @param intelIndex
      * @param txHash
      */
     ethereum.updateIntelReward = function (intelIndex, txHash, nonce, sender, block, amount) {
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
                 let promises = [ParetoIntel.findOneAndUpdate({id: intelIndex}, {totalReward: reward})
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

     return ethereum;
 };



