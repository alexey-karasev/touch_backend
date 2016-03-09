/**
 * Created by Alexey Karasev on 19/02/16.
 */

var passport = require('passport');
var mongoose = require('mongoose');
var env = require('../env');
var sms = require('../sms/api');
var User = mongoose.model('User');
var utils = require('../utils');
var jwt = require('jsonwebtoken');

var SESSION_LENGTH=10*60; // 10 min
var TOKEN_LIFECYCLE = 60*60*24*30; //30 days

module.exports.reset = function (req, res) {
    utils.http.assertNotNull(res, 'phone', req.body.phone, function() {
        User.findOne({phone: req.body.phone}, function (err, user) {
            if (!user) {
                return utils.http.sendError(res, "NOT_FOUND");
            }
            var password = user.resetPassword();
            user.save(function (err) {
                if (err) {
                    utils.http.sendError(res, 'UNKNOWN', err)
                } else {
                    sms.send(req.body.phone, password, function (err) {
                        if (err) {
                            utils.http.sendError(res, 'UNKNOWN', err)
                        } else {
                            utils.http.send(res);
                        }
                    });
                }
            })
        });
    });

};

module.exports.register = function (req, res) {
    utils.http.assertNotNull(res, 'name', req.body.name, function () {
        utils.http.assertNotNull(res, 'email', req.body.email, function () {
            utils.http.assertNotNull(res, 'password', req.body.password, function () {
                utils.http.assertNotNull(res, 'login', req.body.login, function () {
                    utils.http.assertUnique(res, User, ['email', 'login'], [req.body.email, req.body.login], function () {
                        var user = new User();
                        user.name = req.body.name;
                        user.email = req.body.email;
                        user.login = req.body.login;
                        user.confirm = user.generateConfirm();
                        user.setPassword(req.body.password);
                        user.save(function (err) {
                            if (err) {
                                utils.http.sendError(res, 'UNKNOWN', err)
                            } else {
                                token = user.generateJwt(SESSION_LENGTH);
                                utils.http.send(res, {
                                    token: token
                                });
                            }
                        });
                    });
                });
            });
        });
    });
};

module.exports.login = function (req, res) {
    utils.http.assertNotNull(res, 'username', req.body.username, function () {
        utils.http.assertNotNull(res, 'password', req.body.password, function () {
            passport.authenticate('local', function (err, user, info) {
                var token;
                if (err) {
                    return utils.http.sendError(res, 'UNKNOWN', err);
                }
                if (user) {
                    if (user.confirmed) {
                        token = user.generateJwt(TOKEN_LIFECYCLE);
                        utils.http.send(res, {
                            "token": token
                        })
                    } else {
                        return utils.http.sendError(res, 'USER_NOT_CONFIRMED');
                    }

                } else {
                    return utils.http.sendError(res, 'UNAUTHORIZED', {}, 401);
                }
            })(req, res);

        });
    });


};

module.exports.addPhone = function (req, res) {
    utils.http.assertNotNull(res, 'phone', req.body.phone, function () {
        utils.http.assertNotNull(res, 'token', req.body.token, function () {
            var decoded;
            try {
                decoded = jwt.verify(req.body.token, env.jwtSecret);
            } catch (e) {
                utils.http.sendError(res, 'UNAUTHORIZED', {message: 'Invalid token'}, 401)
            }
            if ((!decoded.email) || (!decoded.login)) {
                utils.http.sendError(res, 'UNAUTHORIZED', {message: 'Missing email or login in token'}, 401)
            }
            utils.http.assertUnique(res, User, ['phone'], [req.body.phone], function () {
                User.findOne({email: decoded.email}, function (err, user) {
                    if (!user) {
                        return utils.http.sendError(res, 'NOT_FOUND', {message: 'User with specified email is not found'})
                    }
                    user.phone = req.body.phone;
                    user.save(function (err) {
                        if (err) {
                            return utils.http.sendError(res, 'UNKNOWN', err)
                        }
                        sms.send(user.phone,user.confirm, function(err) {
                            if (err) {
                                return utils.http.sendError(res, 'UNKNOWN', err)
                            }
                            var token = user.generateJwt(SESSION_LENGTH);
                            utils.http.send(res, {token: token})
                        });

                    })
                });
            });
        });
    });
};

module.exports.confirm = function (req, res) {
    utils.http.assertNotNull(res, 'token', req.body.token, function () {
        utils.http.assertNotNull(res, 'confirm', req.body.confirm, function () {
            var decoded;
            try {
                decoded = jwt.verify(req.body.token, env.jwtSecret);
            } catch (e) {
                utils.http.sendError(res, 'UNAUTHORIZED', {message: 'Invalid token'}, 401)
            }
            if ((!decoded.email) || (!decoded.login) || (!decoded.phone)) {
                utils.http.sendError(res, 'UNAUTHORIZED', {message: 'Missing email or login or phone in token'}, 401)
            }
            var phone = decoded.phone;
            User.findOne({phone: phone}, function (err, user) {
                if (err) {
                    return utils.http.sendError(res, 'UNKNOWN', err)
                }
                if (!user) {
                    return utils.http.sendError(res, 'NOT_FOUND')
                }

                if (user.confirm === req.body.confirm) {
                    user.confirmed = true;
                    user.save(function (err) {
                        if (err) {
                            return utils.http.sendError(res, 'UNKNOWN', err)
                        }
                        var token = user.generateJwt(TOKEN_LIFECYCLE);
                        return utils.http.send(res, {token: token})
                    });
                } else {
                    return utils.http.sendError(res, 'INVALID_PASSWORD');
                }
            })
        });
    });


};