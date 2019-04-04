import axios from 'axios';
import http from "./HttpService";
import Web3 from "web3";
import authService from "./authService"
import errorService from "./errorService";

let web3;
let provider;
let accounts;
let Intel;
let ParetoTokenInstance;
let Intel_Contract_Schema;
let Pareto_Token_Schema;
/* eslint-disable no-console */
export default class ContentService {

  static ledgerNanoEngine = null;
  static ledgerWalletSubProvider = null;

  static networks = {
    1: {
      https: "https://mainnet.infura.io/v3/8f0be0e5fb5f470ebd4c1a9cfdcc77dd",
      wss: "wss://mainnet.infura.io/ws/v3/8f0be0e5fb5f470ebd4c1a9cfdcc77dd"
    },
    3: {
      https: "https://ropsten.infura.io/v3/8f0be0e5fb5f470ebd4c1a9cfdcc77dd",
      wss: "wss://ropsten.infura.io/ws/v3/8f0be0e5fb5f470ebd4c1a9cfdcc77dd"
    }
  };

  static uploadContent(content, onSuccess, onError) {
    http
      .post("/v1/content", content)
      .then(res => {
        if (res.data.success) {
          return onSuccess(res.data.data);
        } else {
          return onError(errorService.sendErrorMessage('f15', res.data.message));
        }
      })
      .catch(error => {
        return onError(error);
      });
  }

  static getParetoInfo(onSuccess, onError) {
    http.get("/v1/coinmarket-pareto")
      .then(res => {
        if (res.data.success) {
          return onSuccess(res.data.data.data.PARETO);
        } else {
          return onError(errorService.sendErrorMessage('f16', 'Could not retrieve data from server'));
        }
      })
  }

  static getTransactions(params, onSuccess, onError) {
    return http.get("/v1/transaction", {params})
      .then(res => {
        if (res.data.success) {
          return onSuccess(res.data.data);
        } else {
          return onError(errorService.sendErrorMessage('f6', res.data.message));
        }
      });
  }

  static postTransactions(params, onSucess, onError) {
    http.post("/v1/transaction", params)
      .then(
        res => {
          if (res.data.message || !res.data.success) {
            errorService.sendErrorMessage('f18', res.data.message);
          }
        });
  }

  static async getStimatedGasPrice(OnSuccess, OnError) {
    let provider;
    if (typeof web3 !== 'undefined') {
      provider = new Web3(web3.currentProvider);
    } else {
      provider = new Web3(new Web3.providers.HttpProvider(ContentService.networks[window.localStorage.getItem('netWorkId')].https));
    }

    let gasPriceWei = await provider.eth.getGasPrice();

    let gasPrice = await provider.utils.fromWei(gasPriceWei + "", 'gwei');

    gasPrice ? OnSuccess(gasPrice) : OnError('There was a problem fetching the current recommended gas price');
  }

