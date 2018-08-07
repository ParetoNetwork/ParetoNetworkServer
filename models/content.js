var mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

var Schema = mongoose.Schema;

var paretoContentSchema = new Schema({
	address: String,
	title: String,
	body: String,
	text: String, //this is the plain text version of the html formatted body
	reward: { type: Number, default: 0 }, //set required { type: Number, required: true }
	txHash: String, //set required { type: String, required: true }
	speed: Number,
	dateCreated: { type: Date, default: Date.now },
	block: Number,
	distributed: { type: Boolean, default: false },
	validated: { type: Boolean, default: false },
	expires: Number // time in Epoch 

}, { collection: 'content' });

paretoContentSchema.plugin(AutoIncrement, { inc_field: 'id' });

const ParetoContent = mongoose.model('content', paretoContentSchema);

module.exports = ParetoContent;
