var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoTransactionSchema = new Schema({
    address : String,
    txHash 	: String,
    intel 	: Number,
    event 	: String,
    amount	: Number,
    status	: { type: Number, default: 0 },
    block	:   Number,
    dateCreated: { type: Date, default: Date.now }
}, { collection : 'transaction' });

const ParetoTransaction = mongoose.model('transaction', paretoTransactionSchema);

module.exports = ParetoTransaction;