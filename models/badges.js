var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var badgesSchema = new Schema({
    badge_type: String,
    repository_name: String,
    record_counting: Number
}).index({ badge_type: 1, repository_name:1 }, { unique: true });

const badges = mongoose.model('badges', badgesSchema);

module.exports = badges;