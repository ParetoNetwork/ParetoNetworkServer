var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoAddressSchema = new Schema({
	address : String,
	rank 	: Number,
	score 	: Number,
    lastRank 	: Number,
    lastScore 	: Number,
	block 	: Number,
    bonus 	: Number,
	tokens	: Number,
}, { collection : 'address' });

const ParetoAddress = mongoose.model('address', paretoAddressSchema);

module.exports = ParetoAddress;