var controller = module.exports = {};

/*constants*/
var connectionUrl = process.env.CRED_MONGODB || require('./backend-private-constants.json').mongodb_connection;
var paretoContractAddress = process.env.CRED_PARETOCONTRACT || require('./backend-public-constants.json').pareto_contract_address;

const fs = require('fs');
const path = require('path');

const modelsPath = path.resolve(__dirname, 'models')
fs.readdirSync(modelsPath).forEach(file => {
  require(modelsPath + '/' + file);
})

/*db initialization*/
var mongoose = require('mongoose');
//var models = require('./models/address');
mongoose.connect(connectionUrl);

/*db model initializations*/
const ParetoAddress = mongoose.model('address');
const ParetoContent = mongoose.model('content');

var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider("https://sealer.giveth.io:40404/"));
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/TnsZa0wRB5XryiozFV0i"));

/*project files*/
var utils = require('./backend-utils.js');


/*ways of writing contract creation block height*/
const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightInt = 4953750;

const dbName = 'pareto';

controller.calculateScore = async function(address, amount, callback){

    var blockHeight = 0;

    var rankCalculation = 0;

    if(web3.utils.isAddress(address) == false){
       if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
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
	              amount = web3.utils.fromWei(tokens, 'ether');
	              console.log("amount: " + amount);
	        }

	        if(amount > 0){
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
		                    transactions[i][2] = transactions[i][1]/amount; //adds decimal to the tuple
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

		                //do final calculations for this stage. 

		                //the problem with this is that this always increases and makes it hard for people to get a positive boost
		                //which is okay if the decimal is added to the total as well, but for everyone

		                //but multiple and divisor are both counting linearly, so some newcoming people will never get a boost, fix that.
		                var divisor = (blockHeight - contractCreationBlockHeightInt)/100;

		                console.log("divisor: " + divisor);

		                var multiple = 1 + (blockHeightDifference / divisor);
		                
		                var score = amount * multiple;
		                var bonus = blockHeightDifference / divisor;

		                var resultJson = {
		                	'address' : address,
		                	'score' : score,
		                	'block' : blockHeight,
		                	'bonus' : bonus
		                };

		                //write to db as well

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
								upsert : true,
								returnNewDocument: true
						  };

						  if(callback && typeof callback === "function") { callback(null,resultJson); }

						  //should queue for writing later
						  ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions, 
						  	function(err, r){
						  		if(err){
							    	console.error('unable to write to db because: ', err);
							    } else {
							    	console.log("here is db writing response : " + r);
							    } //end conditional
							} //end function
						  );

		              } catch (e) {
		                console.log(e);
		                if(callback && typeof callback === "function") { callback(err); }
		              }


		            } catch (e) {
		              console.log(e);
		              if(callback && typeof callback === "function") { callback(err); }
		            }

		          })//end second then promise
		          .catch(function (err) {
		            // API call failed...
		            console.log(err);
		            if(callback && typeof callback === "function") { callback(err); }
		          });
		        });//end first then promise
	        } else {
	 			var resultJson = {
		                	'address' : address,
		                	'score' : 0.0,
		                	'block' : blockHeight,
		                	'bonus' : 0.0
		        };

		        //update entry in database if it exists, do not put additional entry invar 
		        dbQuery = { 
				  	address : address 
				  };
				  var dbValues = { 
				  		$set: { 
				  				score : 0.0, 
				  				block: blockHeight 
				  		} 
				  };
				  var dbOptions = {
						upsert : false,
						returnNewDocument: true
				  };

				  //can also return unauthorized, PARETO balance 0.00, list of places to purchase some
				  if(callback && typeof callback === "function") { callback(null,resultJson); }

				  //should queue for writing later
				  ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions, 
				  	function(err, r){
				  		if(err){
					    	console.error('unable to write to db because: ', err);
					    } else {
					    	console.log("here is db writing response : " + r);
					    } //end conditional
					} //end function
				  );

	 		} //end

	        
	      });//end promise related to balance
	 }); //end promise related to block height
    } //end address validation

}

controller.postContent = function(body, fres){

	//exposed endpoint to write content to database
	  
	  web3.eth.getBlock('latest')
        .then(function(res) {

          body.dateCreated = Date.now();
          body.block = res.number;
          body.txHash = res.txHash || '0x0'; //this is done client side to cause an internal invocation

          /*

          * This may actually need a placeholder of txhash beforehand, and update the entry, needs state of tx like txconfirmed. or the system can just check when trying to access content?

          */

          const paretoContentObj = new ParetoContent(body);
          paretoContentObj.save(function(err, obj){
          		if (err) {
          			console.log(err);
          			fres.boom.badData();
          		} else {
          			fres.status(200).json({status: "success", objectId: obj.id});
          		}
          });

      }); //end web3
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
controller.seedLatestEvents = function(fres){

	var blockHeight = 0;

	//get current blocknumber too
    web3.eth.getBlock('latest')
     .then(function(res) {
      blockHeight = res.number;
      console.log("blockheight: " + blockHeight);

	return web3.eth.getPastLogs({
      fromBlock: '0x501331', //contractCreationBlockHeightHexString,
      toBlock: 'latest',
      address: '0xea5f88e54d982cbb0c441cde4e79bc305e5b43bc',
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null] //hopefully no topic address is necessary
    }).then(function (txObjects){

    	console.log("tx count here: " + txObjects.length);

		    var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();

			for(i = 0; i < txObjects.length; i++){

				var dataA = "0x" + txObjects[i].topics[1].substring(26);
				var dataB = "0x" + txObjects[i].topics[2].substring(26); //destination, most likely current holder
				var score = 0.0;

				//get all addresses first and add to the collection where necessary
				
				bulk.find({address : dataB}).upsert().updateOne({
					address : dataB,
					score : score,
					block : blockHeight
				});

			}
			bulk.execute(function (err) {

				controller.calculateAllScores(function(err, result){

					if(err){}

					//controller.calculateAllRanks();

				});

			});

		fres.status(200).json({status:"success"});

      }); // end events
	}); // end block height

};

controller.calculateAllScores = function(callback){
	
	console.log('addresses retrieval started');

	ParetoAddress.find({ score : {$eq: 0} }, 'address score', { limit : 5000 }, function(err, results){

		if(err){
			callback(err);
		}
		else {
			//loop through and calculate scores and save them

			console.log('addresses retrieved finished');

			async function processArray(results){

				console.log("processing addresses asynchronously");

				for (const item of results) {
					console.log("item : " + item.address);
					await controller.calculateScore(item.address, 0);
				}
				console.log("score calculation operation complete");
		        if(callback && typeof callback === "function") { callback(null, {} ); }
			}

			processArray(results);

			console.log('addresses updating method finished');

			/*
			var i = results.length-1;
			controller.calculateScore(results[i].address, 0, function(err, result, cb){

				console.log(results[i].address);
				i--;

		        if(err){
		          console.log(err.message);
		        }

		        if( i > -1){
		        	console.log("attempting callback for index: " + i);
		            controller.calculateScore(results[i].address, 0, cb);
		        } else {
		        	console.log("score calculation operation complete");
		        	if(callback && typeof callback === "function") { callback(null, {} ); }
		        }

		    }); */ //end callback 
		}

	});

};



/* Given the complete set of scores, rank them from highest to lowest (just the sort() command and looping through all, adding the current i to each object's rank)
   1. get db.address.find().sort()
*/
controller.calculateAllRanks = function(callback){



	/*var i = 1;

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
	}*/
};