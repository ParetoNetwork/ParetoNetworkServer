var mongodb = require('mongodb').MongoClient;
const assert = require('assert');
var connectionUrl = process.env.CRED_MONGODB || require('./backend-credentials.json').mongodb_connection;

//ways of writing contract creation block height
const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightInt = 4953750;

const dbName = 'pareto';

function calculateScore(req, fres, web3){

	fres.setHeader('Content-Type', 'application/json');
    var address = req.query.address;
    var tokenTotal = req.query.total;
    var blockHeight = 0;

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

        var txs = [];
        var incoming = {};
        var outgoing = {};

        console.log(address);

        //should re-do 

        //get current blocknumber too
        web3.eth.getBlock('latest')
        .then(function(res) {
          blockHeight = res.number;
          console.log("blockheight: " + blockHeight);

        return web3.eth.getPastLogs({
          fromBlock: contractCreationBlockHeightHexString,
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
              fromBlock: contractCreationBlockHeightHexString,
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
             
              try {
                var i = 0;
                var removableIndex = 0;
                
                //sorts down to remaining transactions, since we already know the total and the system block height
                while(i < transactions.length){
                  
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

                fres.json({ 'weightAverageBlockHeight' : weightAverageBlockHeight, 'weightedAverageDifference' : blockHeightDifference, 'blockHeightDivisor' : (blockHeight - contractCreationBlockHeightInt)/100});
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

}

function postContent (web3, body, fres){

	//exposed endpoint to write content to database

	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  
	  web3.eth.getBlock('latest')
        .then(function(res) {

          body.dateCreated = Date.now();
          body.block = res.number;

          // Insert a single document
		  db.collection('content').insertOne(
			  	body, function(err, r) {
			    //assert.equal(null, err);
			    //assert.equal(1, r.insertedCount);
			    if(err){
			    	console.error('unable because: ', err);
			    	fres.boom.badData();
			    } else {
			    	fres.status(200).json({status: "success"});
			    }

			  });
		  }); //end mongodb

      });
};


function getAllAvailableContent(){

	//check if user, then return what the user is privy to see

};

function getContentById(){

	//check if user, then check if the user is privy to see it

};

function retrieveScores(){

	//makes the rank by sorting server side, stores all ranks in db, also sends result client side if requested

};

function retrieveRank(){

	//quick way to retrieve the current snapshot of rankings. can limit to a range

};


/*
*	Send an address, get the address and its current score and current ranking
*/
function retrieveRankScoreOfAddress(address, res){

	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  db.address.findOne({ address : address }, 
	  	function(err, r){
	  		if(err){
			    	console.error('unable because: ', err);
			    	res.boom.badData();
		    } else {
		    	res.status(200).json(r);
		    } //end conditional
		} //end function
	  );
	});//end mongo

};

/*
*	Send a number greater than zero, get the address and its current score
*/
function retrieveAddressAtRank(rank, res){

	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  db.address.find({ rank : rank }, 
	  	function(err, r){
	  		if(err){
		    	console.error('unable because: ', err);
		    	res.boom.badData();
		    } else {
		    	res.status(200).json(r);
		    }
	  });
	});

};

function retrieveRankAroundAddress(index){

	//a range of rankings
	var range = 50;
	var lowerBound = ((index > range) ? index-range : 0);
	var upperBound = index + range;

	//db.address.find with limits

};

/*  Way to do all the ranking calculations
	1. cycle through each erc20 transfer eventget receiving address, 
	2. check if its in the database (or pull all addresses from db first, and check for existence in array)
	3. optional - check that addresses' block height (for when it was last calculated), if it wasn't long ago then don't update it and let that user do it on their own volition, to save some processing
	4. run entire score promises chain
*/
function calculateAllScores(web3, fres){

	web3.eth.getPastLogs({
      fromBlock: contractCreationBlockHeightHexString,
      toBlock: 'latest',
      address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
    }).then(function (txObjects){

    	console.log(txObjects);

    	mongodb.connect(connectionUrl, function(err, client) {
		    assert.equal(null, err);
		    //console.log("Connected correctly to server");

		    const db = client.db(dbName);

			for(i = 0; i < txObjects.length; i++){

				var score = 0;

				db.collection('address').findOne({ address : txObjects[i].address }, function(err, addressObject){
					if(err){
						//no address entry found, add entry and calculate everything
					} else {
						//address found, update current entry
					}

				});

			}

			calculateAllRanks(db);
		}); //end mongodb

		fres.status(200).json({status:"success"});

    });

};

/* Given the complete set of scores, rank them from highest to lowest (just the sort() command and looping through all, adding the current i to each object's rank)
   1. get db.address.find().sort()
*/
function calculateAllRanks(db, res){ //only runs inside of a mongodb connection

	var i = 1;

	if(db === null){
		mongodb.connect(connectionUrl, function(err, client) {
	        assert.equal(null, err);

	        const db = client.db(dbName);

	        db.collection('address').find().sort({ score : 1 }).forEach( function(addressObject) {
				db.collection('address').update({ _id : addressObject._id }, {$set:{ rank : i } }) ;
				i++;
			});

			res.status(200).json({status:"success"});
	        
	      });
        
	} else {
		db.collection('address').find().sort({ score : 1 }).forEach( function(addressObject) {
			db.collection('address').update({ _id : addressObject._id }, {$set:{ rank : i } }) ;
			i++;
		});

		res.status(200).json({status:"success"});
	}
};

module.exports.calculateAllRanks = calculateAllRanks;
module.exports.calculateScore = calculateScore;
module.exports.calculateAllScores = calculateAllScores;
module.exports.postContent = postContent;
module.exports.retrieveRankScoreOfAddress = retrieveRankScoreOfAddress;
module.exports.retrieveAddressAtRank = retrieveAddressAtRank;