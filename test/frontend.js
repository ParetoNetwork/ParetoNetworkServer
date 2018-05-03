const request = require('supertest');
const serverApp =  require('./../app.js');

describe('Pareto Network Page /', function() {
    it('Server connection', () => {
        request(serverApp.app).get("/")
            .expect(200)
            .expect(res => true)
    });

    it('leaderboard url test',  function (done) {
        request(serverApp.app).get("/rank")
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });


});