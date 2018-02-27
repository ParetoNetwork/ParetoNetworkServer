"use strict";

var express = require('express');
//var request = require('request');
var requestp = require('request-promise');
var app = express();
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i"));
var uniqueRandomArray = require('unique-random-array');
const debug = require('debug')('pareto-ranking')
const appName = 'Pareto Ranking Backend'
debug('booting %s', appName)

app.use(express.static('public'));

//web3Auth.attach(app, "Cryptographically sign this to prove ownership.");

/*app.get('/who', function (req, res) {
  console.log(req.cookies.token);
  console.log(req.user);
  if (req.user) {
    res.json({account: req.user.loggedInAs});
  }
  else {
    res.status(404);
  }
  res.end();
});*/
app.get('/summation', function(req, fres){
    fres.setHeader('Content-Type', 'application/json');
    var address = req.query.address;
    var tokenTotal = req.query.total;
    var blockHeight = 0;
    //var fres = res;

    if(web3.utils.isAddress(address) == false){

       res.json({"status": 500, "error":"invalid address"});

    } else {

         //pad address +32 bits for web3 API
        var padding=66;
        var n = address.length;
        if(n!==padding)
        {
          var paddingLength = 66 - (n)
          var zeroes = "0";
          for (var i = 0; i < paddingLength-1; i++) 
          { 
              zeroes += "0"; 
          }
          address = "0x" + zeroes + address.substring(2,n);
        }
        //var etherscanApiKeys =  uniqueRandomArray([ 'NW6AVI32DZ5YSK88ZDDUXRG54MPJXJA6V1', 'TS62T2DDKXJQ7BSBTHEJVRB39HQJK7WPHD', 'QWGXC7ATH525RZ53WKGVUHDKF61APV5VI4']);
        var txs = [];
        var incoming = {};
        var outgoing = {};

        console.log(address);

        //get current blocknumber too
        web3.eth.getBlock('latest')
        .then(function(res) {
          blockHeight = res.number;
          console.log("blockheight: " + blockHeight);

        return web3.eth.getPastLogs({
          fromBlock: '0x4B9696',
          toBlock: 'latest',
          address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
          topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, address]
        }).then(function (txObjects){
          //console.log(txObjects);
            for(i = 0; i < txObjects.length; i++){

                //these are hex values
                //get data field, to hex, then from wei to ether
                var data = txObjects[i].data;
                var blockHex = txObjects[i].blockNumber;
                
                var quantityWei = web3.utils.toBN(data, 16).toString();
                var blockNumber = web3.utils.toBN(blockHex, 16).toString();
                var quantityEth = web3.utils.fromWei(quantityWei, 'ether'); //takes a string.
                quantityEth = parseInt(quantityEth);
                
                //basically pushes
                if(blockNumber in incoming)
                {
                  incoming[blockNumber] = incoming[blockNumber] + quantityEth;
                }
                else {
                  incoming[blockNumber] = quantityEth;
                }
            }

            return web3.eth.getPastLogs({
              fromBlock: '0x4B9696',
              toBlock: 'latest',
              address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
              topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', address, null]
            }).then(function (txObjects){
            //console.log(txObjects);
            for(i = 0; i < txObjects.length; i++){

                //these are hex values
                //get data field, to hex, then from wei to ether
                var data = txObjects[i].data;

                var blockHex = txObjects[i].blockNumber;

                var quantityWei = web3.utils.toBN(data, 16).toString();
                var blockNumber = web3.utils.toBN(blockHex, 16).toString();

                var quantityEth = web3.utils.fromWei(quantityWei, 'ether'); //takes a string.
                quantityEth = parseInt(quantityEth);

                //basically pushes
                if(blockNumber in outgoing)
                {
                  outgoing[blockNumber] = outgoing[blockNumber] + quantityEth;
                }
                else {
                  outgoing[blockNumber] = quantityEth;
                }

            }//end for

          /*try {
            incoming = Object.keys(incoming).reverse().forEach();
            outgoing = Object.keys(outgoing).reverse();
          } catch (e){
            console.log(e);
          }*/

            /*console.log("incoming\n\n");
            console.log(incoming);
            console.log("outgoing\n\n");
            console.log(outgoing);*/

            var transactions = Object.entries(incoming).concat(Object.entries(outgoing).map(([ts, val]) => ([ts, -val])));
            try {
              transactions = transactions.sort().reverse();
              console.log("sorted");
              console.log(transactions);
              console.log("looping");
              try {
                var i = 0;
                var removableIndex = 0;
                
                //sorts down to remaining transactions, since we already know the total and the system block height
                while(i < transactions.length){
                  console.log(transactions);
                  if(transactions[i][1] < 0 /*&& transactions[i+1] !== 'undefined'*/){
                    transactions[i+1][1] = transactions[i+1][1] + transactions[i][1];
                    //console.log("current transaction[i][1] value: " + transactions[i][1]);
                    if(transactions[0][1] <= 0){
                      transactions.shift(); //or remove index 0
                    } else {
                      //remove first negative index after processing
                      transactions.splice(removableIndex, 1);
                    }
                    //console.log("after shift current transaction[i][1] value: " + transactions[i][1]);
                  } else {
                    //console.log(transactions[i][1]);
                    transactions[i][2] = transactions[i][1]/tokenTotal; //adds decimal to the tuple
                    transactions[i][3] = parseInt(transactions[i][0]) * transactions[i][2]; //weight of block
                    if(i == 0){ //cumulative weight of block, so last index already has the value instead of needing to loop through again
                      transactions[i][4] = transactions[i][3]; 
                    } else {
                      transactions[i][4] = transactions[i][3] + transactions[i-1][4];
                    }
                    i++;
                    removableIndex = i;

                  }
                } // end while
                //console.log(transactions);

                //now find weighted average block number
                var weightAverageBlockHeight = transactions[transactions.length-1][4];
                var blockHeightDifference = blockHeight - weightAverageBlockHeight;
                console.log("weighted avg block height difference: " + blockHeightDifference);

                fres.json({ 'weightAverageBlockHeight' : weightAverageBlockHeight, 'weightedAverageDifference' : blockHeightDifference});
              } catch (e) {
                console.log(e);
                fres.status(500).send('Something broke!')
              }


            } catch (e) {
              console.log(e);
              fres.status(500).send('Something broke!')
            }

          })//end second then promise
          .catch(function (err) {
            // API call failed...
            console.log(err);
            fres.status(500).send('Something broke!')
          });
        });//end first then promise
      });//end 
    } //end address validation

});//end entire function

app.listen(process.env.PORT || 3000, function () {
  console.log('Pareto Network ranking app listening on port 3000!')
});