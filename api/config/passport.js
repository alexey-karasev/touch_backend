/**
 * Created by Alexey Karasev on 19/02/16.
 */

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

function _findUser(types, username, password) {
    var query = {};
    var type = types.pop();
    query[type] = username;
    User.findOne(query, function (err, user) {
        if (err) {
            throw err;
        }
        if ((!user) && (types.length > 0)) {
            _findUser(types, username, password)
        }
        return user;
    });
}

passport.use(new LocalStrategy(function (username, password, done) {
        var user;
        try {
            user = _findUser(['email', 'phone', 'login'], username, password)
        } catch (err) {
            done(err)
        }
        if ((!user) || (!user.validPassword(password))) {
            done(null, false, {message: 'Incorrect username or password'})
        }
        return done(null, user);
    }
));