var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commitSchema = new Schema({
    commit_id: String,
    email: String,
    order_id: String,
    processed:  { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
}).index({ commit_id: 1 }, { unique: true });

const payment = mongoose.model('payment', commitSchema);

module.exports = payment;




