var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var paretoProfileSchema = new Schema(
  {
    address: String,
    firstName: String,
    lastName: String,
    biography: String,
    profilePic: String,
    rewardsGiven: [
      {
        IntelID: { type: String },
        reward: { type: Number }
      }
    ],
    rewardsReceived: [
      {
        IntelID: { type: String },
        reward: { type: Number }
      }
    ]
  },
  { collection: "profile" }
);

const ParetoProfile = mongoose.model("profile", paretoProfileSchema);

module.exports = ParetoProfile;