var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paretoHistoricalRankingSchema = new Schema({
    address : String,
    rank 	: Number,
    score 	: Number,
    block 	: Number,
    bonus 	: Number,
    tokens	: Number,
    dateCreated: { type: Date, default: Date.now }
}, { collection : 'historicalRanking' });

const ParetoHistoricalRanking = mongoose.model('historicalRanking', paretoHistoricalRankingSchema);

module.exports = ParetoHistoricalRanking;