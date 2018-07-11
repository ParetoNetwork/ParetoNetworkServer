// var Intel = artifacts.require("./Intel.sol");
// var ParetoNetworkToken = artifacts.require("./ParetoNetworkToken.sol");
// var DummyToken = artifacts.require("./DummyToken.sol");

// var request = require('axios');


// contract('Intel', (accounts) => {
//     let gasPrice;
//     let _intelID;

//     (async () => {

//         // Get the gas price for current network
//         web3.eth.getGasPrice((err, _gasPrice) => {
//             if (err) {
//                 throw err;
//             }
//             gasPrice = _gasPrice.toNumber();
//             console.log(`Gas price is ${gasPrice} Wei`)
//         });
//     })();

//     it("Intel contract is deployed.", async () => {

//         const IntelInstance = await Intel.deployed();
//         assert(IntelInstance.address != null);

//     });

//     it("Set Pareto Token address", async () => {

//         const IntelInstance = await Intel.deployed();
//         const ParetoTokenInstance = await ParetoNetworkToken.deployed();


//         const Pareto_token_address = ParetoTokenInstance.address;


//         await IntelInstance.setParetoToken(Pareto_token_address);       // set Pareto token address in Intel contract
//         const getTokenAddress = await IntelInstance.token();            // get Pareto token address set in Intel contract
//         assert.equal(getTokenAddress, Pareto_token_address, "Token address in not equal")

//     })

//     it("Test fallback function", async () => {

//         const IntelInstance = await Intel.deployed();
//         try {
//             await IntelInstance.sendTransaction({ from: accounts[7], value: web3.toWei('0.1', 'ether') });       // set Pareto token address in Intel contract
//             assert(false);
//         }
//         catch (e) {
//             assert(true);
//         }

//     })

//     it("Create Intel", async () => {

//         const IntelInstance = await Intel.deployed();
//         const ParetoTokenInstance = await ParetoNetworkToken.deployed();

//         const Intel_Address = IntelInstance.address;


//         const decimals = await ParetoTokenInstance.decimals();       // get decimals of Pareto token
//         const _depositAmount = 500 * (10 ** decimals);
//         const _desiredReward = 1000 * (10 ** decimals);
//         const _ttl = Math.round(((new Date).getTime() / 1000)) + 3;  // add five seconds to to allow the rewarder to reward pareto tokens
//         const provider_address = accounts[0];

//         const result = await request.post(
//             'http://localhost:3000/v1/createIntel',
//             {
//                 "address": provider_address,
//                 "title": "Intel's title",
//                 "body": "Intel's body",
//                 "text": "Intel's text"

//             });

//             _intelID = result.data.Intel_Id;



//         // approve the '_depositAmount' tokens from provider to Intel Contract
//         let tx = await ParetoTokenInstance.approve(Intel_Address, _depositAmount, { from: provider_address });
//         if (tx.logs[0].args.spender != Intel_Address) {
//             assert(false, "Approve event args doesn't match")
//         }


//         // Assert that allowance from provider to Intel is equal to _depositAmount
//         let Intel_allowance = await ParetoTokenInstance.allowance(provider_address, Intel_Address);
//         assert.equal(Intel_allowance.toNumber(), _depositAmount);


//         // Estimate Gas for creating an Intel
//         const gas_Create = await IntelInstance.create.estimateGas(provider_address, _depositAmount, _desiredReward, _intelID, _ttl, { from: provider_address });
//         console.log(`Creating Intel requires ${gas_Create} gas\n costs ${gas_Create * gasPrice} in Wei\n costs ${gas_Create * gasPrice / (10 ** 18)} in Ethers`)


//         // Call the create function on Intel contract to create an Intel
//         tx = await IntelInstance.create(provider_address, _depositAmount, _desiredReward, _intelID, _ttl, { from: provider_address });


//         // check and compare the arguments returned from the log of create intel transaction
//         let { intelProvider, depositAmount, desiredReward, intelID, ttl } = tx.logs[0].args; // get the event logs
//         depositAmount = depositAmount.toNumber();
//         desiredReward = desiredReward.toNumber();
//         intelID = intelID.toNumber();
//         ttl = ttl.toNumber();


//         // compare the log values with the input values
//         if (depositAmount != _depositAmount || desiredReward != _desiredReward || intelID != _intelID || ttl != _ttl) {
//             assert(false, "NewIntel event args doesn't match")
//         }


//         // fetch the created Intel using intel's ID
//         const fetched_Intel = await IntelInstance.getIntel(_intelID);


//         // compare the values from fetched Intel with the input values
//         if (fetched_Intel[0] != provider_address || fetched_Intel[1] != _depositAmount || fetched_Intel[2] != _desiredReward || fetched_Intel[3] != _depositAmount || fetched_Intel[4] != _intelID) {
//             assert(false, "Intel create doesn't match with the input values");
//         }

//     });


//     it("Send Reward", async () => {

//         const IntelInstance = await Intel.deployed();
//         const ParetoTokenInstance = await ParetoNetworkToken.deployed();


//         const rewarder = accounts[2];
//         const owner = accounts[0];


//         const Intel_Address = IntelInstance.address;


//         const decimals = await ParetoTokenInstance.decimals();
//         const _rewardAmount = 700 * (10 ** decimals);


//         // Get balance of the Intel before reward
//         const Intel_before = await IntelInstance.getIntel(_intelID);
//         const Intel_balance_before = Intel_before[3].toNumber();


//         // Transfer 700 Pareto tokens from owner to rewarder
//         await ParetoTokenInstance.transfer(rewarder, _rewardAmount, { from: owner });


//         // Check the balance of rewarder  
//         let Rewarder_balance = await ParetoTokenInstance.balanceOf(rewarder);
//         assert.equal(Rewarder_balance.toNumber(), _rewardAmount);


