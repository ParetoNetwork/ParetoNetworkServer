var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var intelKeysSchema = new Schema({
	profile  : { type: ObjectId, ref: 'profile' },
	deviceId : Number,
	keys : Schema.Types.Mixed,
}, { collection : 'intel-key' });

const IntelKey = mongoose.model('intel-key', intelKeysSchema);

module.exports = IntelKey;