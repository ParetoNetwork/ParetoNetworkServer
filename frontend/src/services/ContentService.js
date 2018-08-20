import http from "./HttpService";
import Web3 from "web3";
import Intel_Contract_Schema from "../build/contracts/Intel.json";
import Pareto_Token_Schema from "../build/contracts/ParetoNetworkToken.json";

/* eslint-disable no-console */
export default class ContentService {
  static uploadContent(content, onSuccess, onError) {
    http
      .post("/v1/content", content)
      .then(res => {
        if (res.data.success) {
          return onSuccess(res.data.data);
        } else {
          return onError(res.data.message);
        }
      })
      .catch(error => {
        return onError(error);
      });
  }

  static createIntel(content, onSuccess, onError) {
    let provider;
    if (typeof window.web3 !== "undefined") {
      // Use Mist/MetaMask's provider
      provider = new Web3(window.web3.currentProvider);
    } else {
      console.log("No web3? You should consider trying MetaMask!");
      onError(
        "Please install MetaMask (or other web3 browser) in order to access the Pareto Network"
      );

      // searchLookup();
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      provider = new Web3(
        new Web3.providers.HttpProvider(
          "https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"
        )
      );
    }
    const web3 = new Web3(provider);
    if (typeof provider !== "undefined") {
      web3.eth.getAccounts(async (err, accounts) => {
        if (err) {
          onError("Err getting accounts");
          return;
        }
        const provider_address = accounts[0];
        const Intel = new web3.eth.Contract(
          Intel_Contract_Schema.abi,
          Intel_Contract_Schema.networks["3"].address
        );

        const ParetoTokenInstance = new web3.eth.Contract(
          Pareto_Token_Schema.abi,
          Pareto_Token_Schema.networks["3"].address
        );

        const _ttl = Math.round(new Date().getTime() / 1000) + 1111174; // add five seconds to to allow the rewarder to reward pareto tokens
        const depositAmount = 2 * 10 ** 18;
        const desiredReward = "4";

        let gasApprove = await ParetoTokenInstance.methods
          .approve(Intel.options.address, depositAmount)
          .estimateGas({ from: provider_address });

        await ParetoTokenInstance.methods
          .approve(Intel.options.address, depositAmount)
          .send({ from: provider_address, gas: gasApprove })
          .on("error", err => {
            onError(err);
          });

        let gasCreateIntel = await Intel.methods
          .create(
            provider_address,
            depositAmount,
            web3.utils.toWei(desiredReward, "ether"),
            content.ID,
            _ttl
          )
          .estimateGas({ from: provider_address });

        await Intel.methods
          .create(
            provider_address,
            depositAmount,
            web3.utils.toWei(desiredReward, "ether"),
            content.ID,
            _ttl
          )
          .send({
            from: provider_address,
            gas: gasCreateIntel
          })
          .on("error", err => {
            onError(err);
          });

        onSuccess("successfull");
        
      });
    }
  }

  static rewardIntel(content, onSuccess, onError) {
      console.log(content,"content");
    let provider;
    if (typeof window.web3 !== "undefined") {
      // Use Mist/MetaMask's provider
      provider = new Web3(window.web3.currentProvider);
    } else {
      console.log("No web3? You should consider trying MetaMask!");
      onError(
        "Please install MetaMask (or other web3 browser) in order to access the Pareto Network"
      );

      // searchLookup();
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      provider = new Web3(
        new Web3.providers.HttpProvider(
          "https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq"
        )
      );
    }
    const web3 = new Web3(provider);
    if (typeof provider !== "undefined") {
      web3.eth.getAccounts(async (err, accounts) => {
        if (err) {
          onError("Err getting accounts");
          return;
        }
        const rewarder_address = accounts[0];
        const Intel = new web3.eth.Contract(
          Intel_Contract_Schema.abi,
          Intel_Contract_Schema.networks["3"].address
        );

        const ParetoTokenInstance = new web3.eth.Contract(
          Pareto_Token_Schema.abi,
          Pareto_Token_Schema.networks["3"].address
        );

        const depositAmount = 10 * 10 ** 18;

        let gasApprove = await ParetoTokenInstance.methods
          .approve(Intel.options.address, depositAmount)
          .estimateGas({ from: rewarder_address });

        await ParetoTokenInstance.methods
          .approve(Intel.options.address, depositAmount)
          .send({ from: rewarder_address, gas: gasApprove })
          .on("error", err => {
            onError(err);
          });

        const gasSendReward = await Intel.methods.sendReward(content.ID, depositAmount).estimateGas({ from: rewarder_address });
        await Intel.methods.sendReward(content.ID, depositAmount).send({ from: rewarder_address, gas: gasSendReward });
        onSuccess("success")
      });
    }
  }
}
