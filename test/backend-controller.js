const request = require('supertest');
const serverApp =  require('./../app.js');
const assert = require('chai').assert;

describe('backend-controller /', function() {

    it('check mongo connection',  function (done) {
        assert.isOk(serverApp.controller.mongoose.connection.readyState, 'Mongo is not ready');
        done()
    });


});
