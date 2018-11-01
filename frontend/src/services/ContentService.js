import axios from 'axios';
import http from "./HttpService";
import Web3 from "web3";
import authService from "./authService"

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
          https: "https://mainnet.infura.io/QWMgExFuGzhpu2jUr6Pq",
          wss: "wss://mainnet.infura.io:443/ws"
      },
      3: {
          https: "https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq",
          wss: "wss://ropsten.infura.io/ws"
      }
  };

  static uploadContent(content, onSuccess, onError) {
    http
      .post("/v1/content", content)
      .then(res => {
        if (res.data.success) {
          return onSuccess(res.data.data);
        } else {
          return onError(res.data.message);
        }
      })
      .catch(error => {
        return onError(error);
      });
  }

  static getParetoInfo(onSuccess, onError){
      http.get("/v1/coinmarket-pareto")
          .then(res => {
              if(res.data.success){
                  return onSuccess(res.data.data.data.PARETO);
              }else{
                  return onError('Could not retrieve data from server');
              }
          })
  }

  static async getStimatedGasPrice(OnSuccess, OnError){
      let provider;
      if (typeof web3 !== 'undefined') {
          provider = new Web3(web3.currentProvider);
      } else {
          provider = new Web3(new Web3.providers.HttpProvider(ContentService.networks[window.localStorage.getItem('netWorkId')].https));
      }

      let gasPriceWei = await provider.eth.getGasPrice();

      let gasPrice = await provider.utils.fromWei(gasPriceWei+"", 'gwei');

      gasPrice? OnSuccess(gasPrice) : OnError('There was a problem fetching the current recommended gas price');
  }

  static async createIntel(serverData, tokenAmount, signData,onSuccess, onError) {
      try{
          await this.Setup(signData);
      }catch (e) {
          return onError(e)
      }
      //console.log(tokenAmount);

    if (tokenAmount === null) {
      let error = "No Pareto Amount. Transaction cancelled";
      onError(error);
      return;
    }

    web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError("Err getting accounts");
        return;
      }

      let gasPrice = await web3.eth.getGasPrice();
      const provider_address = accounts[0];

      
      const _ttl = Math.round(new Date().getTime() / 1000) + 864000; // add five seconds to to allow the rewarder to reward pareto tokens

      const decimals = web3.utils.toBN(18);
      const amount = web3.utils.toBN(parseFloat(tokenAmount));
      const depositAmount = amount.mul(web3.utils.toBN(10).pow(decimals));

      const desiredReward = "100";

      let gasApprove = await ParetoTokenInstance.methods
        .approve(Intel.options.address, depositAmount)
        .estimateGas({ from: provider_address });

      
      await ParetoTokenInstance.methods
        .approve(Intel.options.address, depositAmount)
        .send({
          from: provider_address,
          gas: gasApprove,
          gasPrice
        })
        .once("transactionHash", function(hash) {
          waitForReceipt(hash, receipt => {
           // console.log(receipt);

            ContentService.uploadContent(
              serverData,
              async res => {
                let gasCreateIntel = await Intel.methods
                  .create(
                    provider_address,
                    depositAmount,
                    web3.utils.toWei(desiredReward, "ether"),
                    res.content.Intel_ID,
                    _ttl
                  )
                  .estimateGas({ from: provider_address });

                await Intel.methods
                  .create(
                    provider_address,
                    depositAmount,
                    web3.utils.toWei(desiredReward, "ether"),
                    res.content.Intel_ID,
                    _ttl
                  )
                  .send({
                    from: provider_address,
                    gas: gasCreateIntel,
                    gasPrice
                  })
                  .on("transactionHash", hash => {
                    waitForReceipt(hash, receipt => {
                        if(ContentService.ledgerNanoEngine){ContentService.ledgerNanoEngine.stop();}
                      onSuccess("successfull");
                    });
                  })
                  .on("error", err => {
                      if(ContentService.ledgerNanoEngine){ContentService.ledgerNanoEngine.stop();}
                    onError(err.message || err);
                  });
              },
              err => {
                onError(err.message || err);
              }
            );
          });
        })
        .on("error", err => {
          onError(err.message || err);
        });
    });
  }

  static async rewardIntel(content,signData, onSuccess, onError) {
      try{
          await this.Setup(signData);
      }catch (e) {
          return onError(e)
      }
      web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError("Err getting accounts");
        return;
      }
        Intel = new web3.eth.Contract(
            Intel_Contract_Schema,
            content.intelAddress
        );
      let gasPrice = await web3.eth.getGasPrice();

      const rewarder_address = accounts[0];
      const decimals = web3.utils.toBN(18);
      const amount = web3.utils.toBN(parseFloat(content.tokenAmount));
      const depositAmount =  amount.mul(web3.utils.toBN(10).pow(decimals));
      let gasApprove = await ParetoTokenInstance.methods
        .approve(Intel.options.address, depositAmount)
        .estimateGas({ from: rewarder_address });

      await ParetoTokenInstance.methods
        .approve(Intel.options.address, depositAmount)
        .send({
          from: rewarder_address,
          gas: gasApprove,
          gasPrice
        })
        .on("transactionHash", hash => {
          waitForReceipt(hash, async receipt => {
            const gasSendReward = await Intel.methods
              .sendReward(content.ID, depositAmount)
              .estimateGas({ from: rewarder_address });
            await Intel.methods
              .sendReward(content.ID, depositAmount)
              .send({
                from: rewarder_address,
                gas: gasSendReward,
                gasPrice
              })
              .on("transactionHash", hash => {
                waitForReceipt(hash, receipt => {
                    if(ContentService.ledgerNanoEngine){ContentService.ledgerNanoEngine.stop();}
                  onSuccess("success");
                });
              })
              .on("error", error => {
                  if(ContentService.ledgerNanoEngine){ContentService.ledgerNanoEngine.stop();}
                onError(error);
              });
          });
        })
        .on("error", err => {
          onError(err);
        });
    });
  }

  static async distributeRewards(content, signData,onSuccess, onError) {
      try{
          await this.Setup(signData);
      }catch (e) {
          return onError(e)
      }

    web3.eth.getAccounts(async (err, accounts) => {
      if (err) {
        onError("Err getting accounts");
        return;
      }
      const distributor = accounts[0];

      let gasDistribute = await Intel.methods
        .distributeReward(content.ID)
        .estimateGas({ from: distributor });

      let gasPrice = await web3.eth.getGasPrice();

      await Intel.methods
        .distributeReward(content.ID)
        .send({
          from: distributor,
          gas: gasDistribute,
          gasPrice
        })
        .on("transactionHash", hash => {
          waitForReceipt(hash, receipt => {
            onSuccess("success");
          });
        })
        .on("error", error => {
          onError(error);
        });
    });
  }


  static async Setup(signData) {
      Intel_Contract_Schema = JSON.parse(window.localStorage.getItem('intelc')) ;
      Pareto_Token_Schema = JSON.parse(window.localStorage.getItem('paretoc'));
      const signType = signData.signType;
      const pathId = signData.pathId;
      if(ContentService.ledgerNanoEngine){ContentService.ledgerNanoEngine.stop();}
      switch (signType){
          case  'LedgerNano':{
              const ProviderEngine = require('web3-provider-engine');
              const WsSubprovider = require('web3-provider-engine/subproviders/websocket');
              var LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
              this.ledgerNanoEngine = new ProviderEngine();
              const networkId = 3;
              this.ledgerWalletSubProvider  = await LedgerWalletSubproviderFactory(() => networkId, pathId) ;
              this.ledgerWalletSubProvider.ledger.setDerivationPath(pathId);
              this.ledgerNanoEngine.addProvider(this.ledgerWalletSubProvider);
              this.ledgerNanoEngine.addProvider(new WsSubprovider({rpcUrl: ContentService.networks[window.localStorage.getItem('netWorkId')].wss})); // you need RPC endpoint
              this.ledgerNanoEngine.start();
              provider = this.ledgerNanoEngine;
              break;
          }
          default: {
              window.web3 =  await authService.onMetamaskAccess();
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
  web3.eth.getTransactionReceipt(hash, function(err, receipt) {
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
      window.setTimeout(function() {
        waitForReceipt(hash, cb);
      }, 1000);
    }
  });
}