//         // approve the 'rewardAmount' tokens from rewarder to Intel Contract
//         let tx = await ParetoTokenInstance.approve(Intel_Address, _rewardAmount, { from: rewarder });
//         if (tx.logs[0].args.spender != Intel_Address) {
//             assert(false, "Approve event args doesn't match")
//         }


//         // Assert that allowance from rewarder to Intel is equal to _rewardAmount
//         let Intel_allowance = await ParetoTokenInstance.allowance(rewarder, Intel_Address);
//         assert.equal(Intel_allowance.toNumber(), _rewardAmount);


//         // Estimate gas for sending reward
//         const gas_sendReward = await IntelInstance.sendReward.estimateGas(_intelID, _rewardAmount, { from: rewarder });
//         console.log(`Sending reward requires ${gas_sendReward} gas\n costs ${gas_sendReward * gasPrice} in Wei\n costs ${gas_sendReward * gasPrice / (10 ** 18)} in Ethers`)


//         // Call sendReward function on Intel contract to send reward to an Intel
//         tx = await IntelInstance.sendReward(_intelID, _rewardAmount, { from: rewarder });


//         // Check and compare the returned values from the log with the input values
//         let { rewardAmount } = tx.logs[0].args; // get the event logs
//         rewardAmount = rewardAmount.toNumber();


//         if (rewardAmount != _rewardAmount) {
//             assert(false, "Reward event args doesn't match")
//         }


//         // Get balance of the Intel after reward
//         const Intel_after = await IntelInstance.getIntel(_intelID);
//         const Intel_balance_after = Intel_after[3].toNumber();


//         // Assert before and after balance of Intel
//         assert.equal(Intel_balance_after, Intel_balance_before + _rewardAmount);


//     })

//     it("Distribute Rewards", async () => {

//         const IntelInstance = await Intel.deployed();
//         const ParetoTokenInstance = await ParetoNetworkToken.deployed();


//         const distributer = accounts[4];
//         console.log("Waiting...")


//         return new Promise((resolve, reject) => {
//             setTimeout(async () => {

//                 // Get the Pareto token balance of Intel provider before distribution and Intel's total balance
//                 const fetched_Intel_before = await IntelInstance.getIntel(_intelID);
//                 let provider_before_balance = await ParetoTokenInstance.balanceOf(fetched_Intel_before[0]);
//                 provider_before_balance = provider_before_balance.toNumber();


//                 let Intel_balance = fetched_Intel_before[3];
//                 Intel_balance = Intel_balance.toNumber();


//                 // Estimate gas for distributing reward
//                 let gas_distributeReward = await IntelInstance.distributeReward.estimateGas(_intelID, { from: distributer });
//                 console.log(`Distributing reward requires ${gas_distributeReward} gas\n costs ${gas_distributeReward * gasPrice} in Wei\n costs ${gas_distributeReward * gasPrice / (10 ** 18)} in Ethers`)


//                 // call distributeReward on Intel contract to distribute reward to the Intel provider
//                 let tx = await IntelInstance.distributeReward(_intelID, { from: distributer });


//                 // compare the returned values from log event with the input value
//                 let { intelIndex, amount } = tx.logs[0].args;
//                 amount = amount.toNumber();
//                 if (_intelID != intelIndex) {
//                     assert(false, "RewardDistributed event args doesn't match");
//                     reject("RewardDistributed event args doesn't match");
//                 }


//                 // Get balance 
//                 const fetched_Intel_after = await IntelInstance.getIntel(_intelID);
//                 let provider_after_balance = await ParetoTokenInstance.balanceOf(fetched_Intel_after[0]);
//                 provider_after_balance = provider_after_balance.toNumber();

//                 // Assert the Intel provder's Pareto token balance before and after distribution
//                 assert.equal(provider_after_balance, parseFloat(provider_before_balance) + parseFloat(amount));

//                 resolve();
//             }, 6000);
//         })



//     })

//     it("Text Proxy", async () => {

//         const IntelInstance = await Intel.deployed();
//         const DummyTokenInstance = await DummyToken.deployed();


//         const depositAmount = 500 * (10 ** 18);
//         const testAccount = accounts[5];
//         const owner = accounts[0];


//         // Transfer 500 dummy Tokens from testAccount to Intel contract
//         await DummyTokenInstance.transfer(IntelInstance.address, depositAmount, { from: testAccount });


//         // Get Intel contract's dummy balance
//         let Intel_dummy_balance = await DummyTokenInstance.balanceOf(IntelInstance.address);
//         Intel_dummy_balance = Intel_dummy_balance.toNumber();
//         // Assert the Intel contract's dummy balance with deposit amount
//         assert.equal(Intel_dummy_balance, depositAmount);


//         // Estimate gas for calling proxy function on Intel contract
//         const gas_Proxy = await IntelInstance.proxy.estimateGas(DummyTokenInstance.address, testAccount, depositAmount, 2100000, { from: owner });
//         console.log(`Calling Proxy requires ${gas_Proxy} gas\n costs ${gas_Proxy * gasPrice} in Wei\n costs ${gas_Proxy * gasPrice / (10 ** 18)} in Ethers`)


//         // Call proxy function on Intel contract to return dummy token received from testAccount
//         await IntelInstance.proxy(DummyTokenInstance.address, testAccount, depositAmount, 2100000, { from: owner });


//         // Get Intel contract's dummy balance after the Dummy tokens have been returned
//         Intel_dummy_balance = await DummyTokenInstance.balanceOf(IntelInstance.address);
//         Intel_dummy_balance = Intel_dummy_balance.toNumber();
//         // Assert the after balance of Intel contract's dummy tokens with 0
//         assert.equal(Intel_dummy_balance, 0);

//     })
// });
