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

    describe('/users/confirm', function(){

        beforeEach(function (done) {
            request
                .post('/users/register')
                .send(testCase)
                .end(function (err, res) {
                    done();
                });
        });

        it('confirms the user if the confirmation code is correct', function(done) {
            User.findOne({}, function(err, user) {
                expect(user.confirmed).to.be.false;
                request
                    .post('/users/confirm')
                    .send({
                        phone:testCase.phone,
                        confirm: user.confirm
                    })
                    .end(function(err, res){
                        User.findOne({}, function(err, user) {
                            expect(user.confirmed).to.be.true;
                            return done()
                        });

                    })
            });

        })
    });

    describe('/users/login', function () {
        beforeEach(function (done) {
            request
                .post('/users/register')
                .send(testCase)
                .end(function (err, res) {
                    User.findOne({}, function(err,user){
                        user.confirmed=true;
                        user.save(function(){
                            done();
                        });
                    });

                });
        });
        it('logins the user with correct email', function (done) {
            request
                .post('/users/login')
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
                .post('/users/login')
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
                .post('/users/login')
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
                .post('/users/login')
                .send({
                    username: testCase.login+'1',
                    password: testCase.password
                }).end(function (err, res) {
                expect(res.statusCode).to.equal(401);
                expect(res.body).to.be.have.length(0);
                done()
            })
        });

        it('does not login unconfirmed user', function (done) {
            User.findOne({},function(err, user){
                user.confirmed = false;
                user.save(function(){
                    request
                        .post('/users/login')
                        .send({
                            username: testCase.login,
                            password: testCase.password
                        }).end(function (err, res) {
                        expect(res.statusCode).to.equal(401);
                        expect(res.body).to.be.have.length(0);
                        done()
                    })
                })
            });

        });
    });

    describe('/users/register', function () {
        it('stores user credentials and password in db and issues a token back', function (done) {
            request
                .post('/users/register')
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
                            expect(user.confirm).to.have.length(4);
                            done();
                        });

                    });
                })
        })
    })

});

