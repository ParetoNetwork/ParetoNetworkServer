var Web3 = require('web3');
const mongoose = require('mongoose');

// var web3 = new Web3("ws://localhost:8545");
// var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"));
var web3 = new Web3("wss://ropsten.infura.io/ws");
// var web3 = new Web3("ws://localhost:8545");


const ParetoIntel = mongoose.model('content');


// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require("../build/contracts/Intel.json");

const Intel = new web3.eth.Contract(Intel_Contract_Schema.abi,  Intel_Contract_Schema.networks["3"].address);
Intel.events.Reward({
    fromBlock: 'latest'
}, function (error, event) {
    if (error) {
        console.log(error);
        return;
    }
    const rewardAmount = event.returnValues.rewardAmount;
    const intelIndex = event.returnValues.intelIndex;
    console.log("Reward event listener", rewardAmount, intelIndex)
    ParetoIntel.findOneAndUpdate({ id: intelIndex }, { $inc: { reward: rewardAmount } }, function (err, response) {
        if (err) {
            throw err;
        }
    });
})




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
