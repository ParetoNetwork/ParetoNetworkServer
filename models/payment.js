var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commitSchema = new Schema({
    email: String,
    order_id: String,
    processed:  { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
})

const payment = mongoose.model('payment', commitSchema);

module.exports = payment;




