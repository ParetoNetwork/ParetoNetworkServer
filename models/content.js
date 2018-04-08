var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoContentSchema = new Schema({
	address : String,
	title 	: String,
	body	: String,
	text	: String, //this is the plain text version of the html formatted body
	reward	: Number, //set required { type: Number, required: true }
	txHash  : String, //set required { type: String, required: true }
	speed	: Number, 
	dateCreated : { type: Date, default: Date.now },
	block 	: Number

}, { collection : 'content' });

const ParetoContent = mongoose.model('content', paretoContentSchema);

module.exports = ParetoContent;