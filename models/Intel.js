var mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

var Schema = mongoose.Schema;

var IntelSchema = new Schema({
	address: String,
	title: String,
	body: String,
	text: String, //this is the plain text version of the html formatted body
	reward: {type:Number, default:0}, //set required { type: Number, required: true }
	txHash: String, //set required { type: String, required: true }
	speed: Number,
	dateCreated: { type: Date, default: Date.now },
	block: Number,
	distributed: {type: Boolean, default: false},
	validated:{type: Boolean, default: false},
	expires: Number // time in Epoch 

}, { collection: 'intel' });
IntelSchema.plugin(AutoIncrement, {inc_field: 'id'});

const Intel = mongoose.model('intel', IntelSchema);

module.exports = Intel;