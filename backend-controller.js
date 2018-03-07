var mongodb = require('mongodb').MongoClient;
const assert = require('assert');
var connectionUrl = require('./backend-credentials.json').mongodb_connection;

const dbName = 'pareto';

function postContent (body, res){

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
			    	res.boom.badData();
			    } else {
			    	res.status(200); //why is this gibberish
			    }

			  });
		  }); //end mongodb

      });
};

module.exports.postContent = postContent;


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

function retrieveRankAroundAddress(){

	//a range of rankings

};

function calculateAllScores(){

	//way to do all the ranking calculations

};