/**
 * Created by Alexey Karasev on 27/02/16.
 */

var assign = require('object-assign');

module.exports.http = {
    errors: {
        'NOT_UNIQUE_FIELD': {
            id: 'NOT_UNIQUE_FIELD',
            description: "Trying to save entry, but some fields violate uniqueness"
        },
        'EMPTY_FIELD': {
            id: 'EMPTY_FIELD',
            description: "Trying to save entry, but some fields are empty"
        },
        'NOT_FOUND': {
            id: 'NOT_FOUND',
            description: "The record with specified parameters was not found"
        },
        'INVALID_USER_CREDENTIALS': {
            id: 'INVALID_USER_CREDENTIALS',
            description: "The login / password pair is invalid"
        },
        'USER_NOT_CONFIRMED': {
            id: 'USER_NOT_CONFIRMED',
            description: "The user has not confirmed his/her phone"
        },
        'UNKNOWN': {
            id: 'UNKNOWN',
            description: "Unknown server error"
        }
    },

    sendError: function (res, error, payload, code) {
        code = code || 500;
        payload = payload || {};
        res.status(code);
        error = this.errors[error];
        error = assign({'payload': payload}, error);
        res.json({'error': error});
    },

    send: function (res, payload, code) {
        payload = payload || {};
        code = code || 200;
        res.status(code);
        res.json(payload);
    },

    assertNotNull: function (res, name, value) {
        if (!value) {
            this.sendError(res, 'EMPTY_FIELD', name)
        }
    },

    assertUnique: function (res, model, names, values, done) {
        if (names.length != values.length) {
            throw 'Invalid arguments to assertUnique: names - ' + names + ' values - ' + values
        }
        if (names.length == 0) {
            return done()
        }
        var query = [];
        for (var i = 0; i < names.length; i++) {
            var name = names[i].toString();
            var value = values[i].toString();
            var lexem = {};
            lexem[name] = value;
            query.push(lexem)
        }
        var self = this;
        model.find({'$or': query}, function (err, result) {
            if (err) {
                this.sendError("UNKNOWN", err);
                return
            }
            if (result.length == 0) {
                return done();

            }
            var item = result[0];
            for (var i = 0; i < names.length; i++) {
                var name = names[i];
                if (item[name] == values[i]) {
                    self.sendError(res, "NOT_UNIQUE_FIELD", name);
                    return
                }
            }
            throw "Assert unique - internal logic error"
        })
    }
};