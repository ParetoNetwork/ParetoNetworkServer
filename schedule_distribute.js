const cron = require("node-cron");
var Web3 = require("web3");
const mongoose = require("mongoose");
const ETHwallet = require("ethereumjs-wallet");
var Tx = require("ethereumjs-tx");

const web3 = new Web3(process.env.WEB3_URL);

const ParetoIntel = mongoose.model("intel.js");
const ParetoProfile = mongoose.model("profile");

const ethNetwork = process.env.ETH_NETWORK;
const privKey = process.env.PRIV_KEY_DISTRIBUTOR;

const Intel_Contract_Schema = require("./build/contracts/Intel.json");
const Intel = new web3.eth.Contract(
  Intel_Contract_Schema.abi,
  Intel_Contract_Schema.networks[ethNetwork].address
);

decryptedPrivKey = Buffer.from(privKey, 'base64').toString('ascii');

let privateKeyBuff = new Buffer(decryptedPrivKey, "hex");
const wallet = ETHwallet.fromPrivateKey(privateKeyBuff);
const publicKey = wallet.getChecksumAddressString();

let gPrice, txData, data, transaction, serializedTx;

cron.schedule("*/30 * * * *", async () => {
  console.log("Running rewards distriute scheduler");

  let current_time = Math.floor(new Date().getTime() / 1000);
  let distributeTimeAfter10Days = current_time + 864000;
  let nonceNumber = await web3.eth.getTransactionCount(publicKey);

  ParetoIntel.find(
    {
      $and: [
        { distributed: false },
        { expires: { $lt: distributeTimeAfter10Days } }
      ]
    },
    async (err, intels) => {
      for (let i = 0; i < intels.length; i++) {
        const intelID = intels[i].id;
        const intelProvider = intels[i].address;

        const data = Intel.methods.distributeReward(intelID).encodeABI();
        // construct the transaction data
        txData = {
          nonce: web3.utils.toHex(nonceNumber++),
          gasLimit: web3.utils.toHex(900000),
          gasPrice: web3.utils.toHex(30e9), // 10 Gwei
          to: Intel_Contract_Schema.networks[ethNetwork].address,
          from: publicKey,
          data
        };

        transaction = new Tx(txData);
        transaction.sign(privateKeyBuff);
        serializedTx = transaction.serialize().toString("hex");
        web3.eth.sendSignedTransaction("0x" + serializedTx, (err, hash) => {
          console.log(hash);
        });
      }
    }
  );
});
