/**
 * Created by Alexey Karasev on 20/02/16.
 */

var mongoose = require('mongoose');

module.exports.clearDB = function () {
    mongoose.connection.db.dropDatabase();
};