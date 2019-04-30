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
    let userController = {};

    userController.retrieveProfileWithAlias = function (alias) {
        return ParetoProfile.findOne({alias: alias}).exec();
    };

    userController.retrieveProfileWithAliasSlug = function (alias) {
        return ParetoProfile.findOne({aliasSlug: alias}).exec();
    };

    userController.retrieveAddress = function (address, callback) {

        var address = address;
        address = address.toLowerCase();

        if (web3.utils.isAddress(address) == false) {
            if (callback && typeof callback === "function") {
                const error = ErrorHandler.backendErrorList('b6');
                error.address = address;
                callback(error);
            }
        } else {
            controller.retrieveAddressRankWithRedis([address], true, function (error, results) {
                if (error) {
                    callback(error)
                } else {
                    callback(null, results[0])
                }
            });
        }

    };

    userController.retrieveAddresses = function (addresses, callback) {
        controller.retrieveAddressRankWithRedis(addresses, true, function (error, results) {
            if (error) {
                callback(error)
            } else {
                callback(null, results)
            }
        });
    };

    userController.updateUser = async function (address, userinfo, callback) {
        let fixaddress = address.toLowerCase();

        if (web3.utils.isAddress(fixaddress) == false) {
            callback(new Error('Invalid Address'));
        } else {
            const profile = {address: address};

            if (userinfo.alias) {
                profile.alias = userinfo.alias;
                profile.aliasSlug = userController.slugify(userinfo.alias);

                let existingAlias = await userController.retrieveProfileWithAlias(profile.alias);
                let existingAliasSlug = false;

                if (existingAlias && existingAlias.address !== address) {
                    callback(new Error("An user with that alias already exist"));
                    return;
                } else {
                    existingAliasSlug = await userController.retrieveProfileWithAliasSlug(profile.aliasSlug);

                    let counter = 0;
                    while (existingAliasSlug && counter < 10) {
                        if (existingAliasSlug.address !== address) {
                            let positionDash = profile.aliasSlug.indexOf('-');
                            if (positionDash >= 0 && profile.aliasSlug.substring(profile.aliasSlug.length - 1) !== '-') {
                                profile.aliasSlug = profile.aliasSlug.replace('-', '');
                            } else {
                                profile.aliasSlug = profile.aliasSlug + '-';
                            }
                            existingAliasSlug = await userController.retrieveProfileWithAliasSlug(profile.aliasSlug);
                        } else {
                            existingAliasSlug = null;
                        }
                        counter++;
                    }
                }
            }

            if (userinfo.biography) {
                profile.biography = userinfo.biography;
            }
            if (userinfo.profile_pic) {
                profile.profilePic = userinfo.profile_pic;
            }
            controller.insertProfile(profile, function (error, result) {
                if (error) {
                    callback(error)
                } else {
                    userController.getUserInfo(address, callback)
                }
            })
        }
    };

    userController.getUserInfo = async function (address, callback) {
        let fixaddress = address.toLowerCase();

        if (web3.utils.isAddress(fixaddress) == false) {
            let profile = await ParetoProfile.findOne({aliasSlug: address}).exec();
            if (!profile) profile = await ParetoProfile.findOne({alias: address}).exec();

            if (profile) {
                controller.retrieveAddressRankWithRedis([profile.address], true, function (error, rankings) {
                    if (error) {
                        callback(error)
                    } else {
                        let ranking = rankings[0];
                        callback(null, {
                            'address': profile.address,
                            'rank': ranking.rank,
                            'score': ranking.score,
                            'tokens': ranking.tokens,
                            'block': ranking.block,
                            'lastApprovedAddress': ranking.approved,
                            'maxRank': ranking.maxRank,
                            'minScore': ranking.minScore,
                            'alias': profile.alias,
                            'aliasSlug': profile.aliasSlug,
                            'biography': profile.biography,
                            "profile_pic": profile.profilePic
                        });
                    }
                });
            } else {
                callback(new Error('Invalid Address or alias'));
            }
        } else {

            controller.retrieveAddressRankWithRedis([address], true, function (error, rankings) {
                if (error) {
                    callback(error)
                } else {
                    controller.retrieveProfileWithRedis(address, function (error, profile) {
                        if (error) {
                            callback(error)
                        }
                        let ranking = rankings[0];
                        callback(null, {
                            'address': address,
                            'rank': ranking.rank,
                            'score': ranking.score,
                            'tokens': ranking.tokens,
                            'block': ranking.block,
                            'lastApprovedAddress': ranking.approved,
                            'maxRank': ranking.maxRank,
                            'minScore': ranking.minScore,
                            'alias': profile.alias,
                            'aliasSlug': profile.aliasSlug,
                            'biography': profile.biography,
                            "profile_pic": profile.profilePic
                        });
                    });
                }
            });
        }

    };

    userController.getAddressesWithSlug = async function (aliasArray) {
        let profiles = await ParetoProfile.find({aliasSlug: {$in: aliasArray}}).exec();
        if (profiles.length > 0) {
            return profiles.map(profile => profile.address);
        }
        return [];
    };

    userController.slugify = function (string) {
        const a = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;';
        const b = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------';
        const p = new RegExp(a.split('').join('|'), 'g');

        return string.toString().toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
            .replace(/&/g, '-and-') // Replace & with 'and'
            .replace(/[^\w\-]+/g, '') // Remove all non-word characters
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, '') // Trim - from end of text
    }
    return userController;
}