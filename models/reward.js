var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var rewardSchema = new Schema({
    sender: String,
    receiver: String,
    intelAddress: String,
    intelId: Number,
    txHash: String,
    dateCreated: { type: Date, default: Date.now },
    block: Number ,
    amount: Number

}, { collection : 'reward' , toObject : {virtuals:true},toJSON: { virtuals: true } });




rewardSchema.virtual('intel', {
    ref: 'content', // The model to use
    localField: 'intelId', // Find post where `localField`
    foreignField: 'id', // is equal to `foreignField`
    justOne: true
});
const ParetoReward = mongoose.model('reward', rewardSchema);

module.exports = ParetoReward;
