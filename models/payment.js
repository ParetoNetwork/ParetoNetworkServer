var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commitSchema = new Schema({
    email: String,
    order_id: String,
    processed:  { type: Boolean, default: false },
    state:  { type: Number, default: 0 },
    amount:  { type: Number, default: 0 },
    txHash:  String,
    address:  String,
    timestamp: String,
    oracleTxHash: String,
    date: { type: Date, default: Date.now },
})

const payment = mongoose.model('payment', commitSchema);

module.exports = payment;




