import Web3 from 'web3';
import Sig from 'eth-sig-util';
import qs from 'qs';
import http from './HttpService';

/* eslint-disable no-console */
let logged = false;
export default class authService {
    constructor() {
        this._isLogged = true;
    }

    static getSocketToken(onSuccess){
        http.get("/v1/signws")
            .then(res => {
                onSuccess(res);
            })
            .catch(error => {
                console.log(error)
            });
    }


    static getIsLogged() {
        return logged;
    }

    static logout(onSuccess, onError) {
        http.post('/v1/unsign').then(res => {
            if(res.data.success){
                logged = false;
                onSuccess(res.data.data);
            }else{
                onError(res.data.message);
            }
        }).catch(error => {
            onError(error);
        });
    }

    static auth(onSuccess, onError) {
        http.get('/v1/auth', {
            dataType: 'json'
        }).then(res => {
            if(res.data.success){
              return  onSuccess(res.data.data);
            }else{
              return   onError(res.data.message);
            }
        }).catch(error => {
            return onError(error);

        });
    }

    static signParetoServer(msgParams, from, result, onSuccess, onError){
        let jsonData = {
            data: msgParams,
            owner: from,
            result: result
        };

        http.post('/v1/sign', qs.stringify(jsonData), {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }).then(response => {
            if(response.data.success){
                logged = true;
                return onSuccess(from);
            }else{
                return onError(response.data.message)
            }

        }).catch(error => {
            if (error.response && error.response.data) {
                return onError(error.response.data.message);
            } else {
                return onError(error);
            }

        });
    }

    static manualLogin(address, message, signed, onSuccess, onError){
        try{
            const msgParams = [
                {
                    type: 'string',
                    name: 'Message',
                    value: message //replace with TOS
                }
            ];
            authService.signParetoServer(msgParams, address, signed, onSuccess, onError)
        }catch (e) {
            onError(e);
        }

    }

    static isWalletSupported(onSuccess, onError) {
        var LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
        LedgerWalletSubproviderFactory().then(ledgerWalletSubProvider=>{
            if(ledgerWalletSubProvider.isSupported){
                onSuccess(true)
            }else{
                onError('Not Support')
            }
        });
    }

    static getWalletAccounts(path, page, limit, onSuccess, onError) {
        const ProviderEngine = require('web3-provider-engine');
        const RpcSubprovider = require('web3-provider-engine/subproviders/rpc');
        var LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
        const engine = new ProviderEngine();
        const provider = new Web3(engine);
        var derivation_path =  path ||  "44'/60'/0'/0/0";

        LedgerWalletSubproviderFactory().then(ledgerWalletSubProvider=>{
            const isSupported = ledgerWalletSubProvider.isSupported;
            ledgerWalletSubProvider.ledger.setDerivationPath(derivation_path);
            if(isSupported){
                engine.addProvider(ledgerWalletSubProvider);
                engine.addProvider(new RpcSubprovider({rpcUrl: 'https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq'})); // you need RPC endpoint
                engine.start();

                if (typeof provider !== 'undefined') {
                    console.log(derivation_path);
                    ledgerWalletSubProvider.ledger.getMultipleAccounts(derivation_path, page, limit)
                        .then(res => onSuccess(res))
                        .catch(err =>  { onError(err)});
                }//end if
            }else{
                onError('Your browser does not support this feature')
            }

        });


        return true;
    }

