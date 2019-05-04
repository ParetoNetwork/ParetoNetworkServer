
const information = (function () {
  const user = {
    address: '0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
    alias: 'Sign in ',
    biography: 'Become a member to access Market-Proven trading intel. Post, trade, earn.',
    rank: 107,
    score: 881345,
    tokens: 50000,
    profilePic: 'random_person'
  };

  const demoIntelProviderA = {
    address: '0xA355b24AF8a14Af03AbC3AF0441e7773E7a7224d',
    alias: 'PARETO Community',
    aliasSlug: 'pareto-comm',
    biography: 'Become a member to access Market-Proven trading intel. Post, trade, earn.',
    rank: 107,
    score: 881345,
    tokens: 50000
  };

  const demoIntelProviderB = {
    address: '0xf70D7AC257e9e1E7340dCD74b22D321b301Ce7F3',
    alias: '80/20 Capital Research',
    aliasSlug: '',
    biography: 'Become a member to access Market-Proven trading intel. Post, trade, earn.',
    rank: 107,
    score: 881345,
    tokens: 50000
  };

  return {
    content: [
      {
        title: '🏅 What is the Pareto Network? Intro to Alpha Capture',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 10000,
        totalReward: 0,
        blockAgo: '5769',
        createdBy: demoIntelProviderA,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderA.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 100000
      },
      {
        title: 'Equifax ($EFX) Insider sales reported on Form 4, days before breach',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 11403,
        totalReward: 28402.493,
        blockAgo: '6801',
        createdBy: demoIntelProviderB,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderB.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 100000
      },
      {
        title: '🌟 🌟 How to use the Pareto Network for profit',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 11844,
        totalReward: 857332,
        blockAgo: '7223',
        createdBy: demoIntelProviderA,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderA.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 90000
      },
      {
        title: '🎖 🎖 How does the network prevent bad information?',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 12432,
        totalReward: 59021,
        blockAgo: '7839',
        createdBy: demoIntelProviderA,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderA.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 40000
      },
      {
        title: '$BAC dividend capture opportunity in mispriced option',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 12682,
        totalReward: 803922,
        blockAgo: '8362',
        createdBy: demoIntelProviderB,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderB.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 70000
      },
      {
        title: '🤫 How regulators use the Pareto Network to ensure fair markets',
        dateCreated: new Date(),
        txHash: '0xFETYIGUJS',
        block: 13042,
        totalReward: 768472,
        blockAgo: '8406',
        createdBy: demoIntelProviderA,
        intelAddress: '0xFETYIGUJS',
        address: demoIntelProviderA.address,
        expires: new Date(),
        rewardsTransactions: [{
          "amount": 12
        }, {
          "amount": 12
        }],
        contentDelay: {blockDelay: [1, 400, 20000, 40000, 60000], blockHeight: 5478152},
        reward: 100000
      }
    ],
    transactions: [
      {status: 2, event: 'reward', amount: '60000', txHash: '0x5f36541dcb6d590fe0475b23c9fc2e34d0cfd08553f499f72537679f8ddd002f', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}, clicked: true},
      {status: 3, event: 'reward', amount: '32050', txHash: '0xa46239de423f444a7968bcc1227482f1cf0e018827109c60e302115973189356', intelData: { title : "🤫 How regulators use the Pareto Network to ensure fair markets"}},
      {status: 3, event: 'create', amount: '150000', txHash: '0x4beab527bf037dcf39373f6c93164829ed625a77b6b512522a5f921ca251265e', intelData: { title : "🏅 What is the Pareto Network? Intro to Alpha Capture"}},
      {status: 3, event: 'reward', amount: '12922.92', txHash: '0x1308d6c2707263a1fae4201c420b31b4d975af37a16084ba5ec027125f199a02', intelData: { title : "Equifax ($EFX) Insider sales reported on Form 4, days before breach"}},
      {status: 3, event: 'create', amount: '200000', txHash: '0x0bb6034aff4f773b21592dc1fa9ff2c3915281b308c8c9928b547bd9eb7ab56e', intelData: { title : "🎖 🎖 How does the network prevent bad information?"}},
      {status: 3, event: 'reward', amount: '80000', txHash: '0xbcbbf73001683f3e2df3014c0f166742f5b3aeb160606a0c6cd5ecfde3d71256', intelData: { title : "🌟 🌟 How to use the Pareto Network for profit"}}/*,
      {status: 3, event: 'reward', amount: '150000', txHash: '0xa5f2c2bce8aafebe87441d15bdac9ad8193f563f11439f2c7a9d352dc1f19f05', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '32000', txHash: '0x24f9b66abdbbd782470019030f78de514e0b8e199a9ebc8660823ed3ed4453ce', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '86400', txHash: '0xa46239de423f444a7968bcc1227482f1cf0e018827109c60e302115973189356', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '79294', txHash: '0x1308d6c2707263a1fae4201c420b31b4d975af37a16084ba5ec027125f199a02', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '169000', txHash: '0xbcbbf73001683f3e2df3014c0f166742f5b3aeb160606a0c6cd5ecfde3d71256', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '45000', txHash: '0xa5f2c2bce8aafebe87441d15bdac9ad8193f563f11439f2c7a9d352dc1f19f05', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}},
      {status: 3, event: 'reward', amount: '39000', txHash: '0x23ad98e507a4370d83d2906a31cc59269ce535ef365ca25b210ad2972d49132a', intelData: { title : "$BAC dividend capture opportunity in mispriced option"}}*/
    ],
    user: user
  }
})();

export {information};

var sunburstData = {
  "name": "TOPICS", "children": [{
    "name": "Topic A",
    "children": [{"name": "Sub A1", "size": 4}, {"name": "Sub A2", "size": 4}]
  }, {
    "name": "Topic B",
    "children": [{"name": "Sub B1", "size": 3}, {"name": "Sub B2", "size": 3}, {
      "name": "Sub B3", "size": 3}]
  }, {
    "name": "Topic C",
    "children": [{"name": "Sub A1", "size": 4}, {"name": "Sub A2", "size": 4}]
  }]
};

export {sunburstData};

var stackedBarData =  {"userInformation":[{"status":3,  "amount":2,"dateCreated":"2019-04-26T22:24:37.628Z","event":"reward","intel":515, "nonce":231,"block":5485158},{"status":3, "amount":1,"dateCreated":"2019-04-29T14:06:31.567Z","event":"reward","intel":518, "nonce":233,"block":5502137, },{"status":3, "amount":2,"dateCreated":"2019-04-29T22:29:00.956Z","event":"reward","intel":520, "nonce":235,"block":5504394, },{"status":3, "amount":1,"dateCreated":"2019-04-26T22:26:57.793Z","event":"create", "nonce":232,"block":5485165, },{"status":3,"amount":1,"dateCreated":"2019-04-29T22:27:44.162Z","event":"create","intel":521,"nonce":234,"block":5504388}]};

export {stackedBarData};