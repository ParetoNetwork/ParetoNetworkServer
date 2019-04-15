var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var profileKeysSchema = new Schema({
	profile  : { type: Schema.Types.ObjectId, ref: 'profile', },
	deviceId : Number,
	address : String,
	keys : Schema.Types.Mixed,
	dateCreated: { type: Date, default: Date.now },
}, { collection : 'profile-key' });

profileKeysSchema.index({ address: 1 }, { unique: true });

const ProfileKey = mongoose.model('profile-key', profileKeysSchema);

module.exports = ProfileKey;