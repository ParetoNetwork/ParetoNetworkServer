var controller = module.exports = {};

/*constants*/
var connectionUrl = process.env.CRED_MONGODB || require('./backend-private-constants.json').mongodb_connection;
var paretoContractAddress = process.env.CRED_PARETOCONTRACT || require('./backend-public-constants.json').pareto_contract_address;

/*dependencies*/
var mongodb = require('mongodb').MongoClient;
const assert = require('assert');

var utils = require('./backend-utils.js');

/*ways of writing contract creation block height*/
const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightInt = 4953750;

const dbName = 'pareto';

controller.calculateScore = function(req, fres, web3){

	fres.setHeader('Content-Type', 'application/json');
    var address = req.query.address; //should validate type
    var tokenTotal = req.query.total; //should validate type
    var blockHeight = 0;

    
    var rankCalculation = 0;

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
          var addressPadded = "0x" + zeroes + address.substring(2,n);
        }

        var txs = [];
        var incoming = {};
        var outgoing = {};

        console.log(address);

		var tknAddress = (address).substring(2); //this call doesn't use the padded address
        var contractData = ('0x70a08231000000000000000000000000' + tknAddress);

        //get current blocknumber too
        web3.eth.getBlock('latest')
         .then(function(res) {
          blockHeight = res.number;
          console.log("blockheight: " + blockHeight);

        //then re-tally total
        return web3.eth.call({
          to: paretoContractAddress, 
          data: contractData  
        }).then(function(result) {
	        if (result) { 
	              var tokens = web3.utils.toBN(result).toString();
	              tokenTotal = web3.utils.fromWei(tokens, 'ether');
	        }

        return web3.eth.getPastLogs({
          fromBlock: contractCreationBlockHeightHexString,
          toBlock: 'latest',
          address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
          topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, addressPadded]
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
              topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', addressPadded, null]
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

                //do final calculations for this stage
                var divisor = (blockHeight - contractCreationBlockHeightInt)/100;
                var score = tokenTotal * (blockHeightDifference / divisor);
                var bonus = blockHeightDifference / divisor;

                var resultJson = {
                	'address' : req.query.address,
                	'score' : score,
                	'block' : blockHeight,
                	'bonus' : bonus
                };

                //write to db as well
                mongodb.connect(connectionUrl, function(err, client) {
				  assert.equal(null, err);
				  //console.log("Connected correctly to server");

				  const db = client.db(dbName);

				  var dbQuery = { 
				  	address : address 
				  };
				  var dbValues = { 
				  		$set: { 
				  				score : score, 
				  				block: blockHeight 
				  		} 
				  };
				  var dbOptions = {
						upsert : true
				  };

				  //should queue for writing later
				  db.collection('address').updateOne(dbQuery, dbValues, dbOptions,
				  	function(err, r){
				  		if(err){
						    	console.error('unable to write to db because: ', err);
						    	fres.boom.badData();
					    } else {
					    	console.log(r);
					    	fres.status(200).json(resultJson);
					    } //end conditional
					} //end function
				  );
				});//end mongo

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
	 }); //end promise related to balance
    } //end address validation

}

controller.postContent = function(web3, body, fres){

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


controller.getAllAvailableContent = function(){

	//check if user, then return what the user is privy to see

	//check block number or block age, then retrieve all content after that block. add more limitations/filters later

	var acceptableBlockHeight = 0; //system block height. global var determined by worker? stored on S3? stored on db? dynamic based on rank %?

	//get standard deviation



	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  db.collection('content').findOne({ block : block }, 
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

controller.getContentById = function(){

	//check if user, then check if the user is privy to see it

};

controller.retrieveScores = function(){

	//makes the rank by sorting server side, stores all ranks in db, also sends result client side if requested

};

controller.retrieveRank = function(){

	//quick way to retrieve the current snapshot of rankings. can limit to a range

	//get your rank number, so retrieve by address
	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  db.collection('address').findOne({ address : address }, 
	  	function(err, r){
	  		if(err){
			    	console.error('unable because: ', err);
			    	res.boom.badData();
		    } else {

		    	var rankIndex = r.rank;

		    	//want ranks -5 to +5
		    	//db.address.findOne({ rank : rank }).limit

		    	res.status(200).json(r);
		    } //end conditional
		} //end function
	  );
	});//end mongo

};


/*
*	Send an address, get the address and its current score and current ranking
*/
controller.retrieveRankScoreOfAddress = function(address, res){

	mongodb.connect(connectionUrl, function(err, client) {
	  assert.equal(null, err);
	  //console.log("Connected correctly to server");

	  const db = client.db(dbName);

	  db.collection('address').findOne({ address : address }, 
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
controller.retrieveAddressAtRank = function(rank, res){

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

controller.retrieveRankAroundAddress = function(index){

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
controller.calculateAllScores = function(web3, fres){

	var blockHeight = 0;

	//get current blocknumber too
    web3.eth.getBlock('latest')
     .then(function(res) {
      blockHeight = res.number;
      console.log("blockheight: " + blockHeight);

	return web3.eth.getPastLogs({
      fromBlock: contractCreationBlockHeightHexString,
      toBlock: 'latest',
      address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
    }).then(function (txObjects){

    	console.log("tx count here: " + txObjects.length);


    	mongodb.connect(connectionUrl, function(err, client) {
		    assert.equal(null, err);
		    //console.log("Connected correctly to server");

		    const db = client.db(dbName);
		    var bulk = db.collection('address').initializeUnorderedBulkOp();

			for(i = 0; i < txObjects.length; i++){

				var dataA = "0x" + txObjects[i].topics[1].substring(26);
				var dataB = "0x" + txObjects[i].topics[2].substring(26); //destination, most likely current holder
				var score = 0.0;

				//get all addresses first and add to the collection where necessary
				/*if(i == 0){
					var dbQuery = { 
					  	address : dataB
					  };
					  var dbValues = { 
					  		$set: { 
					  				score : score, 
					  				block: Long.fromInt(blockHeight)
					  		} 
					  };
					  var dbOptions = {
							upsert : true
					  };

					db.collection('address').updateOne(dbQuery, dbValues, dbOptions, function(err, addressObject){
						if(err){
							//no address entry found, add entry and calculate everything
						} else {
							//address found, update current entry
						}

					});
				}*/
				
				bulk.find({address : dataB}).upsert().updateOne({
					address : dataB,
					score : 0.0,
					block : blockHeight
				});

			}
			bulk.execute();
			//controller.calculateAllRanks(db, fres);
		}); //end mongodb

		//fres.status(200).json({status:"success"});

      }); // end events
	}); // end block height

};

/* Given the complete set of scores, rank them from highest to lowest (just the sort() command and looping through all, adding the current i to each object's rank)
   1. get db.address.find().sort()
*/
controller.calculateAllRanks = function(db, res){ //only runs inside of a mongodb connection

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