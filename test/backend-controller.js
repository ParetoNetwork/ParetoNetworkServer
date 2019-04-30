const request = require('supertest');
const serverApp =  require('../backend/app.js');
const worker =  require('../backend/worker-controller.js');
const assert = require('chai').assert;

describe('backend-controller /', function() {

    const data = JSON.parse(process.env.SIGN);

    it('Check mongo connection',  function (done) {
        assert.isOk(serverApp.controller.mongoose.connection.readyState, 'Mongo is not ready');
        done();
    });

    it('calculate current score',  function (done) {
        worker.calculateScore("alsdkfjouasdf", 0, function(err, result){
            assert.exists(err, 'The controller should validate fake address');
            done();
        });
    });

    it('No get content with wrong address',  function (done) {
        setTimeout(function () {
            const req = {
                query: {
                    limit: 10,
                    page: 0
                },
                user: "asdf"
            };
            serverApp.controller.getAllAvailableContent(req, function(err, result){
                assert.exists(err, 'The controller should validate fake address');
                done();
            });

        }, 1000);
    });

    it('Current user get data Test',  function (done) {
        setTimeout(function () {
            const req = {
                query: {
                    limit: 10,
                    page: 0
                },
                user: data.owner
            };
            serverApp.controller.getAllAvailableContent(req, function(err, result){
                assert.notExists(err, 'The current data shouldnt get error');
                assert.exists(result, 'The content must be fetched');
                done();
            });
        }, 1000);
    });

    it('Sign up must fail whith no-allowed user',  function (done) {
        const fakeData = {};
        fakeData.data = data.data;
        fakeData.owner = "0x000123";
        fakeData.result = data.result.split("1").join("2");
        try{
            serverApp.controller.sign(fakeData, function(err, res){
                assert.exists(err, 'Invalid user cannot be allowed');
                done();
            });
        }catch (e) {
            done()
        }

    });

    it('Sign up test',  function (done) {
        serverApp.controller.sign(data, function(err, res){
            assert.notExists(err, 'sign up must be sucessfully');
            assert.exists(res, 'sign up must be sucessfully');
            done();
        });
    });

    it('Only valid address can get information',  function (done) {
        serverApp.controller.retrieveAddress("asdf", function(err, res){
            assert.exists(err, 'An error must be throwed');
            assert.notExists(res, 'The result must be empry');
            done();
        });
    });

    it('Get information about a specific address',  function (done) {
        serverApp.controller.retrieveAddress(data.owner, function(err, res){
            assert.notExists(err, 'no error should be throwed');
            assert.containsAllKeys(res,  [ 'address', 'block', 'rank', 'score', 'tokens' ]);
            done();
        });
    });

    // This test supposes the user doesn't change his Pareto through the time. Now the user can spend Pareto with rewards
    // it('Calculate score of specific address',  function (done) {
    //     serverApp.controller.calculateScore(data.owner, 0,function(err, res){
    //         if(!err){
    //             assert.containsAllKeys(res,  [ 'address', 'score', 'block', 'rank', 'tokens' ]);
    //             assert.isAtLeast(parseFloat(res.score),parseFloat(process.env.SPECTED_SCORE)-parseFloat(process.env.SPECTED_PRECISION), "The score is not equal to the spected");
    //             assert.isAtMost(res.score,parseFloat(process.env.SPECTED_SCORE)+parseFloat(process.env.SPECTED_PRECISION), "The score is not equal to the spected");
    //         }else{
    //             assert(err.message.indexOf('Invalid JSON RPC') > -1, 'Only Ethereum servers error are allowed')
    //         }
    //         done();
    //     });
    // });


});
