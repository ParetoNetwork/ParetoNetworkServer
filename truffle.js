var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "avocado armed also position solution total token maze deny neutral bless share";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq",0,9)
      },
      network_id: 3,
      gas: 4712388

    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/QWMgExFuGzhpu2jUr6Pq",0 ,9)
      },
      network_id: 4,
      // gas: 6712388,
      gasPrice:8000000000
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/QWMgExFuGzhpu2jUr6Pq")
      },
      network_id: 1,
      gas: 4712388

    }   
    
  },
  // ,mocha: {
  //   reporter: 'eth-gas-reporter',
  //   reporterOptions : {
  //     currency: 'CHF',
  //     gasPrice: 21
  //   }
  // },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }};