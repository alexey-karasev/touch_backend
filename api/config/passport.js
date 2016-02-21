/**
 * Created by Alexey Karasev on 19/02/16.
 */

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

function _findUser(types, username, password, done) {
    var query = {};
    var type = types.shift();
    query[type] = username;
    User.findOne(query, function (err, user) {
        if (err) {
            done(err,null);
        }
        if ((!user) && (types.length > 0)) {
            _findUser(types, username, password, done)
        } else {
            done(err, user);
        }
    });
}

passport.use(new LocalStrategy(function (username, password, done) {
        var user;
        _findUser(['email', 'phone', 'login'], username, password, function (err, res) {
            user = res;
            if (user && (!user.validPassword(password) || !user.confirmed)) user = null;
            return done(err, user);
        })
    }
));