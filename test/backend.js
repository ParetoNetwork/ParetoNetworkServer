const request = require('supertest');
const assert = require('chai').assert;
const serverApp =  require('./../app.js');

describe('Server application /', function() {

    const data = JSON.parse(process.env.SIGN);

    const getAuthenticatedCookie = function (data, done) {
        request(serverApp.app).post("/v1/sign")
            .send(data)
            .end(function (error, response) {
                if (error) {
                    throw error;
                }
                // const loginCookie = response.body.result.token;
                // done("authorization ="+ loginCookie);
                done(response.headers['set-cookie'])
            });
    };

    it('Server connection', () => {
        request(serverApp.app).get("/")
            .expect(200)
            .expect(res => true)
    });

    it('Ranking url test',  function (done) {
        request(serverApp.app).get("/v1/rank")
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });

    it('Ranking data test', function (done) {
        request(serverApp.app).get("/v1/rank")
            .expect('Content-Type', /json/)
            .expect(200)
            .expect( function (res) {
                assert(res.body.length>0, "no data available");
                assert.containsAllKeys(res.body[0],  ['rank', 'address', 'score']);
                assert.sameOrderedMembers(res.body.map( it =>{return parseInt(it.rank)}),
                 Array(res.body.length -parseInt(res.body[0].rank)+1 ).fill().map((_, idx) => parseInt(res.body[0].rank) + idx),'Rank is not sorted');
            })
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });

    it('User address is needed to get content', function (done) {
        request(serverApp.app).get("/v1/content/")
            .expect(401)
            .end(function(err, res) {
                if (err) { return done(err); }
                done();
            })
    });

    it('Sign up test', function (done) {
        getAuthenticatedCookie(data,  function(cookie) {
            request(serverApp.app).get("/v1/auth")
                .set('cookie', cookie)
                .expect(200, done);
        });
    });

    it('Get information about current user', function (done) {
        getAuthenticatedCookie(data,  function(cookie) {
            request(serverApp.app).get("/v1/address")
                .set('cookie', cookie)
                .expect(200)
                .expect( function (res) {
                    assert.containsAllKeys(res.body,  [ 'address', 'block', 'rank', 'score', 'tokens' ]);
                })
                .end(function(err, res) {
                    if (err) { return done(err); }
                    done();
                })
        });
    });

    it('Get profile about current user', function (done) {
        getAuthenticatedCookie(data,  function(cookie) {
            request(serverApp.app).get("/v1/userinfo")
                .set('cookie', cookie)
                .expect(200)
                .expect( function (res) {
                    assert.containsAllKeys(res.body,  [  'address',  'rank' , 'score' , 'tokens','first_name' , "last_name", 'biography' , "profile_pic" ]);
                })
                .end(function(err, res) {
                    if (err) { return done(err); }
                    done();
                })
        });
    });

    it('Get the latest profile about current user ', function (done) {
        getAuthenticatedCookie(data,  function(cookie) {
            request(serverApp.app).get("/v1/userinfo")
                .set('cookie', cookie)
                .query({ latest: true})
                .expect(200)
                .expect( function (res) {
                    assert.containsAllKeys(res.body,  [  'address',  'rank' , 'score' , 'tokens','first_name' , "last_name", 'biography' , "profile_pic" ]);
                })
                .end(function(err, res) {
                    if (err) { return done(err); }
                    done();
                })
        });
    });

    it('Update Information about User', function (done) {
        getAuthenticatedCookie(data,  function(cookie) {
            request(serverApp.app).post("/v1/updateuser")
                .send({ 'first_name': "Carlos", "last_name": "De los Reyes",
                        'biography': "Lorem ipsum ...", "profile_pic" : "https://www.ienglishstatus.com/wp-content/uploads/2018/04/Anonymous-Whatsapp-profile-picture.jpg"
                })
                .set('cookie', cookie)
                .expect(200)
                .expect( function (res) {
                    assert.containsAllKeys(res.body,  [  'first_name' , "last_name", 'biography' , "profile_pic" ]);
                })
                .end(function(err, res) {
                    if (err) { return done(err); }
                    done();
                })
        });
    });




});

