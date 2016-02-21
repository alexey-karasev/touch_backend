/**
 * Created by Alexey Karasev on 19/02/16.
 */

var passport = require('passport');
var mongoose = require('mongoose');
var env = require('../env');
var sms = require('../sms/api');
var User = mongoose.model('User');


var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

var sendConfirmation = function (user) {
    var phone = user.phone;
    var confirm = user.confirm;
    if (env.name === 'production') {
        sms.send(phone, confirm);
    } else {
        console.log('Sent confirmation ' + confirm + ' to phone ' + phone);
    }
};

module.exports.register = function (req, res) {
    if (!req.body.name || !req.body.email || !req.body.login || !req.body.phone || !req.body.password) {
        sendJSONresponse(res, 400, {
            "message": "All fields required"
        });
        return;
    }

    var user = new User();

    user.name = req.body.name;
    user.email = req.body.email;
    user.login = req.body.login;
    user.phone = req.body.phone;
    user.confirm = user.generateConfirm();

    user.setPassword(req.body.password);

    user.save(function (err) {
        var token;
        if (err) {
            sendJSONresponse(res, 404, err);
        } else {
            token = user.generateJwt();
            sendJSONresponse(res, 200, {
                "token": token
            });
        }
    });

};

module.exports.login = function (req, res) {
    if (!req.body.username || !req.body.password) {
        sendJSONresponse(res, 400, {
            "message": "All fields required"
        });
        return;
    }

    passport.authenticate('local', function (err, user, info) {
        var token;

        if (err) {
            sendJSONresponse(res, 404, err);
            return;
        }

        if (user) {
            token = user.generateJwt();
            sendJSONresponse(res, 200, {
                "token": token
            });
        } else {
            sendJSONresponse(res, 401, info);
        }
    })(req, res);

};