  static async pendingTransactionApproval(content, signData, events, onSuccess, onError) {
    try {
      await this.Setup(signData);
      Intel = new web3.eth.Contract(
        Intel_Contract_Schema,
        content.intelAddress
      );
      const accounts = await web3.eth.getAccounts();

      let gasPrice = await web3.eth.getGasPrice();

      const depositAmount = web3.utils.toWei(content.amount.toString(), "ether");
      const desiredReward = depositAmount;

      if (accounts[0].toLowerCase() == content.address.toLowerCase()) {
        switch (content.event) {
          case "reward":
            const rewarder_address = accounts[0];
            switch (content.status) {
              case 0: {
                waitForReceipt(content.txHash, async receipt => {
                  events.toastTransaction({
                    group: 'notification',
                    title: 'Event Ready',
                    type: 'warning',
                    duration: 10000,
                    text: 'Second transaction ready, complete it'
                  });
                  events.editTransaction({hash: content.txHash, key: 'status', value: 1});

                  ContentService.sendReward(null,true, Intel, {
                    intel: content.intel,
                    depositAmount: depositAmount,
                    txHash: content.txHash,
                    rewarder_address: rewarder_address,
                    gasPrice: gasPrice
                  }, events, onSuccess, onError);
                });
                break;
              }
              case 1: {
                ContentService.sendReward(null, true, Intel, {
                  intel: content.intel,
                  depositAmount: depositAmount,
                  txHash: content.txHash,
                  rewarder_address: rewarder_address,
                  gasPrice: gasPrice
                }, events, onSuccess, onError);
                break;
              }
              case 2: {
                waitForReceipt(content.txRewardHash, receipt => {
                  if (ContentService.ledgerNanoEngine) {
                    ContentService.ledgerNanoEngine.stop();
                  }
                  events.editTransaction({hash: content.txHash, key: 'status', value: 3});
                  onSuccess("success");
                });
                break;
              }
            }

            break;
          case "create":
            const provider_address = accounts[0];
            const _ttl = Math.round(new Date().getTime() / 1000) + 864000;

            switch (content.status) {
              case 0:
                waitForReceipt(content.txHash, async receipt => {
                  events.editTransaction({hash: content.txHash, key: 'status', value: 1});

                  events.toastTransaction({
                    group: 'notification',
                    title: 'Event Ready',
                    type: 'warning',
                    duration: 10000,
                    text: 'Second transaction ready, complete it'
                  });

                  content = {
                    provider_address,
                    depositAmount,
                    desiredReward,
                    _ttl,
                    txHash: content.txHash,
                    intel: content.intel,
                    gasPrice: gasPrice
                  };

                  this.sendCreate(null, true, content, events, onSuccess, onError);
                });
                break;
              case 1:
                content = {
                  provider_address,
                  depositAmount,
                  desiredReward,
                  _ttl,
                  txHash: content.txHash,
                  intel: content.intel,
                  gasPrice: gasPrice
                };
                this.sendCreate(null, true, content, events, onSuccess, onError);
                break;
              case 2:
                waitForReceipt(content.txHash, receipt => {
                  if (ContentService.ledgerNanoEngine) {
                    ContentService.ledgerNanoEngine.stop();
                  }
                  events.editTransaction({hash: content.txHash, key: 'status', value: 3});
                  onSuccess("successfull");
                });
            }
            break;
        }
      } else {
        return onError(errorService.sendErrorMessage('f36', e));
      }
    } catch (e) {
      return onError(errorService.sendErrorMessage('f20', e));
    }
  }

  static async sendCreate(title, withIncreaseApproval, content, events, onSuccess, onError) {
    try {
      let gasCreateIntel = await Intel.methods
        .create(
          content.provider_address,
          content.depositAmount,
          content.desiredReward,
          content.intel,
          content._ttl
        )
        .estimateGas({from: content.provider_address});

      await Intel.methods
        .create(
          content.provider_address,
          content.depositAmount,
          content.desiredReward,
          content.intel,
          content._ttl
        )
        .send({
          from: content.provider_address,
          gas: gasCreateIntel,
          gasPrice: content.gasPrice
        })
        .on("transactionHash", hash => {
            content.txHash = hash;
            content.txRewardHash = hash;
            content.status = 2;
            if(title){
                content.intelData = {title: title};
            }
            events.addTransaction(content);
            ContentService.postTransactions(content);

            waitForNonce(hash,( txObject)=>{
                if(txObject){
                    const  nonce = txObject.nonce;
                    content.txHash = hash;
                    content.txRewardHash = hash;
                    content.status =  txObject.blockNumber? 3 :  2;
                    content.nonce = nonce;
                    if(title){
                        content.intelData = {title: title};
                    }
                    ContentService.postTransactions(content);
                }
             });



          waitForReceipt(hash, receipt => {
            if (ContentService.ledgerNanoEngine) {
              ContentService.ledgerNanoEngine.stop();
            }
            events.editTransaction({hash: content.txHash, key: 'status', value: 3});
            events.editTransaction({hash: content.txHash, intelInfo: 'status', value: 'noFetch'});

            let params = {
              txHash: content.txHash,
              status: 3
            };
            ContentService.postTransactions(params);
            onSuccess({success: true, res: content});
          });
        })
        .on("error", err => {
          console.log(err);
          if (ContentService.ledgerNanoEngine) {
            ContentService.ledgerNanoEngine.stop();
          }
          events.editTransaction({hash: content.txHash, key: 'status', value: 4});

          onError(errorService.sendErrorMessage('f19', err.message || err));
        });

    } catch (e) {
      console.log(e);
      let params = {
        txHash: content.txHash,
        status: 4
      };
      this.postTransactions(params);

      events.editTransaction({hash: content.txHash, key: 'status', value: 4});
      events.toastTransaction({
        group: 'notification',
        title: 'Error:',
        type: 'error',
        duration: 10000,
        text: errorService.sendErrorMessage('f19', e)
      });
    }
  }

