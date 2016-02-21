/**
 * Created by Alexey Karasev on 20/02/16.
 */


var app = require('../../app');
var request = require('supertest')(app);
var expect = require('chai').expect;
var mongoose = require('mongoose');
var User = mongoose.model('User');

describe('auth', function () {
    testCase = {
        email: 'nyasha@gmail.com',
        name: 'lampovaya nyasha',
        login: 'nyasha',
        phone: '+71',
        password: 'nya'
    };
    beforeEach(function (done) {
        User.remove({}, function (err, res) {
            done()
        });
    });

    describe('/login', function () {
        beforeEach(function (done) {
            request
                .post('/register')
                .send(testCase)
                .end(function (err, res) {
                    done();
                });
        });
        it('logins the user with correct email', function (done) {
            request
                .post('/login')
                .send({
                    username: testCase.email,
                    password: testCase.password
                }).end(function (err, res) {
                expect(err).to.not.exist;
                expect(res.body.token).to.exist;
                done()
            })
        });

        it('logins the user with correct phone', function (done) {
            request
                .post('/login')
                .send({
                    username: testCase.phone,
                    password: testCase.password
                }).end(function (err, res) {
                expect(err).to.not.exist;
                expect(res.body.token).to.exist;
                done()
            })
        });

        it('logins the user with correct login', function (done) {
            request
                .post('/login')
                .send({
                    username: testCase.login,
                    password: testCase.password
                }).end(function (err, res) {
                expect(err).to.not.exist;
                expect(res.body.token).to.exist;
                done()
            })
        });

        it('does not login with invalid credentials', function (done) {
            request
                .post('/login')
                .send({
                    username: testCase.login+'1',
                    password: testCase.password
                }).end(function (err, res) {
                expect(res.statusCode).to.equal(401);
                expect(res.body).to.be.have.length(0);
                done()
            })
        });
    });

    describe('/register', function () {
        it('stores user credentials and password in db and issues a token back', function (done) {
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
                            Object.keys(testCase).forEach(function (key) {
                                if (key == 'password') return;
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

