var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoContentSchema = new Schema({
	address : String,
	title 	: String,
	body	: String,
	reward	: Number, //set required { type: Number, required: true }
	txHash  : String, //set required { type: String, required: true }
	dateCreated : { type: Date, default: Date.now },
	block 	: Number

}, { collection : 'content' });

const ParetoContent = mongoose.model('content', paretoContentSchema);

module.exports = ParetoContent;