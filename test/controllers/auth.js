/**
 * Created by Alexey Karasev on 20/02/16.
 */


var app = require('../../app');
var request = require('supertest')(app);
var expect = require('chai').expect;
var mongoose = require('mongoose');
var User = mongoose.model('User');

describe('auth', function () {
    beforeEach(function (done) {
        User.remove({}, function (err, res) {
            done()
        });
    });

    describe('/register', function () {
        it('stores user credentials and password in db and issues a token back', function (done) {
            testCase = {
                email: 'nyasha@gmail.com',
                name: 'lampovaya nyasha',
                login: 'nyasha',
                phone: '+71',
                password: 'nya'
            };
            request
                .post('/register')
                .send(testCase)
                .end(function (err, res) {
                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(res.body.token).to.exist;
                    User.count({}, function (_, res) {
                        expect(res).to.equal(1);
                        User.findOne(function (_, user) {
                            Object.keys(testCase).forEach(function(key){
                                if (key=='password') return;
                                expect(user[key]).to.equal(testCase[key])
                            });
                            expect(user.hash).to.have.length.above(0);
                            expect(user.salt).to.have.length.above(0);
                            done();
                        });

                    });
                })
        })
    })

});

