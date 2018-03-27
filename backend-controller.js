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

module.exports.mongoose = mongoose;

/*ways of writing contract creation block height*/
const contractCreationBlockHeightHexString = '0x4B9696'; //need this in hex
const contractCreationBlockHeightInt = 4953750;

const dbName = 'pareto';

/*system constants*/
const PARETO_SCORE_MINIMUM 					=			100000; 	//minimum score to get intel
const PARETO_RANK_GRANULARIZED_LIMIT 		= 			10; 		//how far down to go through ranks until separating by tiers

controller.calculateScore = async function(address, amount, blockHeightFixed, callback){

	address = address.toLowerCase();

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

        //this call doesn't use the padded address
		var tknAddress = (address).substring(2);
        var contractData = ('0x70a08231000000000000000000000000' + tknAddress);

		//ethereum servers suck, give them 5ms to breath
        await new Promise(r => setTimeout(() => r(), 5)); 
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
		                if(blockHeightFixed > 0){
		                	blockHeight = blockHeightFixed;
		                }

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

						  //should queue for writing later
						  ParetoAddress.findOneAndUpdate(dbQuery, dbValues, dbOptions, 
						  	function(err, r){
						  		if(err){
							    	console.error('unable to write to db because: ', err);
							    } else {
							    	
							    	ParetoAddress.count({}, function(err, count){
							    		if(err){}
							    		else {
							    			var resultJson = {
							                	'address' : r.address,
							                	'score' : r.score,
							                	'block' : blockHeight,
							                	'bonus' : bonus,
							                	'rank'  : r.rank,
							                	'totalRanks' : count
							                };
							    			console.log("here is db writing response : " + JSON.stringify(resultJson));
						  					if(callback && typeof callback === "function") { callback(null,resultJson); }
							    		}
							    	}); //end count
							    	
							    	//if(callback && typeof callback === "function") { callback(null,r); }
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
		                	'rank'  : -1,
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
				  				rank : -1, 
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

controller.postContent = function(body, callback){

	//exposed endpoint to write content to database
	if(web3.utils.isAddress(body.address) == false){
       if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
    } else {

	  web3.eth.getBlock('latest')
        .then(function(res) {

          body.dateCreated = Date.now();
          body.block = res.number;
          body.txHash = res.txHash || '0x0'; //this is done client side to cause an internal invocation
          body.speed = 3; //1 is very fast speed, 2 is fast, 3 is normal, medium speed, 4 is very slow speed for long applicable swing trades

          /*

          * This may actually need a placeholder of txhash beforehand, and update the entry, needs state of tx like txconfirmed. or the system can just check when trying to access content?

          */

          const paretoContentObj = new ParetoContent(body);
          paretoContentObj.save(function(err, obj){
          		if(err){ 
					if(callback && typeof callback === "function") { callback(err); }
				}
				else {
					if(callback && typeof callback === "function") { callback(null, obj); }
				}
          });

      }); //end web3
    } // end else
	  
};


controller.getAllAvailableContent = function(params, callback) {

	//check if user, then return what the user is privy to see

	//check block number or block age, then retrieve all content after that block. add more limitations/filters later

	if(web3.utils.isAddress(params.address) == false){
       if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
    } else {

		//1. get score from address, then get standard deviation of score
		controller.retrieveAddress(params, function(err,result) {
			if(err){
		       if(callback && typeof callback === "function") { 
					callback(err); 
				}
		    } else {

		    	//1b. get block height
		    	web3.eth.getBlock('latest')
			     .then(function(res) {
			      	blockHeight = res.number;

			    	//2. get percentile

			    	//2a. get total rank where score > 0
			    	ParetoAddress.count({ score : { $gt : 0 }}, async(count) => {
			    		var count = count;

			    		var percentile = 1 - (result.rank / count); //this should be a decimal number

			    		var blockDelay = 0;

			    		if(percentile > .99) {

			    			//then do multiplication times the rank to determine the block height delta.
			    			if(result.rank < PARETO_RANK_GRANULARIZED_LIMIT){
			    				blockDelay = result.rank * 10;
			    			} else {
			    				blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 10;
			    			}
		    			/*} else { //this would be a dynamic method where var factor = Math.pow(10, -1);
		    					   //would be used with var wholePercentile = percentile * 100;
		    					   //Math.round(wholePercentile * factor) / factor in order to get the percentile
							
							var factor = Math.pow(10, -1);
							var wholePercentile = percentile * 100;
							var roundedToNearestPercentile = Math.round(wholePercentile * factor) / factor;
							//var multiplier = 100 * Math.floor(percentile);
							blockDelay = (100 - roundedToNearestPercentile)) * PARETO_RANK_GRANULARIZED_LIMIT;

						}*/
		    		
			    		} else if (percentile > .90) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 20;

			    		} else if (percentile > .80) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 30;

			    		} else if (percentile > .70) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 40;

			    		} else if (percentile > .60) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 50;

			    		} else if (percentile > .50) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 60;

			    		} else if (percentile > .40) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 70;

			    		} else if (percentile > .30) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 80;

			    		} else if (percentile > .20) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 90;

			    		} else if (percentile > .10) {

			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 100;

			    		} else {
			    			blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 110;
			    		}

			    		var blockHeightDelta = blockHeight - blockDelay;
			       
						var queryVeryFast = ParetoContent.find({block : { $lte : blockHeightDelta*1 }, speed : 1}).sort({block : -1});
						var queryFast = ParetoContent.find({block : { $lte : blockHeightDelta*50 }, speed : 2}).sort({block : -1});
						var queryNormal = ParetoContent.find({block : { $lte : blockHeightDelta*100 }, speed : 3}).sort({block : -1});
						var querySlow = ParetoContent.find({block : { $lte : blockHeightDelta*150 }, speed : 4}).sort({block : -1});
						
						try{
							let resultsVeryFast = await queryVeryFast.exec();
							let resultsFast = await queryFast.exec();
							let resultsNormal = await queryNormal.exec();
							let resultsSlow = await querySlow.exec();

							let allResults = [];

							resultsVeryFast.forEach(function(entry){
								allResults.push(entry);
							});

							resultsFast.forEach(function(entry){
								allResults.push(entry);
							});

							resultsNormal.forEach(function(entry){
								allResults.push(entry);
							});

							resultsSlow.forEach(function(entry){
								allResults.push(entry);
							});

							function compare(a, b) {
							  const blockA = a.block;
							  const blockB = b.block;
							  
							  let comparison = 0;
							  if (blockB > blockA) {
							    comparison = 1;
							  } else if (blockB < blockA) {
							    comparison = -1;
							  }
							  return comparison;
							}

							allResults = allResults.sort(compare);

							//sort results
							console.log(allResults);

							if(callback && typeof callback === "function") { callback(null, allResults ); }

						} catch (err) {
							if(callback && typeof callback === "function") { callback(err); }
						}

						
			    	});
		    	});
		    	
		    }
		});
	} // end else for address validation

};