  static async createIntel(serverData, tokenAmount, signData, events, onSuccess, onError) {
    try {
      await this.Setup(signData);
    } catch (e) {
      return onError(errorService.sendErrorMessage('f35', e));
    }
    //console.log(tokenAmount);

    if (tokenAmount === null) {
      let error = "No Pareto Amount. Transaction cancelled";
      onError(errorService.sendErrorMessage('f33', error));
      return;
    }

    web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError(errorService.sendErrorMessage('f34', err));
        return;
      }

      let gasPrice = await web3.eth.getGasPrice();

      const provider_address = accounts[0];
      if (serverData.address.toLowerCase() !== provider_address.toLowerCase()) {
        onError(errorService.sendErrorMessage('f36', err));
        return;
      }

      const _ttl = Math.round(new Date().getTime() / 1000) + 864000; // add 10 days minutes to allow the rewarder to reward pareto tokens to the intel (temporary)

      let params = {
        intelAddress: Intel.options.address,
        address: serverData.address,
        amount: tokenAmount,
        event: 'create',
        status: 0,
        clicked: true,
        dateCreated: new Date()
      };

      const depositAmount = web3.utils.toWei(tokenAmount.toString(), "ether");
      const desiredReward = depositAmount;

      let userAllowance = 0;
      //Compares last used contract address to current using contract address
      //if not the same, compares the user allowance
      if (serverData.lastApproved && (serverData.lastApproved.toLowerCase() === Intel.options.address.toLowerCase())) {
        directlyCreateIntel();
      } else {
        await ParetoTokenInstance.methods
          .allowance(provider_address, Intel.options.address).call().then(async res => {
            userAllowance = parseFloat(res) ;

            (userAllowance < parseFloat(depositAmount)) ? await userIncreaseApproval() : directlyCreateIntel();
          });
      }

      function directlyCreateIntel() {
        params.depositAmount = depositAmount;
        params.gasPrice = gasPrice;
        params.provider_address = provider_address;
        params.desiredReward = desiredReward;
        params._ttl = _ttl;

        ContentService.uploadContent(serverData, async res => {
          params.intel = res.content.Intel_ID;
          ContentService.sendCreate(serverData.title, false, params, events, onSuccess, onError);
        });
      }

