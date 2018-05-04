const request = require('supertest');
const serverApp =  require('./../app.js');
const assert = require('chai').assert;

describe('backend-controller /', function() {

    const data = JSON.parse(process.env.SIGN);

    it('Check mongo connection',  function (done) {
        assert.isOk(serverApp.controller.mongoose.connection.readyState, 'Mongo is not ready');
        done();
    });

    it('No update wrong address',  function (done) {
        serverApp.controller.calculateScore("alsdkfjouasdf", 0, function(err, result){
            assert.exists(err, 'The controller should validate fake address');
            done();
        });
    });

    it('No get content with wrong address',  function (done) {
        serverApp.controller.getAllAvailableContent({user: "asdf"}, function(err, result){
            assert.exists(err, 'The controller should validate fake address');
            done();
        });
    });

    it('Current user get data Test',  function (done) {
        serverApp.controller.getAllAvailableContent({user: data.owner}, function(err, result){
            assert.notExists(err, 'The current data shouldnt get error');
            assert.exists(result, 'The content must be gotten');
            done();
        });
    });

    it('Sign up must fail whith no-allowed user',  function (done) {
        const fakeData = {};
        fakeData.data = data.data;
        fakeData.owner = "0x000123";
        fakeData.result = data.result.split("1").join("2");
        try{
            serverApp.controller.sign(fakeData, function(err, result){
                assert.exists(err, 'Invalid user cannot be allowed');
                done();
            });
        }catch (e) {
            done()
        }

    });

    it('Sign up test',  function (done) {
        serverApp.controller.sign(data, function(err, result){
            assert.notExists(err, 'sign up must be sucessfully');
            assert.exists(result, 'sign up must be sucessfully');
            done();
        });
    });


});
