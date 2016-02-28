/**
 * Created by Alexey Karasev on 20/02/16.
 */

var assign = require('object-assign');

var env = {name: process.env.NODE_ENV || 'development'};
var db = require('./config/database.js');
env.db = db[env.name];

var secrets = require('./config/secrets.js');
env = assign(env, secrets);

env.httpErrors = {
    'DUPLICATE_FIELD': {
        id: 'DUPLICATE_FIELD',
        message: "Trying to save entry, but some fields violate uniqueness"
    },
    'EMPTY_FIELD': {
        id: 'EMPTY_FIELD',
        message: "Trying to save entry, but some fields are empty"
    },
    'NOT_FOUND': {
        id: 'NOT_FOUND',
        message: "The record with specified parameters was not found"
    }
};

module.exports = env;