      async function userIncreaseApproval() {
        ContentService.uploadContent(
          serverData,
          async res => {
            params.intel = res.content.Intel_ID;

            let totalTokensToApprove = 10000000000;
            let increaseApprovalTotal = web3.utils.toWei(totalTokensToApprove.toString(), "ether");

            let gasApprove = await ParetoTokenInstance.methods
              .increaseApproval(Intel.options.address, increaseApprovalTotal)
              .estimateGas({from: provider_address});

            await ParetoTokenInstance.methods
              .increaseApproval(Intel.options.address, increaseApprovalTotal)
              .send({
                from: provider_address,
                gas: gasApprove,
                gasPrice
              })
              .once("transactionHash", hash => {
                  const data = {};
                  data.txHash = hash;
                  data.status = 0;
                  data.event = "approve";
                  if(serverData.title){
                      data.intelData = {title: serverData.title};
                  }
                  events.addTransaction(data);

                  ContentService.postTransactions(data);
                  waitForNonce(hash,  (txObject)=>{
                      if(txObject){
                          const content = {};
                          const  nonce = txObject.nonce;
                          content.txHash = hash;
                          content.status = txObject.blockNumber? 1 :  0;
                          content.event = "approve";
                          content.nonce = nonce;
                          if(serverData.title){
                              content.intelData = {title: serverData.title};
                          }

                          ContentService.postTransactions(content);
                      }
                      });
                var txHash = hash;

                waitForReceipt(hash, async receipt => {
                  serverData.approveHash = txHash;
                  events.editTransaction({hash: hash, key: 'status', value: 1});

                  events.toastTransaction({
                    group: 'notification',
                    title: 'Event Ready',
                    type: 'warning',
                    duration: 10000,
                    text: 'Second transaction ready, complete it'
                  });

                  const newContent = {
                    provider_address,
                    depositAmount,
                    desiredReward,
                    _ttl,
                    txHash: txHash,
                    intel: res.content.Intel_ID,
                    gasPrice: gasPrice
                  };

                  ContentService.sendCreate(serverData.title, true, newContent, events, onSuccess, onError);
                });
              })
              .on("error", err => {
                let error = err.message || err;
                onError(errorService.sendErrorMessage('f19', error));
              });
          });
      }
    });
  }

  static async sendReward(title, withIncreasedApproval, Intel, content, events, onSuccess, onError) {
    try {
      const gasSendReward = await Intel.methods
        .sendReward(content.intel, content.depositAmount)
        .estimateGas({from: content.address});

      await Intel.methods
        .sendReward(content.intel, content.depositAmount)
        .send({
          from: content.address,
          gas: gasSendReward,
          gasPrice: content.gasPrice
        })
        .on("transactionHash", hash => {

            content.txHash = hash;
            content.txRewardHash = hash;
            content.status = 2;
            if(title){
                content.intelData = {title: title}
            }
            events.addTransaction(content);
            ContentService.postTransactions(content);
            waitForNonce(hash, (txObject)=>{
                if(txObject){
                    const  nonce = txObject.nonce;
                    content.txHash = hash;
                    content.txRewardHash = hash;
                    content.status = txObject.blockNumber? 3 :  2;
                    content.nonce = nonce;
                    if(title){
                        content.intelData = {title: title}
                    }
                    ContentService.postTransactions(content);
                }
                }) ;
          waitForReceipt(hash, receipt => {
            if (ContentService.ledgerNanoEngine) {
              ContentService.ledgerNanoEngine.stop();
            }
            events.editTransaction({hash: content.txHash, key: 'status', value: 3});
            onSuccess("Transaction Completed");
          });
        })
        .on("error", error => {

          if (ContentService.ledgerNanoEngine) {
            ContentService.ledgerNanoEngine.stop();
          }
          events.editTransaction({hash: content.txHash, key: 'status', value: 4});
          onError(errorService.sendErrorMessage('f21', error));
        });
    } catch (e) {
      let params = {
        txHash: content.txHash,
        status: 4
      };
      this.postTransactions(params);

      events.editTransaction({hash: content.txHash, key: 'status', value: 4});
      events.toastTransaction({
        group: 'notification',
        title: 'Error:',
        type: 'error',
        duration: 10000,
        text: errorService.sendErrorMessage('f21', e)
      });
    }
  }

  //Activates when an user wants to make a reward to an intel
  static async rewardIntel(content, signData, events, onSuccess, onError) {
    try {
      await this.Setup(signData);
    } catch (e) {
      return onError(errorService.sendErrorMessage('f35', e));
    }
    web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError(errorService.sendErrorMessage('f34', err));
        return;
      }
      const rewarder_address = accounts[0];
      if (content.address.toLowerCase() !== rewarder_address.toLowerCase()) {
        onError(errorService.sendErrorMessage('f36', err));
        return;
      }

      Intel = new web3.eth.Contract(
        Intel_Contract_Schema,
        content.intelAddress
      );

      let gasPrice = await web3.eth.getGasPrice();

      const depositAmount = web3.utils.toWei(content.tokenAmount.toString(), "ether");

      let userAllowance = 0;

      let params = {
        address: rewarder_address,
        intel: content.ID,
        amount: content.tokenAmount,
        event: 'reward',
        intelAddress: content.intelAddress,
        status: 0,
        clicked: true,
        dateCreated: new Date()
      };

      //Compares last used contract address to current using contract address
      //if not the same, compares the user allowance
      if (content.lastApproved && (content.lastApproved.toLowerCase() === content.intelAddress.toLowerCase())) {
        directlyCreateReward();
      } else {
        await ParetoTokenInstance.methods
          .allowance(rewarder_address, Intel.options.address).call().then(async res => {
            userAllowance = parseFloat(res);
            (userAllowance < parseFloat(depositAmount)) ? await userIncreaseApproval() : directlyCreateReward();
          });
      }
        //Calls the reward function if the user last contract matches or if the user has the allowance
      function directlyCreateReward() {
        params.depositAmount = depositAmount;
        params.gasPrice = gasPrice;
        ContentService.sendReward(content.title, false, Intel, params, events, onSuccess, onError);
      }

      //Does the increase approval for an user if the allowance is less than the token amount
      async function userIncreaseApproval() {

        let totalTokensToApprove = 10000000000;
        let increaseApprovalTotal = web3.utils.toWei(totalTokensToApprove.toString(), "ether");

        //Calculates the gas for the increase approval transaction
        let gasApprove = await ParetoTokenInstance.methods
          .increaseApproval(Intel.options.address, increaseApprovalTotal)
          .estimateGas({from: rewarder_address});

        await ParetoTokenInstance.methods
          .increaseApproval(Intel.options.address, increaseApprovalTotal)
          .send({
            from: rewarder_address,
            gas: gasApprove,
            gasPrice
          })
          .on("transactionHash", hash => {

              const data = {};
              data.txHash = hash;
              data.status = 0;
              data.event = "approve";
              data.intelData = {title: content.title};
              events.addTransaction(data);

              ContentService.postTransactions(data);

               waitForNonce(hash, (txObject)=>{
                   if(txObject){
                       const param = {};
                       const  nonce = txObject.nonce;
                       param.txHash = hash;
                       param.status = txObject.blockNumber? 1 :  0;
                       param.event = "approve";
                       param.nonce = nonce;
                       param.intelData = {title: content.title};

                       ContentService.postTransactions(param);
                   }
               });
            //The transaction will be send to vuex and the database
            var txHash = hash;
            params.txHash = txHash;

            //Wait for the transaction to be complete
            waitForReceipt(hash, async receipt => {
              events.toastTransaction({
                group: 'notification',
                title: 'Event Ready',
                type: 'warning',
                duration: 10000,
                text: 'Second transaction ready, complete it'
              });
              events.editTransaction({hash: hash, key: 'status', value: 1});

              ContentService.sendReward(content.title, true, Intel, {
                intel: content.ID,
                depositAmount: depositAmount,
                txHash: txHash,
                address: rewarder_address,
                gasPrice: gasPrice
              }, events, onSuccess, onError);
            });
          })
          .on("error", err => {
            onError(err);
          });
      }
    });
  }

  static async distributeRewards(content, signData, events, onSuccess, onError) {
    try {
      await this.Setup(signData);
      Intel = new web3.eth.Contract(
        Intel_Contract_Schema,
        content.intelAddress
      );
    } catch (e) {
      return onError(errorService.sendErrorMessage('f35', e));
    }

    web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError(errorService.sendErrorMessage('f34', err));
        return;
      }
      const distributor = accounts[0];
      let gasDistribute = {};

      try {
        gasDistribute = await Intel.methods
          .distributeReward(content.ID)
          .estimateGas({from: distributor});

        events.addDistribute({
          intel: content.ID,
          event: 'distribute',
          status: 0,
          clicked: true,
          intelData: {title: content.title} ,
          dateCreated: new Date()
        });

        let gasPrice = await web3.eth.getGasPrice();
        await Intel.methods
          .distributeReward(content.ID)
          .send({
            from: distributor,
            gas: gasDistribute,
            gasPrice
          })
          .on("transactionHash", hash => {


              web3.eth.getTransaction(hash).then( (txObject)=>{
                  const  nonce = txObject.nonce;
                  let params = {
                      address: distributor,
                      txHash: hash,
                      intel: content.ID,
                      amount: 0,
                      event: 'distribute',
                      intelAddress: content.intelAddress,
                      status: 0,
                      nonce: nonce,
                      clicked: true,
                      dateCreated: new Date()
                  };

                  ContentService.postTransactions(params);
              }).catch(function (err) {
                  console.log(err);
              });

            waitForReceipt(hash, receipt => {
              if (ContentService.ledgerNanoEngine) {
                ContentService.ledgerNanoEngine.stop();
              }
              onSuccess("Transaction Completed");
            });
          })
          .on("error", error => {
            if (ContentService.ledgerNanoEngine) {
              ContentService.ledgerNanoEngine.stop();
            }
            onError(errorService.sendErrorMessage('f22', error));
          });
      } catch (e) {
        onError(errorService.sendErrorMessage('f22', e));
      }
    });
  }


  static async Setup(signData) {
    Intel_Contract_Schema = JSON.parse(window.localStorage.getItem('intelc'));
    Pareto_Token_Schema = JSON.parse(window.localStorage.getItem('paretoc'));
    const signType = signData.signType;
    const pathId = signData.pathId;
    if (ContentService.ledgerNanoEngine) {
      ContentService.ledgerNanoEngine.stop();
    }
    switch (signType) {
      case  'LedgerNano': {
        const ProviderEngine = require('web3-provider-engine');
        const WsSubprovider = require('web3-provider-engine/subproviders/websocket');
        var LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
        this.ledgerNanoEngine = new ProviderEngine();
        const networkId = window.localStorage.getItem('netWorkId');
        this.ledgerWalletSubProvider = await LedgerWalletSubproviderFactory(() => networkId, pathId);
        this.ledgerWalletSubProvider.ledger.setDerivationPath(pathId);
        this.ledgerNanoEngine.addProvider(this.ledgerWalletSubProvider);
        this.ledgerNanoEngine.addProvider(new WsSubprovider({rpcUrl: ContentService.networks[networkId].wss})); // you need RPC endpoint
        this.ledgerNanoEngine.start();
        provider = this.ledgerNanoEngine;
        break;
      }
      default: {
        window.web3 = await authService.onMetamaskAccess();
        if (typeof window.web3 !== "undefined") {
          // Use Mist/MetaMask's provider
          provider = new Web3(window.web3.currentProvider);
        } else {


          // searchLookup();
          // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
          provider = new Web3(
            new Web3.providers.HttpProvider(
              ContentService.networks[window.localStorage.getItem('netWorkId')].https
            )
          );
        }
        break;
      }
    }


    web3 = new Web3(provider);
    Intel = new web3.eth.Contract(
      Intel_Contract_Schema,
      window.localStorage.getItem('intelAddress')
    );

    ParetoTokenInstance = new web3.eth.Contract(
      Pareto_Token_Schema,
      window.localStorage.getItem('paretoAddress')
    );
    if (typeof provider !== "undefined") {
      return;
    }


  }
}

function waitForReceipt(hash, cb) {
  web3.eth.getTransactionReceipt(hash, function (err, receipt) {
    if (err) {
      error(err);
    }

    if (receipt !== null) {
      // Transaction went through
      if (cb) {
        cb(receipt);
      }
    } else {
      // Try again in 1 second
      window.setTimeout(function () {
        waitForReceipt(hash, cb);
      }, 1000);
    }
  });
}


function waitForNonce(hash, cb) {
    web3.eth.getTransaction(hash, function (err, txObject) {
        if (err) {
            error(err);
        }

        if (txObject !== null) {
            // Transaction went through
            if (cb) {
                cb(txObject);
            }
        } else {
            // Try again in 1 second
            setTimeout(function () {
                waitForNonce(hash, cb);
            }, 400);
        }
    });
}
