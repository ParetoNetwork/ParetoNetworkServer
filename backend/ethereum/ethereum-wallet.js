module.exports = function (
    Web3,
    WEB3_WEBSOCKET_URL,
    web3,
    ParetoPayment,
    ETH_NETWORK
) {
    let eth_wallet = {};

    /**
     *
     *  Functions to Transfer pareto and Eth
     *
     */

    /**
     * Get a wallet provider to make transactions
     * @return {{engine: Web3ProviderEngine, web3: Web3}}
     */
    eth_wallet.getParetoWalletProvider = function () {
        const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
        const ProviderEngine = require('web3-provider-engine');
        const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
        const Wallet = require('ethereumjs-wallet');
        const myWallet = Wallet.fromPrivateKey(new Buffer(Buffer.from(process.env.DP_ORACLE_SYS, "base64").toString("ascii"), "hex"));
        const engine = new ProviderEngine();
        engine.addProvider(new HookedWalletSubprovider({
            getAccounts: function (cb) {
                cb(null, [myWallet.getAddressString()]);
            },
            getPrivateKey: function (address, cb) {
                if (address !== myWallet.getAddressString()) {
                    cb(new Error('Account not found'))
                } else {
                    cb(null, myWallet.getPrivateKey())
                }
            }
        }));
        engine.addProvider(new WsSubprovider({rpcUrl: WEB3_WEBSOCKET_URL}));
        engine.start();
        return {engine: engine, web3: new Web3(engine), wallet: myWallet}
    };


    /**
     * Get a wallet provider to make transactions
     * @return {{engine: Web3ProviderEngine, web3: Web3}}
     */
    eth_wallet.getEthereumWalletProvider = function () {
        const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js')
        const ProviderEngine = require('web3-provider-engine');
        const WsSubprovider = require('web3-provider-engine/subproviders/websocket.js');
        const Wallet = require('ethereumjs-wallet');
        const myWallet = Wallet.fromPrivateKey(new Buffer(Buffer.from(process.env.DE_ORACLE_SYS, "base64").toString("ascii"), "hex"));
        const engine = new ProviderEngine();
        engine.addProvider(new HookedWalletSubprovider({
            getAccounts: function (cb) {
                cb(null, [myWallet.getAddressString()]);
            },
            getPrivateKey: function (address, cb) {
                if (address !== myWallet.getAddressString()) {
                    cb(new Error('Account not found'))
                } else {
                    cb(null, myWallet.getPrivateKey())
                }
            }
        }));
        engine.addProvider(new WsSubprovider({rpcUrl: WEB3_WEBSOCKET_URL}));
        engine.start();
        return {engine: engine, web3: new Web3(engine), wallet: myWallet}
    };


    eth_wallet.generateAddress = function (charge_id, timestamp) {
        const bip39 = require('bip39');
        const hdkey = require('ethereumjs-wallet/hdkey');
        const toHex = function (str) {
            var result = '';
            for (var i = 0; i < str.length; i++) {
                result += str.charCodeAt(i).toString(16);
            }
            return result;
        }
        const seed = bip39.mnemonicToSeed(bip39.entropyToMnemonic(toHex(charge_id.slice(-8) + timestamp.slice(-8))));
        const hdwallet = hdkey.fromMasterSeed(seed);
        return hdwallet.derivePath(`m/44'/60'/0'/0`).deriveChild(0).getWallet().getAddressString();
    }


    /**
     *
     * @param address ToAddress
     * @param amount  amount of pareto that will send to address
     * @param callback
     * @return {Promise<void>}
     */
    eth_wallet.makeParetoTransaction = async function (address, amount) {
        return new Promise(async function (resolve, reject) {
            const walletProvider = eth_wallet.getParetoWalletProvider();
            try {

                const Pareto_Token_Schema = require("../../build/contracts/ParetoNetworkToken.json");
                const Pareto_Address = process.env.CRED_PARETOCONTRACT;
                const web3 = walletProvider.web3;
                const wallet = walletProvider.wallet;
                const ParetoTokenInstance = new web3.eth.Contract(Pareto_Token_Schema.abi, Pareto_Address);
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
                        gasPrice: gasPrice * 1.3
                    })
                    .once('transactionHash', function (hash) {
                        eth_wallet.waitForReceipt(hash, async (err, receipt) => {
                            if (err) {
                                if (walletProvider.engine) {
                                    try {
                                        walletProvider.engine.stop();
                                    } catch (e) {
                                    }
                                }
                                return reject(err);
                            }
                            if (walletProvider.engine) {
                                try {
                                    walletProvider.engine.stop();
                                } catch (e) {
                                }
                            }
                            resolve({amount, hash});
                        })
                    })
                    .once('error', (err) => {
                        if (walletProvider.engine) {
                            try {
                                walletProvider.engine.stop();
                            } catch (e) {
                            }
                        }
                        reject(err);
                    });
            } catch (e) {
                if (walletProvider.engine) {
                    try {
                        walletProvider.engine.stop();
                    } catch (e) {
                    }
                }
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
    eth_wallet.makeEthTransaction = async function (address, eth) {
        return new Promise(async function (resolve, reject) {
            const walletProvider = eth_wallet.getEthereumWalletProvider();
            try {

                const web3 = walletProvider.web3;
                const wallet = walletProvider.wallet;
                let amountEther = web3.utils.toWei(eth.toString(), "ether");
                let gasPrice = await web3.eth.getGasPrice();
                let gasApprove = await web3.eth.estimateGas({
                    to: address,
                    from: wallet.getAddressString(),
                    value: amountEther
                });
                web3.eth.sendTransaction({
                    to: address,
                    from: wallet.getAddressString(),
                    value: amountEther,
                    gas: gasApprove,
                    gasPrice: gasPrice * 1.3
                }).once('transactionHash', function (hash) {
                    eth_wallet.waitForReceipt(hash, async (err, receipt) => {
                        if (err) {
                            if (walletProvider.engine) {
                                try {
                                    walletProvider.engine.stop();
                                } catch (e) {
                                }
                            }
                            return reject(err);
                        }
                        resolve(receipt);

                    })
                })
                    .once('error', function (err) {
                        if (walletProvider.engine) {
                            try {
                                walletProvider.engine.stop();
                            } catch (e) {
                            }
                        }
                        reject(err);
                    });

            } catch (e) {
                if (walletProvider.engine) {
                    try {
                        walletProvider.engine.stop();
                    } catch (e) {
                    }
                }
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
    eth_wallet.makeTransaction = async function (address, amount, eth, callback) {
        console.log(address);
        Promise.all([eth_wallet.makeParetoTransaction(address, amount),
            eth_wallet.makeEthTransaction(address, eth)]).then((r) => {
            callback(null, r[0]);
        }).catch((e) => {
            callback(e);
        })
    };

    eth_wallet.waitForReceipt = function (hash, cb) {
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
                    eth_wallet.waitForReceipt(hash, cb);
                }, 1000);
            }
        });
    };

    eth_wallet.depositIntelAddress = async function(sender){
        try{
            const payment =  await ParetoPayment.findOne({address: sender, processed: false}).exec();
            const  walletProvider = eth_wallet.getEthereumWalletProvider();


            const Intel_Schema = require(ETH_NETWORK == 1 ? "../build/contracts/Intel-mainnet.json" : "../build/contracts/Intel-ropsten.json"); //1 is mainnet, 3 is ropsten
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
                        return console.log(err);
                    });
            }
        }catch (e) {
            console.log(e);
        }
    };
    return eth_wallet;
}