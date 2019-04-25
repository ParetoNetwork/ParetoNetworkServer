var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commitSchema = new Schema({
    commit_id: String,
    author_username: String,
    author_email: String,
    message:String,
    date: { type: Date, default: Date.now },
}).index({ commit_id: 1 }, { unique: true });

const community_commit = mongoose.model('community_commit', commitSchema);

module.exports = community_commit;