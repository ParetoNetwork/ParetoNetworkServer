"use strict";

var Web3 = require('web3');
var CountUp = require('countup.js');
var $ = require('jquery');

window.addEventListener('load', function() {

  //if connected to metamask, use metamask provider

  //else wait for user to input an address

  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i"));
  }

  //window.web3 = new Web3(web3.currentProvider);
  var contractAddr = ('0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc');
  var rankCalculation = 0;
  var blockNumber = 1;
  var tokenTotal = 0;

  web3.eth.getAccounts(function(error, accounts) {
    if(!error) {
      var addr = accounts[0];//accounts[0]; //kucoin 0x2b5634c42055806a59e9107ed44d43c426e58258
      var contractData = '';

      //add it all together
      var tknAddress = (addr).substring(2);
      var contractData = ('0x70a08231000000000000000000000000' + tknAddress);
      console.log(contractData);

      web3.eth.call({
          to: contractAddr, 
          data: contractData  
          }, function(err, result) {
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
          console.log("Counting till: " + tokenTotal);
          var rankCountInit = new CountUp('rank-counter', 0, tokenTotal, 0, 3, counterOptions);
          if (!rankCountInit.error) {
            rankCountInit.start();
          } else {
            console.error(rankCountInit.error);
          }
          
          console.log('Tokens Owned: ' + web3.utils.fromWei(tokens, 'ether'));

        }
        else {
          console.log(err); // Dump errors here
        }

        $.ajax({
          method: 'GET',
          url: '/summation?address='+addr+'&total='+tokenTotal,
          dataType: 'json',
          success: function (data, textStatus, jqXHR) {
              var weightedAverageDifference = parseInt(data.weightedAverageDifference);
              rankCalculation = parseInt(rankCalculation) + weightedAverageDifference;
              console.log("HODLING Bonus: " + weightedAverageDifference);
              console.log("Counting till: " + rankCalculation);
              var rankCount = new CountUp('rank-counter', tokenTotal, rankCalculation, 0, 2.5, counterOptions);
               if (!rankCount.error) {

                //would like to briefly change color and font of text

                rankCount.start();
              } else {
                console.error(rankCount.error);
              }


            //still needs a websocket to listen for blocks

            //websocket to listen for changes in number of pareto owned
            //store address, amount in local storage associate array 'amount'
            //get blocks when token was acquired
            //get blocks when token were sent away

            //as latest block increases, increase difference
          
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('error');
          }
        });
      });

      
  }//end if
  });//end function

  //the first block received
  web3.eth.getBlockNumber(function(error, result) {
    if(!error) {
      blockNumber = result;
    }
    else {
      console.error(error);
    }
  });

  

});
