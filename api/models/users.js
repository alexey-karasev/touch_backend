/**
 * Created by Alexey Karasev on 19/02/16.
 */

var mongoose = require( 'mongoose' );
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var env = require('../env');
var assign = require('object-assign');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index:true
    },
    name: {
        type: String,
        required: true
    },
    login: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        index: true
    },
    confirm: {
        type: String,
        required: true
    },
    confirmed: {
        type: Boolean,
        required: true,
        default: false
    },
    hash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }
});

userSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

userSchema.methods.resetPassword = function() {
    random = Math.random().toString(10).substr(-4); //random string of 4 numbers
    this.setPassword(random);
    return random;
};

userSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
    return this.hash === hash;
};

userSchema.methods.generateConfirm = function() {
    rand = Math.floor(Math.random() * 9999);
    return ('0000'+rand.toString()).substr(-4); //last four digits
};

userSchema.methods.generateJwt = function() {
    var data = {};
    ['_id', 'email', 'login', 'phone', 'confirmed'].forEach(function(name) {
        if (name in this) {
            var lexem = {};
            lexem[name] = this[name];
            data = assign(lexem, data)
        }
    }, this);
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 31);
    data = assign({'exp': parseInt(expiry.getTime() / 1000)}, data);
    return jwt.sign(data, env.jwtSecret);
};

mongoose.model('User', userSchema);