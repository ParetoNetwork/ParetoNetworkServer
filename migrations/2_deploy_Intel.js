var Intel = artifacts.require("Intel");
var ParetoNetworkToken = artifacts.require("ParetoNetworkToken");

module.exports = function (deployer, network, accounts) {
    const owner = accounts[0];
    deployer.deploy(ParetoNetworkToken).then((params) => {
        return deployer.deploy(Intel, owner);
    });
};