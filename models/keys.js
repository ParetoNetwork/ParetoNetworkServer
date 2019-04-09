var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var intelKeysSchema = new Schema({
	profile  : { type: Schema.Types.ObjectId, ref: 'profile', unique : true },
	deviceId : Number,
	keys : Schema.Types.Mixed,
}, { collection : 'intel-key' });

const IntelKey = mongoose.model('intel-key', intelKeysSchema);

module.exports = IntelKey;