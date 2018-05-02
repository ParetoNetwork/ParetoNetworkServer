const request = require('supertest');
var serverApp =  require('./../backend.js');
var startServer =  request.agent(serverApp);
var server =  request.agent(process.env.TEST_URL);
var assert = require('chai').assert;


before(function(done) {
    setTimeout(function () {

        done()
    },1500)

});
describe('Server application /', function() {

    it('Server connection', () => {
        server.get("/")
            .expect(200)
            .expect(res => true)
    });

    it('Ranking url test',  function (done) {
        server.get("/v1/rank")
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });

    it('Ranking data test', function (done) {
        server.get("/v1/rank")
            .expect('Content-Type', /json/)
            .expect(200)
            .expect( function (res) {
                assert(res.body.length>0, "no data available");
                assert.hasAllKeys(res.body[0],  ['rank', 'address', 'score']);
                assert.sameOrderedMembers(res.body.map( it =>{return parseInt(it.rank)}),
                 Array(res.body.length -parseInt(res.body[0].rank)+1 ).fill().map((_, idx) => parseInt(res.body[0].rank) + idx),'Rank is not sorted');
            })
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    })

});