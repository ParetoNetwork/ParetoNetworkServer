var mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

var Schema = mongoose.Schema;

var paretoIntelSchema = new Schema({
	address: String,
	intelAddress: String,
	title: String,
	body: String,
	text: String, //this is the plain text version of the html formatted body
	reward: { type: Number, default: 0 }, //set required { type: Number, required: true }
    totalReward: { type: Number, default: 0 },
    txHash: String,
    txHashDistribute: String,//set required { type: String, required: true }
	speed: Number,
	dateCreated: { type: Date, default: Date.now },
	block: Number,
	distributed: { type: Boolean, default: false },
	validated: { type: Boolean, default: false },
	assets:[{ asset: { type: mongoose.Schema.Types.ObjectId, ref: 'asset' }}],
	expires: Number // time in Epoch 

}, { collection : 'intel' , toObject : {virtuals:true},toJSON: { virtuals: true } });

paretoIntelSchema.plugin(AutoIncrement, { inc_field: 'id' });


paretoIntelSchema.virtual('createdBy', {
    ref: 'profile', // The model to use
    localField: 'address', // Find post where `localField`
    foreignField: 'address', // is equal to `foreignField`
    justOne: true
});

paretoIntelSchema.virtual('rewardsTransactions', {
    ref: 'reward', // The model to use
    localField: 'id', // Find post where `localField`
    foreignField: 'intelId', // is equal to `foreignField`
    justOne: false
});
const ParetoIntel = mongoose.model('intel.js', paretoIntelSchema);

module.exports = ParetoIntel;
