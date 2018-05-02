const request = require('supertest');
var server =  request.agent(process.env.TEST_URL);

describe('Pareto Network Page /', function() {

    it('Server connection', () => {
        server.get("/")
            .expect(200)
            .expect(res => true)
    });

    it('leaderboard url test',  function (done) {
        server.get("/rank")
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });

});