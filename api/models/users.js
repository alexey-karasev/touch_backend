/**
 * Created by Alexey Karasev on 19/02/16.
 */

var mongoose = require( 'mongoose' );
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var env = require('../env');

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
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 31);

    return jwt.sign({
        _id: this._id,
        email: this.email,
        login: this.login,
        phone: this.phone,
        name: this.name,
        exp: parseInt(expiry.getTime() / 1000)
    }, env.jwtSecret);
};

mongoose.model('User', userSchema);