module.exports = function (
    mongoose,
    controller,
    web3,
    web3_events_provider,
    web3_events,
    Intel_Contract_Schema,
    ParetoAddress,
    ParetoContent,
    ParetoProfile,
    ParetoPayment,
    ParetoReward,
    ParetoAsset,
    ParetoTransaction,
    ErrorHandler,
    ETH_NETWORK,
    PARETO_CONTRACT_ADDRESS

) {
    let intelController = {};
    let blockHeight = 0;
    const PARETO_RANK_GRANULARIZED_LIMIT = 10;
    /**
     * Intel Services
     */

    intelController.getQueryContentByUser = function (address, intel, callback) {

        if (web3.utils.isAddress(address) == false) {
            if (callback && typeof callback === "function") {
                const error = ErrorHandler.backendErrorList('b6');
                error.address = address;
                callback(error);
            }
        } else {


            //address exclude created title
            //1. get score from address, then get standard deviation of score
            controller.retrieveAddress(address, function (err, result) {

                if (err) {
                    if (callback && typeof callback === "function") {
                        callback(err);
                    }
                } else {

                    if (result == null) {

                        //this can happen if a new address is found which is not in the system yet. in reality it should be calculated beforehand, or upon initial auth

                        if (callback && typeof callback === "function") {
                            callback(null, []);
                        }
                    } else {
                        //1b. get block height
                        web3.eth.getBlock('latest')
                            .then(function (res) {
                                blockHeight = res.number;

                                //2. get percentile

                                //2a. get total rank where score > 0
                                ParetoAddress.countDocuments({score: {$gt: 0}}, async (err, count) => {

                                    //and this is because we are using hardcoded ranks to begin with. fix by having proprietary high performance web3 server (parity in docker?), or by doing more efficient query which creates rank on the fly from group
                                    if (result.rank == null) {
                                        result.rank = count - 1;
                                    }

                                    var percentile = 1 - (result.rank / count); //this should be a decimal number

                                    var blockDelay = 0;

                                    if (percentile > .99) {

                                        //then do multiplication times the rank to determine the block height delta.
                                        if (result.rank < PARETO_RANK_GRANULARIZED_LIMIT) {
                                            blockDelay = result.rank * 10;
                                        } else {
                                            blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 10;
                                        }
                                        /*} else { //this would be a dynamic method where var factor = Math.pow(10, -1);
                                               //would be used with var wholePercentile = percentile * 100;
                                               //Math.round(wholePercentile * factor) / factor in order to get the percentile

                                        var factor = Math.pow(10, -1);
                                        var wholePercentile = percentile * 100;
                                        var roundedToNearestPercentile = Math.round(wholePercentile * factor) / factor;
                                        //var multiplier = 100 * Math.floor(percentile);
                                        blockDelay = (100 - roundedToNearestPercentile)) * PARETO_RANK_GRANULARIZED_LIMIT;

                                      }*/

                                    } else if (percentile > .90) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 20;

                                    } else if (percentile > .80) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 30;

                                    } else if (percentile > .70) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 40;

                                    } else if (percentile > .60) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 50;

                                    } else if (percentile > .50) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 60;

                                    } else if (percentile > .40) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 70;

                                    } else if (percentile > .30) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 80;

                                    } else if (percentile > .20) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 90;

                                    } else if (percentile > .10) {

                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 100;

                                    } else {
                                        blockDelay = PARETO_RANK_GRANULARIZED_LIMIT * 110;
                                    }
                                    const CONTENT_DELAY = {
                                        blockDelay: [1, blockDelay, blockDelay * 50, blockDelay * 100, blockDelay * 150],
                                        blockHeight: blockHeight
                                    };
                                    let returnQuery = {
                                        $and: [
                                            {
                                                $or: [
                                                    {
                                                        block: {$lte: (blockHeight - blockDelay * 1)},
                                                        speed: 1,
                                                        $or: [{validated: true}, {block: {$gt: 0}}]
                                                    },
                                                    {
                                                        block: {$lte: (blockHeight - blockDelay * 50)},
                                                        speed: 2,
                                                        $or: [{validated: true}, {block: {$gt: 0}}]
                                                    },
                                                    {
                                                        block: {$lte: (blockHeight - blockDelay * 100)},
                                                        speed: 3,
                                                        $or: [{validated: true}, {block: {$gt: 0}}]
                                                    },
                                                    {
                                                        block: {$lte: (blockHeight - blockDelay * 150)},
                                                        speed: 4,
                                                        $or: [{validated: true}, {block: {$gt: 0}}]
                                                    },
                                                    {address: address, $or: [{validated: true}, {block: {$gt: 0}}]}
                                                ]
                                            }]
                                    };

                                    // if(percentile<0.85){
                                    //     returnQuery.$and.push({expires: {$lte : ((new Date()).getTime()/1000)+86400}, validated: true});
                                    // }

                                    return callback(null, CONTENT_DELAY, returnQuery, percentile);
                                });
                            }, function (error) {
                                callback(error);
                            }).catch(function (err) {
                            callback(err);
                        });//end web3

                    }//end else

                }
            });
        } // end else for address validation
    };

    intelController.getAssets = async function (callback) {
        try {
            callback(null, await ParetoAsset.find({}).exec())
        } catch (e) {
            callback(e);
        }
    };

    intelController.getAllAvailableContent = async function (req, callback) {
        var limit = parseInt(req.query.limit || 100);
        var page = parseInt(req.query.page || 0);
        await  intelController.getQueryContentByUser(req.user, null, async function (error, contentDelay, queryFind, percentile) {
            if (error) return callback(error);
            try {
                let newQuery = await intelController.validateQuery(req.query);
                queryFind.$and = queryFind.$and.concat(newQuery);
                const allResults = await ParetoContent.find(queryFind).sort({dateCreated: -1}).skip(page * limit).limit(limit).populate([{path: 'assets.asset'}, {path: 'createdBy'}]).exec();
                let newResults = [];
                allResults.forEach(function (entry) {
                    /*

                     currently: force use of limit to keep json response smaller.
                     limit isn't used earlier so that redis knows the full result,
                     and because the queries for each speed of content are separate

                     future: server should already have an idea of what content any user can see,
                     since it knows their latest scores and the current block height. therefore the full content response can be queried at once, perhaps, and pages can be done fictionally

                     */
                    try {
                        let delayAgo = contentDelay.blockHeight - (contentDelay.blockDelay[entry.speed] + entry.block);
                        let data = {
                            _id: entry._id,
                            blockAgo: Math.max(blockHeight - entry.block, 0),
                            block: entry.block,
                            title: entry.title,
                            address: entry.address,
                            body: entry.body,
                            expires: entry.expires,
                            dateCreated: entry.dateCreated,
                            txHash: entry.txHash,
                            totalReward: entry.totalReward || 0,
                            reward: entry.reward,
                            speed: entry.speed,
                            id: entry.id,
                            txHashDistribute: entry.txHashDistribute,
                            intelAddress: entry.intelAddress,
                            _v: entry._v,
                            distributed: entry.distributed,
                            assets: entry.assets,
                            createdBy: {
                                address: entry.createdBy.address,
                                alias: entry.createdBy.alias,
                                aliasSlug: entry.createdBy.aliasSlug,
                                biography: entry.createdBy.biography,
                                profilePic: entry.createdBy.profilePic
                            },
                            contentDelay: contentDelay
                        };

                        if (percentile < 0) { //eventually it may be < 0.85
                            if (data.expires > ((new Date()).getTime() / 1000) + 86400) {
                                data.title = "Classified" + intelController.decodeData(data.title);
                                data.body = intelController.decodeData(data.body);
                            }
                        }

                        newResults.push(data);

                    } catch (e) {
                    }
                });
                //console.log(allResults);

                if (callback && typeof callback === "function") {
                    callback(null, newResults);
                }

            } catch (err) {
                if (callback && typeof callback === "function") {
                    callback(err);
                }
            }
        });
    };

    intelController.decodeData = function (data) {
        const TOKEN = "@7a8b9c";
        const words = data.split(" ");
        const shuffle = function (array) {

            var currentIndex = array.length;
            var temporaryValue, randomIndex;
            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;

        };
        const randomWord = function (length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        };
        const permutations = shuffle(Array.from(Array(words.length), (x, index) => index + 1)).slice(0, (words.length * 0.5).toFixed());
        return words.map((it, index) => {
            if (permutations.includes(index)) {
                return TOKEN + randomWord(it.length) + TOKEN
            } else {
                return it;
            }

        }).join(' ');
    }

    intelController.getContentByIntel = function (req, intel, callback) {
        intelController.getQueryContentByUser(req.user, intel, async function (error, contentDelay, queryFind, percentile) {
            if (error) return callback(error);
            try {
                if (mongoose.Types.ObjectId.isValid(intel)) {
                    queryFind.$and = queryFind.$and.concat({_id: mongoose.Types.ObjectId(intel)})
                } else {
                    queryFind.$and = queryFind.$and.concat({txHash: intel})
                }
                const allResults = await ParetoContent.find(queryFind).sort({dateCreated: -1}).populate([{path: 'assets.asset'}, {path: 'createdBy'}]).exec();
                if (allResults && allResults.length > 0) {
                    const entry = allResults[0];
                    let delayAgo = contentDelay.blockHeight - (contentDelay.blockDelay[entry.speed] + entry.block);
                    const data = {
                        _id: entry._id,
                        blockAgo: Math.max(blockHeight - entry.block, 0),
                        block: entry.block,
                        title: entry.title,
                        address: entry.address,
                        body: entry.body,
                        expires: entry.expires,
                        dateCreated: entry.dateCreated,
                        txHash: entry.txHash,
                        totalReward: entry.totalReward || 0,
                        reward: entry.reward,
                        speed: entry.speed,
                        id: entry.id,
                        txHashDistribute: entry.txHashDistribute,
                        intelAddress: entry.intelAddress,
                        _v: entry._v,
                        distributed: entry.distributed,
                        assets: entry.assets,
                        createdBy: {
                            address: entry.createdBy.address,
                            alias: entry.createdBy.alias,
                            aliasSlug: entry.createdBy.aliasSlug,
                            biography: entry.createdBy.biography,
                            profilePic: entry.createdBy.profilePic
                        },
                        contentDelay: contentDelay
                    };


                    if (percentile < 0) {
                        if (data.expires > ((new Date()).getTime() / 1000) + 86400) {
                            data.title = "Classified" + intelController.decodeData(data.title);
                            data.body = intelController.decodeData(data.body);
                        }
                    }

                    return callback(null, data)
                } else {
                    callback(null, {})
                }

            } catch (err) {
                if (callback && typeof callback === "function") {
                    callback(err);
                }
            }
        });
    };

    intelController.getContentByCurrentUser = async function (req, callback) {
        let address = req.query.user || req.user;
        let isAddress = web3.utils.isAddress(address) === true;

        var limit = parseInt(req.query.limit || 100);
        var page = parseInt(req.query.page || 0);

        if (!isAddress) {
            let profileFound = await ParetoProfile.findOne({aliasSlug: address}).exec();
            if (!profileFound) profileFound = await ParetoProfile.findOne({alias: address}).exec();
            if (profileFound) address = profileFound.address;
            isAddress = web3.utils.isAddress(address) === true;
        }

        if (!isAddress) {
            if (callback && typeof callback === "function") {
                callback(new Error('Invalid Address'));
            }
        } else {
            var query = ParetoContent.find({
                address: address,
                validated: true
            }).sort({dateCreated: -1}).skip(limit * page).limit(limit).populate([{path: 'assets.asset'}, {path: 'createdBy'}]);

            query.exec(function (err, results) {
                if (err) {
                    if (callback && typeof callback === "function") {
                        callback(err);
                    }
                } else {
                    web3.eth.getBlock('latest')
                        .then(function (res) {
                            blockHeight = res.number;
                            let newResults = [];
                            results.forEach(function (entry) {
                                let data = {
                                    _id: entry._id,
                                    id: entry.id,
                                    blockAgo: Math.max(blockHeight - entry.block),
                                    block: entry.block,
                                    address: entry.address,
                                    title: entry.title,
                                    body: entry.body,
                                    dateCreated: entry.dateCreated,
                                    txHash: entry.txHash,
                                    totalReward: entry.totalReward || 0,
                                    reward: entry.reward,
                                    speed: entry.speed,
                                    txHashDistribute: entry.txHashDistribute,
                                    expires: entry.expires,
                                    validated: entry.validated,
                                    intelAddress: entry.intelAddress,
                                    distributed: entry.distributed,
                                    assets: entry.assets,
                                    _v: entry._v,
                                    createdBy: {
                                        address: entry.createdBy.address,
                                        alias: entry.createdBy.alias,
                                        aliasSlug: entry.createdBy.aliasSlug,
                                        biography: entry.createdBy.biography,
                                        profilePic: entry.createdBy.profilePic
                                    }
                                };
                                newResults.push(data);
                            });
                            callback(null, newResults);
                        }, function (error) {
                            callback(error);
                        }).catch(function (err) {
                        callback(err);
                    });

                }
            });
        }

    };

    intelController.postContent = function (req, callback) {

        var body = req.body;

        //exposed endpoint to write content to database
        if (web3.utils.isAddress(req.user) == false) {
            if (callback && typeof callback === "function") {
                const error = ErrorHandler.backendErrorList('b6');
                error.address = address;
                callback(error);
            }
        } else {

            let Intel = new ParetoContent({
                address: req.body.address || req.user,
                title: req.body.title,
                body: req.body.body,
                text: req.bodytext,
                dateCreated: Date.now(),
                block: req.body.number || 0,
                txHash: req.body.txHash || '0x0', //this is done client side to cause an internal invocation
                speed: process.env.DEFAULT_SPEED || 1 ,//1 is very fast speed, 2 is fast, 3 is normal, medium speed, 4 is very slow speed for long applicable swing trades
                reward: req.body.reward || 1

            });
            if (req.body.assets && req.body.assets.length) {
                Intel.assets = req.body.assets.map(it => {
                    return {asset: mongoose.Types.ObjectId(it)}
                });
            }
            Intel.save((err, savedIntel) => {

                if (err) {
                    if (callback && typeof callback === "function") {
                        callback(err);
                    }
                } else {

                    if (callback && typeof callback === "function") {
                        callback(null, {Intel_ID: savedIntel.id});
                    }

                }
            })

        } // end else

    };


    intelController.getTransaction = function (data, callback) {
        const query = {address: data.user};

        if (data.query.q) {
            switch (data.query.q) {
                case 'complete': {
                    query.status = {$gte: 3};
                    break;
                }
                case 'pending': {
                    query.status = {$lt: 3};
                    break;
                }
                case 'nd' : {
                    query.event = {$nin: ['distribute']};
                    break;
                }
                case 'all': {
                    break;
                }
                default:
                    data.status = {$lt: 3}
            }
        }

        const limit = parseInt(data.query.limit) || 100;
        const skip = limit * (data.query.page || 0);

        ParetoTransaction.find(query).sort({dateCreated: -1}).skip(skip).limit(limit).populate({
            path: 'intelData',
            populate: {
                path: 'createdBy'
                , select: 'address alias aliasSlug profilePic'
            }
            , select: 'id block address title reward'
        }).exec(callback);
    };

    intelController.watchTransaction = function (data, callback) {
        if (data.address) {
            data.address = data.address.toLowerCase();
        }

        var dbQuery = {
            txHash: data.txHash
        };

        if (data.txRewardHash) {
            data.status = 2;
        }
        var dbValues = {
            $set: data
        };
        var dbOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        };

        var updateQuery = ParetoTransaction.findOneAndUpdate(dbQuery, dbValues, dbOptions);
        updateQuery.exec().then(function (r) {
            callback(null, r);
        }).catch(function (e) {
            callback(e)
        });
    };

    intelController.validateQuery = async function (query) {
        const array = [];
        if (query.created && !isNaN(Date.parse(query.created))) {
            try {
                const date = new Date(query.created);
                const date2 = new Date(date.getTime() + 86400000);
                array.push({
                    $and: [
                        {dateCreated: {$gte: date}},
                        {dateCreated: {$lte: date2}}
                    ]

                })
            } catch (e) {
                console.log(e)
            }
        }
        if (query.title) {
            try {
                array.push({
                    title: {$regex: ".*" + query.title + ".*"}
                })
            } catch (e) {
                console.log(e)
            }
        }

        if (query.address) {
            try {
                data = query.address.split(',')
                    .filter(address => {
                        return web3.utils.isAddress(address)
                    }).map(address => {
                        return address.toLowerCase()
                    });

                let data2 = query.address.split(',')
                    .filter(address => {
                        return !web3.utils.isAddress(address);
                    });

                let addresses = await controller.getAddressesWithSlug(data2);

                let allAddresses = [...data, ...addresses];
                if (allAddresses.length > 0) {
                    array.push({address: {$in: allAddresses}});
                }

            } catch (e) {
                console.log(e)
            }
        } else if (query.alias) {
            try {
                data = query.alias.split(',');

                let addresses = await controller.getAddressesWithSlug(data);
                if (addresses.length > 0) {
                    array.push({address: {$in: addresses}});
                }
            } catch (e) {
                console.log(e);
            }

        } else if (query.exclude) {
            try {
                data = query.exclude.split(',')
                    .filter(address => {
                        return web3.utils.isAddress(address)
                    }).map(address => {
                        return address.toLowerCase()
                    });

                let data2 = query.exclude.split(',')
                    .filter(address => {
                        return !web3.utils.isAddress(address);
                    });

                let addresses = await controller.getAddressesWithSlug(data2);

                let allAddresses = [...data, ...addresses];
                if (allAddresses.length > 0) {
                    array.push({address: {$nin: allAddresses}});
                }

            } catch (e) {
                console.log(e)
            }

        }
        return array;
    };

    return intelController;
}