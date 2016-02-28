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

var sendConfirmation = function (user, done) {
    var phone = user.phone;
    var confirm = user.confirm;
    sms.send(phone, confirm, done);
};

module.exports.reset = function (req, res) {

    if (!req.body.phone) {
        sendJSONresponse(res, 400, {
            "message": "All fields required"
        });
        return;
    }

    User.findOne({phone: req.body.phone}, function (err, user) {
        if (!user) {
            sendJSONresponse(res, 404);
            return
        }
        var password = user.resetPassword();
        user.save(function (err) {
            if (err) {
                sendJSONresponse(res, 404, err);
            } else {
                sms.send(req.body.phone, password, function (err) {
                    if (err) {
                        sendJSONresponse(res, 404, err);
                    } else {
                        sendJSONresponse(res, 200);
                    }
                });
            }
        })
    });
};

module.exports.register = function (req, res) {
    utils.http.assertNotNull(res, 'name', req.body.name);
    utils.http.assertNotNull(res, 'email', req.body.email);
    utils.http.assertNotNull(res, 'password', req.body.password);
    utils.http.assertNotNull(res, 'login', req.body.login);
    utils.http.assertUnique(res, User, ['email', 'login'], [req.body.email, req.body.login], function () {
        var user = new User();

        user.name = req.body.name;
        user.email = req.body.email;
        user.login = req.body.login;
        user.confirm = user.generateConfirm();
        user.setPassword(req.body.password);
        user.save(function (err) {
            if (err) {
                utils.http.sendError(res, 'NOT_FOUND', err)
            } else {
                token = user.generateJwt();
                utils.http.send(res, {
                    token: token
                });
            }
        });
    });


};

module.exports.login = function (req, res) {
    utils.http.assertNotNull(res,'username', req.body.username);
    utils.http.assertNotNull(res,'password', req.body.password);
    passport.authenticate('local', function (err, user, info) {
        var token;
        if (err) {return utils.http.sendError(res, 'UNKNOWN', err);}
        if (user) {
            if (user.confirmed) {
                token = user.generateJwt();
                utils.http.send(res, {
                    "token": token
                })
            } else {
                return utils.http.sendError(res, 'USER_NOT_CONFIRMED', {}, 401);
            }

        } else {
            return utils.http.sendError(res, 'INVALID_USER_CREDENTIALS', {}, 401);
        }
    })(req, res);

};

module.exports.addPhone = function (req, res) {
    utils.http.assertNotNull(res, 'phone', req.body.phone);
    utils.http.assertNotNull(res, 'token', req.body.token);
    var decoded;
    try {
        decoded = jwt.verify(req.body.token, env.jwtSecret);
    } catch (e) {
        utils.http.sendError(res, 'INVALID_USER_CREDENTIALS', {message:'Invalid token'}, 401)
    }
    if ((!decoded.email) || (!decoded.login)) {
        utils.http.sendError(res, 'INVALID_USER_CREDENTIALS', {message:'Missing email or login in token'}, 401)
    }
    utils.http.assertUnique(res, User, ['phone'], [req.body.phone], function(){
        User.findOne({email:decoded.email}, function(err, user){
            if (!user) {
                return utils.http.sendError(res, 'NOT_FOUND', {message:'User with specified email is not found'})
            }
            user.phone = req.body.phone;
            user.save(function(err) {
                if (err) {
                    return utils.http.sendError(res, 'UNKNOWN', err)
                }
                var token = user.generateJwt();
                utils.http.send(res, {token: token})
            })
        });
    });


};

module.exports.confirm = function (req, res) {
    if (!req.body.phone || !req.body.confirm) {
        sendJSONresponse(res, 400, {
            "message": "All fields required"
        });
        return;
    }

    User.findOne({phone: req.body.phone}, function (err, user) {
        if (err) {
            sendJSONresponse(res, 404, err);
            return;
        }
        if (user.confirm === req.body.confirm) {
            user.confirmed = true;
            user.save(function (err) {
                if (err) {
                    sendJSONresponse(res, 404, err);
                    return;
                }
                sendJSONresponse(res, 200);
            });
        } else {
            sendJSONresponse(res, 403, {message: 'Invalid confirm code'});
        }
    })

};