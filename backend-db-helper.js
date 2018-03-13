var db = module.exports = {};

var mongodb = require('mongodb').MongoClient;

const dbName = 'pareto';

db.update = function(collectionName, dbQuery, dbValues, dbOptions, res){

	mongodb.connect(connectionUrl, function(err, client) {
		  assert.equal(null, err);
		  //console.log("Connected correctly to server");

		  const db = client.db(dbName);

		  //should queue for writing later
		  db.collection(collectionName).updateOne(dbQuery, dbValues, dbOptions,
		  	function(err, r){
		  		if(err){
				    	console.error('unable to write to db because: ', err);
				    	res.boom.badData();
			    } else {
			    	console.log(r);
			    	res.status(200).json({}); //or a callback
			    } //end conditional
			} //end function
		  );
		});//end mongo

      } catch (e) {
        console.log(e);
        res.status(500).send('Something broke!')
      }
};