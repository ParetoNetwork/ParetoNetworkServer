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

    static getIsLogged() {
        return logged;
    }


    static logout(onSuccess, onError) {
        http.post('/v1/unsign').then(res => {
            logged = false;
            onSuccess(res);
        }).catch(error => {
            onError(error);
        });
    }

    static auth(onSuccess, onError) {
        http.get('/v1/auth', {
            dataType: 'json'
        }).then(res => {
            return onSuccess(res);

        }).catch(error => {
            return onError(error);

        });
    }

    static signSplash(onSuccess, onError) {
        const msgParams = [
            {
                type: 'string',
                name: 'Message',
                value: 'Pareto' //replace with TOS
            }
        ];
        let provider;
        if (typeof web3 !== 'undefined') {
            // Use Mist/MetaMask's provider
            provider = new Web3(web3.currentProvider);
        } else {
            console.log('No web3? You should consider trying MetaMask!');
            onError('Please install MetaMask (or other web3 browser) in order to access the Pareto Network');


            // searchLookup();
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            provider = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i'));
        }
        if (typeof provider !== 'undefined') {

            // const contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
            // const rankCalculation = 0;
            // const tokenTotal = 0;
            /*if (!metaMask.currentProvider.isMetaMask) { //no mobile users use Metamask, this is too strict

                return onError('Please install MetaMask in order to access the Pareto Network');
            }*/
            provider.eth.getAccounts((error, accounts) => {
                if (!error) {

                    const addr = accounts[0];

                    if (provider.utils.isAddress(addr)) {
                        const from = addr.toLowerCase();

                        const params = [msgParams, from];
                        const method = 'eth_signTypedData';

                        provider.currentProvider.sendAsync({method, params, from}, (err, result) => {
                            if (err) return console.dir(err);
                            if (result.error) {
                                return onError('Please login into MetaMask (or other Web3 browser) in order to access the Pareto Network');
                            }
                            if (result.error) {
                                return console.error(result);
                            }

                            const recovered = Sig.recoverTypedSignature({data: msgParams, sig: result.result});

                            if (recovered === from) {

                                var jsonData = {
                                    data: msgParams,
                                    owner: from,
                                    result: result.result
                                };

                                http.post('/v1/sign', qs.stringify(jsonData), {
                                    headers: {
                                        'accept': 'application/json',
                                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                                    }
                                }).then(response => {
                                    const token = response.data.result;

                                    logged = true;
                                    this.postSign(data => {
                                        return onSuccess(from);

                                    }, err => {
                                        return onError(err);
                                    });

                                }).catch(error => {
                                    if (error.response && error.response.data) {
                                        return onError(error.response.data.message);
                                    } else {
                                        return onError(error);
                                    }

                                });

                            } else {
                                console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                                // stopLoading();
                            }

                        });

                    }//end if valid address
                    else {
                        console.log('address invalid!');
                        return onError('Please login into MetaMask (or other web3 browser) in order to access the Pareto Network');

                        //set error state on input field
                    }
                }//end if !error
            });
        }//end if
        return true;
    }

    static postSign(onSuccess, onError) {
        http.get('/v1/userinfo?latest=true').then(res => {
            onSuccess(res);
        }).catch(error => {
            onError(error);
        });
    }
}

