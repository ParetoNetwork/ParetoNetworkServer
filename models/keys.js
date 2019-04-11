var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var profileKeysSchema = new Schema({
	profile  : { type: Schema.Types.ObjectId, ref: 'profile'},
	deviceId : Number,
	address : String,
	keys : Schema.Types.Mixed,
	type: {
		type: String,
		enum: ['profile', 'server'],
		default : 'profile'
	}
}, { collection : 'profile-key' });

profileKeysSchema.index({ address: 1, type: 1 }, { unique: true });

const ProfileKey = mongoose.model('profile-key', profileKeysSchema);

module.exports = ProfileKey;