/**
 * Created by Alexey Karasev on 20/02/16.
 */

var assign = require('object-assign');

var env = {name: process.env.NODE_ENV || 'development'};
var db = require('./config/database.js');
console.log(process.env.NODE_ENV);
env.db = db[env.name];

var secrets = require('./config/secrets.js');
env = assign(env, secrets);

module.exports = env;