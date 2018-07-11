var Web3 = require('web3');
const mongoose = require('mongoose');
const contract = require("truffle-contract");

var web3 = new Web3("ws://localhost:8545");
const ParetoIntel = mongoose.model('intel');


// set up Pareto and Intel contracts instances
const Intel_Contract_Schema = require("../build/contracts/Intel.json");
const Intel_Contract_Instance = contract(Intel_Contract_Schema);
Intel_Contract_Instance.setProvider(web3.currentProvider);

//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof Intel_Contract_Instance.currentProvider.sendAsync !== "function") {
    Intel_Contract_Instance.currentProvider.sendAsync = function () {
        return Intel_Contract_Instance.currentProvider.send.apply(
            Intel_Contract_Instance.currentProvider, arguments
        );
    };
}

Intel_Contract_Instance.deployed().then((intel_Instance) => {
    const reward_Event = intel_Instance.Reward({ fromBlock: "latest" });
    reward_Event.watch((err, event) => {

        console.log("Inside reward event listener!");

        if (err) {
            throw err;
        }

        const rewardAmount = event.args.rewardAmount.toNumber();
        const intelIndex = event.args.intelIndex.toNumber();

        ParetoIntel.findOneAndUpdate({ id: intelIndex }, { $inc: { reward: rewardAmount } }, function (err, response) {
            if (err) {
                throw err;
            }
            // console.log(err, response);
        });
    });


    const distribute_Event = intel_Instance.RewardDistributed({ fromBlock: "latest" });
    distribute_Event.watch((err, event) => {

        console.log("Inside distribute event listener!");

        if (err) {
            throw err;
        }
        const intelIndex = event.args.intelIndex.toNumber();

        ParetoIntel.update({ id: intelIndex }, { distributed: true }, { multi: false }, function (err, response) {
            if (err) {
                throw err;
            }
        });
    });

})