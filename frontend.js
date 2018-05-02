'use strict';

var Web3 = require('web3');
var CountUp = require('countup.js');
var $ = require('jquery');
var uri = require('uri-js');
var sigUtil = require('eth-sig-util');
require('vue');
var blockNumber = 1;

//util for params
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function searchLookup() {
    var lookupField = document.getElementById('lookup');
    var lookupSignButton = document.getElementById('lookupSignButton');
    if (lookupField !== null) lookupField.style.opacity = '100';
    if (lookupSignButton !== null) lookupSignButton.style.opacity = '100';
}

window.addEventListener('intel', function () {

    var titleField = document.getElementById('intel-title-input');
    var bodyField = document.getElementById('intel-body-input');


    var data = {};
    //data.address comes from the cookie parsed server side
    data.title = titleField.value;
    data.body = bodyField.value;
    data.block = blockNumber;

    $.ajax({
        method: 'POST',
        url: '/v1/content',
        data: data,
        dataType: 'json',
        success: function (data, textStatus, jqXHR) {

            //show success
            console.log('success');

            //clear upon success
            titleField.value = '';
            //bodyField.summernote('code', '');

            var preview = document.getElementById('preview');
            if (preview !== null) {
                preview.innerHTML = '<b>' + data.content.title + '</b>' + '<br/><br/>' + data.content.body;
                preview.style.backgroundColor = 'rgba(245,245,245,1)';
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {

            console.log('error');
        }
    });

});

window.addEventListener('sign', function (event) {
    //event.preventDefault();

    var msgParams = [
        {
            type: 'string',
            name: 'Message',
            value: 'Pareto' //replace with TOS
        }
    ];

    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No web3? You should consider trying MetaMask!');
        searchLookup();
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i'));
    }

    if (typeof web3 !== 'undefined') {
        var contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
        var rankCalculation = 0;
        var tokenTotal = 0;

        web3.eth.getAccounts(function (error, accounts) {
            if (!error) {

                var lookupInputField = document.getElementById('lookup-input');

                var addr = '';
                if (lookupInputField !== null && lookupInputField.value !== 'undefined' && lookupInputField.value !== '') {
                    addr = lookupInputField.value;
                }
                else {
                    addr = ((typeof accounts[0] !== 'undefined') ? accounts[0] : lookupInputField.value);//getUrlParameter('address'));//accounts[0]; //kucoin 0x2b5634c42055806a59e9107ed44d43c426e58258
                }
                var contractData = '';

                if (web3.utils.isAddress(addr)) {
                    var from = addr.toLowerCase();

                    //console.log('CLICKED, SENDING PERSONAL SIGN REQ');
                    var params = [msgParams, from];
                    //console.dir(params);
                    var method = 'eth_signTypedData';

                    //Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
                    web3.currentProvider.sendAsync({method, params, from}, function (err, result) {
                        if (err) return console.dir(err);
                        if (result.error) {
                            console.log(result.error.message);
                        }
                        if (result.error) return console.error(result);
                        //console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

                        const recovered = sigUtil.recoverTypedSignature({data: msgParams, sig: result.result});

                        if (recovered === from) {

                            var jsonData = {
                                data: msgParams,
                                owner: from,
                                result: result.result
                            };

                            $.ajax({
                                method: 'POST',
                                url: '/v1/sign',
                                data: jsonData,
                                dataType: 'json',
                                success: function (data, textStatus, jqXHR) {

                                    //wait for 200 OK result from server and then run calculate method

                                    //server response has cookie parameter set and is stored in browser.

                                    var accessToggle = document.getElementById('access-sign');
                                    if (accessToggle !== null) {
                                        accessToggle.innerHTML = 'RESET';
                                        accessToggle.style.backgroundColor = 'rgb(12, 95, 136)';
                                        accessToggle.style.opacity = 100;
                                    }

                                    var navUserAccess = document.getElementById('nav-user-access');
                                    var dropdownUserAccess = document.getElementById('dropdown-user-address');
                                    var logoutMenuItem = document.getElementById('access');
                                    var signInMenuItem = document.getElementById('access-in');

                                    if (navUserAccess !== null) {
                                        navUserAccess.innerHTML = '&nbsp;' + data.result.address.substring(0, 10) + '...&nbsp;';
                                    }
                                    if (dropdownUserAccess !== null) {
                                        dropdownUserAccess.innerHTML = data.result.address;
                                    }

                                    if (logoutMenuItem !== null) {
                                        logoutMenuItem.style.opacity = '1.0'; //logout button
                                    }
                                    if (signInMenuItem !== null) {
                                        signInMenuItem.style.opacity = '0.0'; //signin button
                                    }

                                    window.dispatchEvent(new CustomEvent('leaderboard', {
                                        'detail': {
                                            rank: data.result.rank,
                                            limit: 100,
                                            page: 0
                                        }
                                    }));

                                    var scoreCountHolders = document.getElementById('score-counter');
                                    var counterOptions = {
                                        useEasing: true,
                                        useGrouping: true,
                                        separator: ',',
                                        decimal: '.',
                                    };
                                    if (scoreCountHolders !== null) {

                                        var scoreCount = new CountUp('score-counter', 0.0, data.result.score, 2, 2.5, counterOptions);
                                        if (!scoreCount.error) {

                                            //would like to briefly change color and font of text

                                            scoreCount.start();
                                        } else {
                                            console.error(scoreCount.error);
                                        }
                                        if (data.rank > 0) {
                                            var rankCount = new CountUp('rank-counter', data.result.totalRanks, data.result.rank, 0, 2.5, counterOptions);
                                            if (rankCountInit !== 'undefined') {
                                                if (!rankCount.error) {
                                                    rankCount.start();
                                                } else {
                                                    console.error(rankCount.error);
                                                }
                                            }

                                            var addressMetricsDiv = document.getElementById('address-metrics');
                                            if (addressMetricsDiv !== null) {
                                                addressMetricsDiv.style.opacity = 1; //For real browsers;
                                                addressMetricsDiv.style.filter = 'alpha(opacity=100)'; //For IE;

                                                document.getElementById('rank-total').innerHTML = data.result.totalRanks;
                                            }
                                        }

                                        searchLookup();
                                        var lookupInputField = document.getElementById('lookup-input');
                                        if (lookupInputField !== 'undefined') {
                                            lookupInputField.value = addr;
                                        }

                                    }

                                    //calculate(); //the sign function already calculates now and returns the details

                                },
                                error: function (jqXHR, textStatus, errorThrown) {

                                    console.log(errorThrown);
                                }
                            });

                        } else {
                            console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                        }

                    });

                }//end if valid address
                else {
                    console.log('address invalid!');
                    //set error state on input field
                }
            }//end if !error
        });
    }//end if


    /*  web3.eth.signTypedData not yet implemented!!!
     *  We're going to have to assemble the tx manually!
     *  This is what it would probably look like, though:
      web3.eth.signTypedData(msg, from) function (err, result) {
        if (err) return console.error(err)
        console.log('PERSONAL SIGNED:' + result)
      })
    */


});

window.addEventListener('signSplash', function (event) {
    //event.preventDefault();

    var msgParams = [
        {
            type: 'string',
            name: 'Message',
            value: 'Pareto' //replace with TOS
        }
    ];
    var elem = document.getElementById('gradient');
    var width = 1;
    var id = setInterval(frame, 10);

    function frame() {
        if (width >= 90) {
        } else {
            width++;
            elem.style.width = width + '%';
        }
    }
    const stopLoading = function () {
        button.empty();
        button.append(text);
        elem.style.width = '101%';
        clearInterval(id);
    }

    var button = $('.button.button--transparent');
    var text = $('.button.button--transparent > b');
    button.empty();
    button.append('<i class="fa fa-spinner fa-spin"></i>');

    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No web3? You should consider trying MetaMask!');
        stopLoading();
        alert('Please install MetaMask in order to access the Pareto Network');


        searchLookup();
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i'));
    }

    if (typeof web3 !== 'undefined') {

        var contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
        var rankCalculation = 0;
        var tokenTotal = 0;
        if(! web3.currentProvider.isMetaMask){
            stopLoading();
            return alert('Please install MetaMask in order to access the Pareto Network');
        }
        web3.eth.getAccounts(function (error, accounts) {
            if (!error) {

                var addr = accounts[0];

                var contractData = '';

                if (web3.utils.isAddress(addr)) {
                    var from = addr.toLowerCase();

                    //console.log('CLICKED, SENDING PERSONAL SIGN REQ');
                    var params = [msgParams, from];
                    //console.dir(params);
                    var method = 'eth_signTypedData';

                    //Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
                    web3.currentProvider.sendAsync({method, params, from}, function (err, result) {
                        if (err) return console.dir(err);
                        if (result.error) {
                            stopLoading();
                            console.log(result.error.message);
                        }
                        if (result.error) {
                            return console.error(result);
                        }
                        //console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

                        const recovered = sigUtil.recoverTypedSignature({data: msgParams, sig: result.result});

                        if (recovered === from) {

                            var jsonData = {
                                data: msgParams,
                                owner: from,
                                result: result.result
                            };
                            $.ajax({
                                method: 'POST',
                                url: '/v1/sign',
                                data: jsonData,
                                dataType: 'json',
                                success: function (data, textStatus, jqXHR) {

                                    //wait for 200 OK result from server and then run calculate method

                                    //server response has cookie parameter set and is stored in browser.
                                    stopLoading();
                                    window.location.replace('/dashboard');

                                },
                                error: function (jqXHR, textStatus, errorThrown) {
                                    stopLoading();
                                    console.log(errorThrown);
                                }
                            });

                        } else {
                            console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                            stopLoading();
                        }

                    });

                }//end if valid address
                else {
                    console.log('address invalid!');
                    alert('Please login into MetaMask in order to access the Pareto Network');
                    stopLoading();

                    //set error state on input field
                }
            }//end if !error
        });
    }//end if
});