controller.retrieveAddress = function(params, callback){

	var address = params.address || '';
	address = address.toLowerCase();
   
    if(web3.utils.isAddress(address) == false){
       if(callback && typeof callback === "function") { callback(new Error('Invalid Address')); }
    } else {
		var query = ParetoAddress.findOne({address : address});
		
		query.exec(function(err, results){
			if(err){ 
				if(callback && typeof callback === "function") { 
					callback(err); 
				}
			}
			else {
				if(callback && typeof callback === "function") { callback(null, results ); }
			}
		});
	}

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
* Retrieves rank around address
*/
controller.retrieveRanksAtAddress = function(rank, limit, page, callback){

	var queryRank = rank - 3;
	if(queryRank <= 0){
		queryRank = 1;
	}

	var query = ParetoAddress.find({ rank : {$gte : queryRank}}).limit(limit).skip(page);

	query.exec(function(err, results){

		if(err){ 
			if(callback && typeof callback === "function") { 
				callback(err); 
			} 
		}
		else {
			if(callback && typeof callback === "function") { callback(null, results ); }
		}
	});

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
      fromBlock: contractCreationBlockHeightHexString,//'0x501331', //contractCreationBlockHeightHexString,
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
					$set : {
						address : dataB,
						score : score,
						block : blockHeight,
						rank : -1
					}
				});

			}
			console.log("writing all events now");
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

	web3.eth.getBlock('latest')
        .then(function(res) {
          blockHeight = res.number;
          console.log("blockheight: " + blockHeight);


		ParetoAddress.find({ score : {$eq: 0} }, 'address score', { /*limit : 10000*/ }, function(err, results){
		//ParetoAddress.find({ score : {$eq: 0} }, 'address score', { limit : 10000 }, function(err, results){	
			if(err){
				callback(err);
			}
			else {
				//loop through and calculate scores and save them

				async function processArray(results){

					console.log("processing addresses asynchronously");

					for (const item of results) {
						console.log("item : " + item.address);
						//possible optimization: initialize bulk here, push function into this, queue all results and bulk write later
						await controller.calculateScore(item.address, 0, blockHeight);
					}
					
			        if(callback && typeof callback === "function") { callback(null, {} ); }
				}

				processArray(results);

				console.log('addresses updating method finished');
			}

		});
	});

};



/* Given the complete set of scores, 
   rank them from highest to lowest 
   (just the sort() command and looping through all, adding the current i to each object's rank)
   get db.address.find().sort()
*/
controller.calculateAllRanks = function(callback){
	console.log("updating ranks begun");
	//-1 desc where greatest number to smallest number, 1 asc for smallest number to greatest number, limit just for testing
	var query = ParetoAddress.find().sort({score : -1});

	query.exec(function(err, results){
		if(err){
			callback(err);
		}
		else {
			console.log("updating ranks finished querying with results.length : " + results.length);
			if(callback && typeof callback === "function") { callback(null, {} ); }
			
			console.log(results);

			var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();
			var i = 1;
			results.forEach(function(result){
				bulk.find({ address : result.address }).updateOne({
					$set : { rank : i } 
				});
				//console.log("updating : " + result.address);
				
				i++;
			});
			bulk.execute(function (err) {
				//optional logic here
				console.log("updating ranks finished");
			});
		}
	});
};

/*
* Set all rank to -1, nullifying them
*/

controller.resetRanks = function(callback){
	console.log("resetting ranks begun");
	ParetoAddress.find({}, function(err, results) {
		if(err){
			callback(err);
		}
		else {
			console.log("resetting ranks finished querying");
			if(callback && typeof callback === "function") { callback(null, {} ); }
			
			var bulk = ParetoAddress.collection.initializeUnorderedBulkOp();
			var i = 1;
			results.forEach(function(result){
				bulk.find({ address : result.address }).updateOne({
					$set : { rank : -1 } 
				});
				
				i++;
			});
			bulk.execute(function (err) {
				//optional logic here
				console.log("resetting ranks finished");
			});

			
		}
	});
};