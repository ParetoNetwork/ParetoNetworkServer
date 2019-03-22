var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoTransactionSchema = new Schema({
    address : String,
    txHash 	: String,
    intel 	: Number,
    event 	: String,
    amount	: Number,
    nonce	: Number,
    status	: { type: Number, default: 0 },
    block	:   Number,
    txRewardHash: String,
    intelAddress: String,
    dateCreated: { type: Date, default: Date.now }
}, { collection : 'transaction' , toObject : {virtuals:true},toJSON: { virtuals: true } });


paretoTransactionSchema.virtual('intelData', {
    ref: 'content', // The model to use
    localField: 'intel', // Find post where `localField`
    foreignField: 'id', // is equal to `foreignField`
    justOne: true
});

const ParetoTransaction = mongoose.model('transaction', paretoTransactionSchema);

module.exports = ParetoTransaction;