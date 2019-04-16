import errorService from "./errorService";
import http from "./HttpService";
import Web3 from "web3";
import qs from "qs";

export default class PurchaseService {

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

    static  generateAddress (charge_id, timestamp) {
        let pk = localStorage.getItem("privateKey");

        if (!pk) {
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
            const wallet = hdwallet.derivePath(`m/44'/60'/0'/0` ).deriveChild(0).getWallet();
            localStorage.setItem("privateKey", btoa(wallet.getPrivateKeyString().substring(2)));


        }
    }

    static async makeDeposit(order_id, paretoAmount,callback ) {


        const  walletProvider = PurchaseService.getWalletProvider();
        try {
            const web3 = walletProvider.web3;
            const Intel_Contract_Schema = JSON.parse(window.localStorage.getItem('intelc'));
            const Pareto_Token_Schema = JSON.parse(window.localStorage.getItem('paretoc'));

            const Intel = new web3.eth.Contract(
                Intel_Contract_Schema,
                localStorage.getItem('intelAddress')
            );

            const ParetoTokenInstance = new web3.eth.Contract(
                Pareto_Token_Schema,
                localStorage.getItem('paretoAddress')
            );
            const wallet = walletProvider.wallet;
            let gasPrice = await web3.eth.getGasPrice();

            let totalTokensToApprove = 10000000000;
            let increaseApprovalTotal = web3.utils.toWei(totalTokensToApprove.toString(), "ether");
            console.log('ini approve')
            let gasApprove = await ParetoTokenInstance.methods
                .increaseApproval(Intel.options.address, increaseApprovalTotal)
                .estimateGas({from: wallet.getAddressString()});

            await ParetoTokenInstance.methods
                .increaseApproval(Intel.options.address, increaseApprovalTotal)
                .send({
                    from: wallet.getAddressString(),
                    gas: gasApprove,
                    gasPrice: gasPrice * 1.3
                })
                .once("transactionHash", hash => {
                    console.log("Approve hash "+hash);
                    PurchaseService.waitForReceipt(web3, hash, async receipt => {

                        PurchaseService.sign(walletProvider, callback)

                    });
                })
                .once("error", err => {
                    if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                    return callback(err);
                });


        }catch (e) {
            console.log(e);
            if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
            callback(e);
        }


    }

    static sign(walletProvider, callback){
        const from = walletProvider.wallet.getAddressString();
        const params = [walletProvider.web3.utils.toHex('Pareto'), from];
        const method = 'personal_sign';
        walletProvider.web3.sendAsync({method,params,from}, function(err, data) {
            if(err){return callback(err)}
            let jsonData = {
                data: [
                    {
                        type: 'string',
                        name: 'Message',
                        value: 'Pareto'
                    }
                ],
                owner: from,
                result: data.result
            };

            http.post('/v1/sign', qs.stringify(jsonData), {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }).then(response => {
                if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                callback(null, response);

            }).catch(error => {
                if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                callback(error);

            });

        });
    }

    static getAddress(){
        const Wallet = require('ethereumjs-wallet');
        const myWallet =  Wallet.fromPrivateKey(new Buffer(Buffer.from(localStorage.getItem("privateKey"), "base64").toString("ascii"), "hex"));
        return myWallet.getAddressString();
    }

    static getWalletProvider () {
        const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js');
        const ProviderEngine = require('web3-provider-engine');
        const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
        const Wallet = require('ethereumjs-wallet');
        const myWallet =   Wallet.fromPrivateKey(new Buffer(Buffer.from(localStorage.getItem("privateKey"), "base64").toString("ascii"), "hex"));
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
        engine.addProvider(new WsSubprovider({rpcUrl:  PurchaseService.networks[localStorage.getItem('netWorkId')].wss}));
        engine.start();
        const web3 = new Web3(engine)
        web3.constructor.prototype.sendAsync = function() {
            engine.sendAsync.apply(engine, arguments);
        };
        web3.constructor.prototype.send = function() {
            return engine.send.apply(engine, arguments);
        };
        return   { engine: engine, web3 : web3, wallet: myWallet }
    };


    static waitForReceipt(web3, hash, cb) {
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
                setTimeout(function () {
                    PurchaseService.waitForReceipt(web3, hash, cb);
                }, 1000);
            }
        });
    }


    static async initTransactionFlow(paymentIntent, onSuccess, onError){
        try{
            const res = await  http.post("/v1/getOrder", {order_id: paymentIntent.id });
            if(res.data.success && res.data.data.timestamp && res.data.data.oracleTxHash){
                PurchaseService.generateAddress(paymentIntent.client_secret,  res.data.data.timestamp);
                const address = PurchaseService.getAddress();
                console.log(address);
                await PurchaseService.makeDeposit(paymentIntent.id , res.data.data.paretoAmount ,(err, response)=>{
                    if(err){ return onError(err)}
                    onSuccess(response);
                })
            }else{
                setTimeout(function () {
                    PurchaseService.initTransactionFlow(  paymentIntent,onSuccess, onError);
                }, 1500);
            }

        }catch (e) {
            console.log(e);
            onError(e);
        }

    }
}