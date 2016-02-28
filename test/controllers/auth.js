/**
 * Created by Alexey Karasev on 20/02/16.
 */


var app = require('../../app');
var request = require('supertest')(app);
var expect = require('chai').expect;
var mongoose = require('mongoose');
var assign = require('object-assign');
var User = mongoose.model('User');
var utils = require('../../api/utils');


describe('auth', function () {
    registerCase = {
        email: 'nyasha@gmail.com',
        name: 'lampovaya nyasha',
        login: 'nyasha',
        password: 'nya'
    };
    addPhoneCase = {
        login: 'nyasha',
        phone: '+712345567'
    };

    beforeEach(function (done) {
        User.remove({}, function (err, res) {
            done()
        });
    });

    describe('/users/reset', function () {

        beforeEach(function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    done();
                });
        });

        it('resets the password if the user with the phone number exists', function (done) {
            User.findOne({}, function (err, user) {
                hash = user.hash;
                request
                    .post('/users/reset')
                    .send({
                        phone: registerCase.phone
                    })
                    .end(function (err, res) {
                        expect(res.statusCode).to.equal(200);
                        User.findOne({}, function (err, user1) {
                            expect(user1.hash).to.not.equal(hash);
                            done()
                        })
                    })
            });
        });

        it('does nothing if the user does not not exist', function (done) {
            User.findOne({}, function (err, user) {
                hash = user.hash;
                request
                    .post('/users/reset')
                    .send({
                        phone: registerCase.phone + '1'
                    })
                    .end(function (err, res) {
                        expect(res.statusCode).to.equal(404);
                        User.findOne({}, function (err, user1) {
                            expect(user1.hash).to.equal(hash);
                            done()
                        })
                    })
            });
        })
    });

    describe('/users/confirm', function () {

        beforeEach(function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    done();
                });
        });

        it('confirms the user if the confirmation code is correct', function (done) {
            User.findOne({}, function (err, user) {
                expect(user.confirmed).to.be.false;
                request
                    .post('/users/confirm')
                    .send({
                        phone: registerCase.phone,
                        confirm: user.confirm
                    })
                    .end(function (err, res) {
                        User.findOne({}, function (err, user) {
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
                .send(registerCase)
                .end(function (err, res) {
                    User.findOne({}, function (err, user) {
                        user.confirmed = true;
                        user.save(function () {
                            done();
                        });
                    });

                });
        });
        it('logins the user with correct email', function (done) {
            request
                .post('/users/login')
                .send({
                    username: registerCase.email,
                    password: registerCase.password
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
                    username: registerCase.phone,
                    password: registerCase.password
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
                    username: registerCase.login,
                    password: registerCase.password
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
                    username: registerCase.login + '1',
                    password: registerCase.password
                }).end(function (err, res) {
                expect(res.statusCode).to.equal(401);
                expect(res.body).to.be.have.length(0);
                done()
            })
        });

        it('does not login unconfirmed user', function (done) {
            User.findOne({}, function (err, user) {
                user.confirmed = false;
                user.save(function () {
                    request
                        .post('/users/login')
                        .send({
                            username: registerCase.login,
                            password: registerCase.password
                        }).end(function (err, res) {
                        expect(res.statusCode).to.equal(401);
                        expect(res.body).to.be.have.length(0);
                        done()
                    })
                })
            });

        });
    });


    describe('/users/add_phone', function () {

        var token;

        beforeEach(function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    token = res.body.token;
                    done();
                });
        });

        it('adds the phone and reissues new token', function (done) {
            testCase = {
                phone: '12334',
                token: token
            };
            request
                .post('/users/add_phone')
                .send(testCase)
                .end(function (err, res) {
                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(res.body.token).to.exist;
                    expect(res.body.token).to.not.equal(token);
                    User.count({}, function (_, res) {
                        expect(res).to.equal(1);
                        User.findOne(function (_, user) {
                            expect(user.phone).to.equal(testCase.phone);
                            expect(user.login).to.equal(registerCase.login);
                            done()
                        });
                    });
                });
        });

        it('sends duplicate phone error if the phone is already in use', function (done) {
            testCase = {
                phone: "7",
                token: token
            };
            request
                .post('/users/add_phone')
                .send(testCase)
                .end(function (err, res) {
                    regCase2 = {
                        email: 'nyasha1@gmail.com',
                        name: 'lampovaya nyasha1',
                        login: 'nyasha1',
                        password: 'nya'
                    };
                    request
                        .post('/users/register')
                        .send(regCase2)
                        .end(function (err, res) {
                            token = res.body.token;
                            request
                                .post('/users/add_phone')
                                .send(testCase)
                                .end(function (err, res) {
                                    expect(res.statusCode).to.equal(500)
                                })
                        });
                })
        })
    });

    describe('/users/register', function () {
        it('stores user credentials and password in db and issues a token back', function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(res.body.token).to.exist;
                    User.count({}, function (_, res) {
                        expect(res).to.equal(1);
                        User.findOne(function (_, user) {
                            Object.keys(registerCase).forEach(function (key) {
                                if (key == 'password') return;
                                expect(user[key]).to.equal(registerCase[key])
                            });
                            expect(user.phone).to.be.empty;
                            expect(user.hash).to.have.length.above(0);
                            expect(user.salt).to.have.length.above(0);
                            expect(user.confirm).to.have.length(4);
                            done();
                        });

                    });
                })
        });

        it('responds with error if login is not unique', function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    case2 = assign({}, registerCase);
                    case2.email += 'z';
                    request
                        .post('/users/register')
                        .send(case2)
                        .end(function (err, res) {
                            expect(res.body).to.eql({
                                'error': {
                                    'id': utils.http.errors.NOT_UNIQUE_FIELD.id,
                                    'description': utils.http.errors.NOT_UNIQUE_FIELD.description,
                                    'payload': 'login'
                                }
                            });
                            return done()
                        })
                    ;
                });
        });

        it('responds with error if email is not unique', function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    case2 = assign({}, registerCase);
                    case2.login += 'z';
                    request
                        .post('/users/register')
                        .send(case2)
                        .end(function (err, res) {
                            expect(res.body).to.eql({
                                'error': {
                                    'id': utils.http.errors.NOT_UNIQUE_FIELD.id,
                                    'description': utils.http.errors.NOT_UNIQUE_FIELD.description,
                                    'payload': 'email'
                                }
                            });
                            return done()
                        })
                    ;
                });
        });

        it('proceeds as normal if login and email are unique', function (done) {
            request
                .post('/users/register')
                .send(registerCase)
                .end(function (err, res) {
                    case2 = assign({}, registerCase);
                    case2.login += 'z';
                    case2.email += 'z';
                    request
                        .post('/users/register')
                        .send(case2)
                        .end(function (err, res) {
                            expect(res.statusCode).to.equal(200);
                            return done()
                        })
                    ;
                });
        });

    })

});

