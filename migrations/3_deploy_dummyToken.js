var DummyToken = artifacts.require("DummyToken");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(DummyToken);
}