window.addEventListener('load', function () {

    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No web3? You should consider trying MetaMask!');
        searchLookup();
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i'));
    }

    if (typeof web3 !== 'undefined') {
        var contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
        var rankCalculation = 0;
        var tokenTotal = 0;

        web3.eth.getAccounts(function (error, accounts) {
            if (!error) {

                var lookupInputField = document.getElementById('lookup-input');

                var addr = '';

                addr = ((typeof accounts[0] !== 'undefined') ? accounts[0] : '');//getUrlParameter('address'));//accounts[0]; //kucoin 0x2b5634c42055806a59e9107ed44d43c426e58258

                if (lookupInputField !== null) {
                    lookupInputField.value = addr;
                }

            }//end if !error
        });
    }//end web3 checks

});

function calculate() {

    //if connected to metamask, use metamask provider

    //else wait for user to input an address

    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No web3? You should consider trying MetaMask!');
        searchLookup();
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i'));
    }

    if (typeof web3 !== 'undefined') {
        var contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
        var rankCalculation = 0;
        var tokenTotal = 0;

        web3.eth.getAccounts(function (error, accounts) {
            if (!error) {

                var lookupInputField = document.getElementById('lookup-input');

                var addr = '';
                if (lookupInputField !== null && lookupInputField.value !== 'undefined' && lookupInputField.value !== '') {
                    addr = lookupInputField.value;
                }
                else {
                    addr = ((typeof accounts[0] !== 'undefined') ? accounts[0] : lookupInputField.value);//getUrlParameter('address'));//accounts[0]; //kucoin 0x2b5634c42055806a59e9107ed44d43c426e58258
                }
                var contractData = '';

                if (web3.utils.isAddress(addr)) {

                    //add it all together
                    var tknAddress = (addr).substring(2);
                    var contractData = ('0x70a08231000000000000000000000000' + tknAddress);
                    console.log(contractData);

                    web3.eth.call({
                        to: contractAddr,
                        data: contractData
                    }, function (err, result) {
                        if (result) {
                            var tokens = web3.utils.toBN(result).toString();
                            tokenTotal = web3.utils.fromWei(tokens, 'ether');
                            rankCalculation = tokenTotal;
                            var counterOptions = {
                                useEasing: true,
                                useGrouping: true,
                                separator: ',',
                                decimal: '.',
                            };
                            console.log('Counting till: ' + tokenTotal);
                            var rankCountInit = new CountUp('score-counter', 0, tokenTotal, 2, 3, counterOptions);
                            if (rankCountInit !== 'undefined') {
                                if (!rankCountInit.error) {
                                    rankCountInit.start();
                                } else {
                                    console.error(rankCountInit.error);
                                }
                            }

                            console.log('Tokens Owned: ' + web3.utils.fromWei(tokens, 'ether'));

                        }
                        else {
                            console.log(err); // Dump errors here
                        }

                        $.ajax({
                            method: 'GET',
                            url: '/v1/summation',
                            dataType: 'json',
                            success: function (data, textStatus, jqXHR) {
                                console.log('HODLING Bonus: ' + data.bonus);
                                console.log('Counting till: ' + data.score);

                                window.dispatchEvent(new CustomEvent('leaderboard', {
                                    'detail': {
                                        rank: data.rank,
                                        limit: 100,
                                        page: 0
                                    }
                                }));

                                var scoreCount = new CountUp('score-counter', tokenTotal, data.score, 2, 2.5, counterOptions);
                                if (!scoreCount.error) {

                                    //would like to briefly change color and font of text

                                    scoreCount.start();
                                } else {
                                    console.error(scoreCount.error);
                                }
                                if (data.rank > 0) {
                                    var rankCount = new CountUp('rank-counter', data.totalRanks, data.rank, 0, 2.5, counterOptions);
                                    if (rankCountInit !== 'undefined') {
                                        if (!rankCount.error) {
                                            rankCount.start();
                                        } else {
                                            console.error(rankCount.error);
                                        }
                                    }

                                    var addressMetricsDiv = document.getElementById('address-metrics');
                                    if (addressMetricsDiv !== null) {
                                        addressMetricsDiv.style.opacity = 1; //For real browsers;
                                        addressMetricsDiv.style.filter = 'alpha(opacity=100)'; //For IE;

                                        document.getElementById('rank-total').innerHTML = data.totalRanks;
                                    }
                                }

                                searchLookup();
                                var lookupInputField = document.getElementById('lookup-input');
                                if (lookupInputField !== 'undefined') {
                                    lookupInputField.value = addr;
                                }


                                //update every 5 blocks

                                //still needs a websocket to listen for blocks

                                //websocket to listen for changes in number of pareto owned
                                //store address, amount in local storage associate array 'amount'
                                //get blocks when token was acquired
                                //get blocks when token were sent away

                                //as latest block increases, increase difference

                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log(errorThrown);
                            }
                        });
                    });
                }//end if address !== 'undefined'
                else if (accounts === undefined || accounts.length == 0) {
                    console.log('unlock metamask, or alternatively check any valid address');
                    searchLookup();
                }


            }//end if
        });//end function

        //the first block received
        web3.eth.getBlockNumber(function (error, result) {
            if (!error) {
                blockNumber = result;
            }
            else {
                console.error(error);
            }
        });

    } //if web3 works
    else { //send everything to the server
        alert('Cannot connect to Ethereum network');
    }


};