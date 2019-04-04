import errorService from "./errorService";
import http from "./HttpService";
import Web3 from "web3";

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

    static  generateAddress() {
        let pk = localStorage.getItem("privateKey");

        if (!pk) {
            const web3 =  new Web3( new Web3.providers.HttpProvider(PurchaseService.networks[localStorage.getItem('netWorkId')].https));
            console.log(web3.eth);
            const userInfo = web3.eth.accounts.create();
            console.log(userInfo.privateKey);
            localStorage.setItem("privateKey", btoa(userInfo.privateKey.slice(2)));
        }
    }

    static async makeDeposit(amount, order_id, callback ) {


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
            let amountPareto = web3.utils.toWei(amount.toString(), "ether");
            let gasPrice = await web3.eth.getGasPrice();

            let totalTokensToApprove = 10000000000;
            let increaseApprovalTotal = web3.utils.toWei(totalTokensToApprove.toString(), "ether");

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
                        console.log("Receipt ");
                        let gasApprove = await Intel.methods
                            .makeDeposit(wallet.getAddressString(), amountPareto)
                            .estimateGas({from: wallet.getAddressString()});
                        await Intel.methods
                            .makeDeposit(wallet.getAddressString(), amountPareto)
                            .send({
                                from: wallet.getAddressString(),
                                gas: gasApprove,
                                gasPrice: gasPrice * 1.3
                            })
                            .once("transactionHash", async (hash) => {
                                console.log("deposit hash "+hash);
                                try{
                                    const r = await http.post("/v1/updateTransaction", {txHash: hash, order_id: order_id });
                                } catch (e) { }
                                PurchaseService.waitForReceipt(web3, hash, async receipt => {
                                    console.log("Receipt ");
                                    try{
                                        const r = await http.post("/v1/updateTransaction", {txHash: hash, order_id: order_id, processed: true });
                                    } catch (e) { }
                                    if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                                    callback(null, receipt);
                                });
                            })
                            .once("error", err => {
                                if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                                return callback(err);
                            });

                    });
                })
                .once("error", err => {
                    if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
                    return callback(err);
                });


        }catch (e) {
            if(walletProvider.engine){ try{  walletProvider.engine.stop(); }catch (e) { } }
            callback(e);
        }


    }


    static getAddress(){
        const Wallet = require('ethereumjs-wallet');
        console.log(atob(localStorage.getItem("privateKey")));
        const myWallet =  Wallet.fromPrivateKey( Buffer.from(atob(localStorage.getItem("privateKey")),'hex'));
        return myWallet.getAddressString();
    }

    static getWalletProvider () {
        const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
        const ProviderEngine = require('web3-provider-engine');
        const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
        const Wallet = require('ethereumjs-wallet');
        const myWallet =  Wallet.fromPrivateKey( Buffer.from(atob(localStorage.getItem("privateKey")),'hex'));
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
        return   { engine: engine, web3 : new Web3(engine), wallet: myWallet }
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
                    PurchaseService.waitForReceipt(hash, cb);
                }, 1000);
            }
        });
    }


    static async initTransactionFlow(order_id, onSuccess, onError){
        PurchaseService.generateAddress();
        try{
            const address = PurchaseService.getAddress();
            console.log(address);
            const res = await  http.post("/v1/maketransaction", {order_id: order_id, address: address });
            const amount = res.data.data.amount;
            const eth = res.data.data.eth;
            console.log(res.data.data);
            await PurchaseService.makeDeposit(amount, order_id, (err, response)=>{
                if(err){ return onError(err)}
                onSuccess(response);
            })

        }catch (e) {
            onError(e);
        }

    }
}