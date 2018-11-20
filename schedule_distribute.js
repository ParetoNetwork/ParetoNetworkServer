const cron = require("node-cron");
var Web3 = require("web3");
const mongoose = require("mongoose");
const ETHwallet = require("ethereumjs-wallet");
var Tx = require("ethereumjs-tx");

const web3 = new Web3(process.env.WEB3_URL);

const ParetoIntel = mongoose.model("content");

const ethNetwork = process.env.ETH_NETWORK;
const privKey = process.env.DT_ORACLE_SYS;

const Intel_Contract_Schema = require("./build/contracts/Intel.json");
const Intel = new web3.eth.Contract(
  Intel_Contract_Schema.abi,
  Intel_Contract_Schema.networks[ethNetwork].address
);

decryptedPrivKey = Buffer.from(privKey, "base64").toString("ascii");

let privateKeyBuff = new Buffer(decryptedPrivKey, "hex");
const wallet = ETHwallet.fromPrivateKey(privateKeyBuff);
const publicKey = wallet.getChecksumAddressString();

let txData, transaction, serializedTx;

cron.schedule("*/30 * * * *", async () => {
  console.log("Running rewards distriute scheduler");

  let current_time = Math.floor(new Date().getTime() / 1000);
  let distributeTime = current_time - 864000;
  let nonceNumber = await web3.eth.getTransactionCount(publicKey);
  try {
    /* 
        Find Pareto Intel that has not been distributed where the expires timestamp is less than distributeTime
        When we invoke the Intel smart contract distributeReward function, an event is fired per transaction. 
        An event listener resides in the backend javacript, when the event is received the ParetoIntel.distributed flag           
        is set to true.
    */
    ParetoIntel.find(
      {
        $and: [{ distributed: false }, { expires: { $lt: distributeTime } }]
      },
      async (err, intels) => {
        if (err) {
          console.log("ERROR FROM MONGODB: ", err);
          return;
        }
        //Iterate through each result.
        let intelsDistributed = 0;
        for (let i = 0; i < intels.length; i++) {
          const intelID = intels[i].id;

          //For each intel that we fetch from the Mongo, fetch information from the Intel smart contract for more details
          const fetched_intel = await Intel.methods.getIntel(intelID).call();

          //There are Intels in the Mongo that are not referenced in the Intel smart contract. These always have an intel.depositAmount of 0
          if (fetched_intel.depositAmount == 0) {
            continue;
          }

          //If, for some reason, the intel has always been rewarded. There are some records that are marked as not rewarded in the Mongo, but
          //are recorded as rewarded in the smart contract. Skip these.
          if (fetched_intel.rewarded == true) {
            continue;
          }

          //The Mongo tells us that we should reward on this piece of intel. The smart contract Intel tells us that the time has not arrived to distribute.
          //Adhere to the data in the smart contract. Skip this record as well.
          if (fetched_intel.rewardAfter > distributeTime) {
            continue;
          }

          console.log(fetched_intel);

          //Lets calculate the gasLimit and gasPrice dynamically

          const gasPrice = await web3.eth.getGasPrice();
          const gas = await Intel.methods
            .distributeReward(intelID)
            .estimateGas({ from: publicKey });

          const data = Intel.methods.distributeReward(intelID).encodeABI();
          // construct the transaction data
          txData = {
            nonce: web3.utils.toHex(nonceNumber++),
            gasLimit: web3.utils.toHex(gas),
            gasPrice: web3.utils.toHex(gasPrice),
            to: Intel_Contract_Schema.networks[ethNetwork].address,
            from: publicKey,
            data
          };

          transaction = new Tx(txData);
          transaction.sign(privateKeyBuff);
          serializedTx = transaction.serialize().toString("hex");
          web3.eth.sendSignedTransaction("0x" + serializedTx, (err, hash) => {
            if (err) {
              console.log("Distribute Scheduler Transaction error: ", err);
            }
            intelsDistributed++;
          });
        }
        console.log(
          "================== Intels distributed ================== ",
          intelsDistributed
        );
      }
    );
  } catch (err) {
    console.log("Error in try/catch of distribute scheduler ", err);
  }
});
