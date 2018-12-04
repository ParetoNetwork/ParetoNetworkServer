export default {
    baseURL: document.domain === 'localhost' ? 'http://localhost:3000' : '',
    webSocketURL: location.origin.replace(/^http/, 'ws'),
    imageGenerator: {
        base: 'https://www.gravatar.com/avatar/',
        query: '?d=identicon&f=y'
    },
    coinMarket : {
        url : 'https://pro-api.coinmarketcap.com/v1/',
        apiKey : '7b92a2e9-4ed0-4c7e-8582-3aee03002a01',
        paretoID : '2495',
        symbol : 'PARETO'
    },
    etherscanDomain : document.domain === 'localhost' ? 'https://ropsten.etherscan.io/tx' : 'https://etherscan.io/tx'
}