var Web3 = require('web3');
const mongoose = require('mongoose');
var WEB3_WEBSOCKET_URL = process.env.WEB3_WEBSOCKET_URL;
// var web3 = new Web3("ws://localhost:8545");
// var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"));
var web3 = new Web3(WEB3_WEBSOCKET_URL);
// var web3 = new Web3("ws://localhost:8545");
console.log('NO DEBER´IA ENTRAR QUI')

const ParetoIntel = mongoose.model('content');
const ParetoProfile = mongoose.model('profile');


// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require("../build/contracts/Intel.json");

const Intel = new web3.eth.Contract(Intel_Contract_Schema.abi,  Intel_Contract_Schema.networks[process.env.ETH_NETWORK].address);
Intel.events.Reward({
    fromBlock: 'latest'
}, function (error, event) {
    if (error) {
        console.log(error);
        return;
    }
    const rewardAmount = event.returnValues.rewardAmount;
    const intelIndex = event.returnValues.intelIndex;
    const sender = event.returnValues.sender;

    console.log("Reward event listener", rewardAmount, intelIndex)
    ParetoIntel.findOneAndUpdate({ id: intelIndex }, { $inc: { reward: rewardAmount } }, function (err, response) {
        if (err) {
            throw err;
        }
    });

    ParetoIntel.findOne({id:intelIndex}, (err, intel) => {
        const {address} = intel;

        ParetoProfile.findOne({address,'rewardsReceived.IntelID':intelIndex}, (err, profile) => {
            if(profile == null){
                ParetoProfile.update({address},{$push:{ rewardsReceived: { IntelID:intelIndex, reward:rewardAmount }}}, (err, profile) => {
                    // console.log("saved 1");
                })
                return;
            }
            ParetoProfile.update({address,'rewardsReceived.IntelID':intelIndex},{ $inc: {'rewardsReceived.$.reward': rewardAmount}}, (err, profle ) => {
                // console.log("update 1");
            } )
        })
    })

    ParetoProfile.findOne({address:sender.toLowerCase(),'rewardsGiven.IntelID':intelIndex}, (err, profile) => {
        console.log(err, profile);
        if(profile == null){
            ParetoProfile.update({address:sender.toLowerCase()},{$push:{ rewardsGiven: { IntelID:intelIndex, reward:rewardAmount }}}, (err, profile) => {
                // console.log("saved");
            })
            return;
        }
        ParetoProfile.update({address:sender.toLowerCase(),'rewardsGiven.IntelID':intelIndex},{ $inc: {'rewardsGiven.$.reward': rewardAmount}}, (err, profle ) => {
            // console.log("update");
        } )
    })

});

Intel.events.RewardDistributed({
    fromBlock: 'latest'
}, function (error, event) {
    if (error) {
        console.log(error);
        return;
    }
    const intelIndex = event.returnValues.intelIndex;

    ParetoIntel.update({ id: intelIndex }, { distributed: true }, { multi: false }, function (err, response) {
        if (err) {
            throw err;
        }
    });
})