    static getTokens(addresses, onSuccess, onError){
        const data = {
            addresses:  addresses
        };
        http.post('/v1/addresses', data , {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json; charset=UTF-8'
            }
        }).then(response => {
            if(response.data.success){
                return onSuccess(response.data);
            }else{
                return onError(response.data.message)
            }

        }).catch(error => {
            if (error.response && error.response.data) {
                return onError(error.response.data.message);
            } else {
                return onError(error);
            }

        });
    }

    static  signWallet(pathId, addr, onSuccess, onError) {

        const ProviderEngine = require('web3-provider-engine');
        const RpcSubprovider = require('web3-provider-engine/subproviders/rpc');
        var LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
        const engine = new ProviderEngine();
        const provider = new Web3(engine);

        LedgerWalletSubproviderFactory().then(ledgerWalletSubProvider=>{
            const isSupported = ledgerWalletSubProvider.isSupported;
                if(isSupported){
                    engine.addProvider(ledgerWalletSubProvider);
                    engine.addProvider(new RpcSubprovider({rpcUrl: 'https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq'})); // you need RPC endpoint
                    engine.start();

                    if (typeof provider !== 'undefined') {
                        const msgParams = [
                            {
                                type: 'string',
                                name: 'Message',
                                value: 'Pareto' //replace with TOS
                            }
                        ];


                    ledgerWalletSubProvider.ledger.setDerivationPath(pathId);
                        if (provider.utils.isAddress(addr)) {
                            const from = addr.toLowerCase();

                            ledgerWalletSubProvider.ledger.signMessage({data:  provider.utils.toHex('Pareto')}, (err, result) => {
                                if (err) return console.dir(err);
                                if (result.error) {
                                    return onError('Please login into MetaMask (or other Web3 browser) in order to access the Pareto Network');
                                }
                                if (result.error) {
                                    return console.error(result);
                                }

                                const recovered = Sig.recoverPersonalSignature({data: 'Pareto', sig: result});

                                if (recovered === from) {
                                    authService.signParetoServer(msgParams, from, result, onSuccess, onError)

                                } else {
                                    console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                                    // stopLoading();
                                    return onError('Failed to verify signer when comparing ' + result + ' to ' + from);
                                }

                            });

                        }//end if valid address
                        else {
                            console.log('address invalid!');
                            return onError('Please login into MetaMask (or other web3 browser) in order to access the Pareto Network');

                            //set error state on input field
                        }
                    }//end if
                }else{
                    onError('Your browser not support this feature')
                }

        });


        return true;
    }


    static signSplash(onSuccess, onError) {
        let provider;
        if (typeof web3 !== 'undefined') {
            // Use Mist/MetaMask's provider
            provider = new Web3(web3.currentProvider);
        } else {
            console.log('No web3? You should consider trying MetaMask!');
            onError('Please install MetaMask (or other web3 browser) in order to access the Pareto Network');


            // searchLookup();
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            provider = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq'));
        }
        if (typeof provider !== 'undefined') {
            const msgParams = [
                {
                    type: 'string',
                    name: 'Message',
                    value: 'Pareto' //replace with TOS
                }
            ];
            // const contractAddr = ('0xbcce0c003b562f47a319dfca4bce30d322fa0f01');
            // const rankCalculation = 0;
            // const tokenTotal = 0;
            /*if (!metaMask.currentProvider.isMetaMask) { //no mobile users use Metamask, this is too strict

                return onError('Please install MetaMask in order to access the Pareto Network');
            }*/

            provider.eth.getAccounts((error, accounts) => {
                if (!error) {
                    if(accounts && accounts[0]){
                        //console.log(accounts);

                        const addr = accounts[0];


                        if (provider.utils.isAddress(addr)) {
                            const from = addr.toLowerCase();

                           // const params = [provider.utils.toHex('Pareto'), from];
                          //  const method = 'personal_sign';
                            const params = [msgParams,from];
                            const method = 'eth_signTypedData';
                            // debugger;

                            provider.currentProvider.sendAsync({method,params, from}, (err, result) => {
                                if (err) return console.dir(err);
                                if (result.error) {
                                    return onError('Please login into MetaMask (or other Web3 browser) in order to access the Pareto Network');
                                }
                                if (result.error) {
                                    return console.error(result);
                                }
                                result = result.result;
                                const recovered = Sig.recoverTypedSignature({ data: msgParams, sig: result });

                                if (recovered === from) {
                                    authService.signParetoServer(msgParams, from, result, onSuccess, onError)

                                } else {
                                    console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                                    // stopLoading();
                                    return onError('Failed to verify signer when comparing ' + result + ' to ' + from);
                                }

                            });

                        }//end if valid address
                        else {
                            console.log('address invalid!');
                            return onError('Please login into MetaMask (or other web3 browser) in order to access the Pareto Network');

                            //set error state on input field
                        }
                    }//end if !error

                }//end if !error
            });
        }//end if
        return true;
    }

    static postSign(onSuccess, onError) {
        http.get('/v1/userinfo?latest=true',{  withCredentials: true}).then(res => {
            if(res.data.success){
                onSuccess(res.data.data);
            }else{
                onError(res.data.message);
            }
        }).catch(error => {
            onError(error);
        });
    }
}

