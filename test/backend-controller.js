const request = require('supertest');
const serverApp =  require('./../app.js');
const assert = require('chai').assert;

describe('backend-controller /', function() {

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
        serverApp.controller.getAllAvailableContent({user: process.env.TEST_ADDRESS}, function(err, result){
            assert.notExists(err, 'The current data shouldnt get error');
            assert.exists(result, 'The content must be gotten');
            done();
        });
    });


});
