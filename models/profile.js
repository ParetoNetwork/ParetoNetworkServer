var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var paretoProfileSchema = new Schema(
    {
        address: String,
        alias: String,
        aliasSlug: String,
        biography: String,
        profilePic: String,
        rewardsGiven: [
            {
                IntelID: {type: String},
                reward: {type: Number}
            }
        ],
        rewardsReceived: [
            {
                IntelID: {type: String},
                reward: {type: Number}
            }
        ]
    },
    {collection: "profile", toObject: {virtuals: true}, toJSON: {virtuals: true}}
);
paretoProfileSchema.virtual('rewardsSent', {
    ref: 'reward', // The model to use
    localField: 'address', // Find post where `localField`
    foreignField: 'sender', // is equal to `foreignField`
    justOne: false
});

paretoProfileSchema.virtual('rewardsEarned', {
    ref: 'reward', // The model to use
    localField: 'address', // Find post where `localField`
    foreignField: 'receiver', // is equal to `foreignField`
    justOne: false
});
const ParetoProfile = mongoose.model("profile", paretoProfileSchema);

module.exports = ParetoProfile;